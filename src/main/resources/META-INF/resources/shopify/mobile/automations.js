(function (root, factory) {
    var api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root && root.document) api.mount(root);
}(typeof window === 'undefined' ? null : window, function () {
    'use strict';
    function editableDefinition(d) {
        if (!d || !['ABANDONED_CART','BROWSE_ABANDONMENT','POST_PURCHASE'].includes(d.journeyType)
            || !['DRAFT','PAUSED','ACTIVE'].includes(d.status) || !['NONE','FIXED_CODE'].includes(d.couponMode)) return false;
        if (['automationId','name','triggerEvent','templateId','provider','utmSource','utmMedium'].some(function (key) { return typeof d[key] !== 'string' || !d[key].trim(); })) return false;
        if (!Number.isInteger(d.waitMinutes) || d.waitMinutes < 1 || d.waitMinutes > 43200
            || !Number.isInteger(d.frequencyDays) || d.frequencyDays < 0 || d.frequencyDays > 365
            || typeof d.exitOnPurchase !== 'boolean') return false;
        if (d.couponMode === 'FIXED_CODE' && (typeof d.discountSourceId !== 'string' || !d.discountSourceId.trim())) return false;
        if (d.couponMode === 'NONE' && d.discountSourceId) return false;
        if (['utmCampaign','utmContent'].some(function (key) { return d[key] != null && typeof d[key] !== 'string'; })) return false;
        if (d.couponValue != null && !(typeof d.couponValue === 'string' && /^-?\d+(\.\d+)?$/.test(d.couponValue)) && !(typeof d.couponValue === 'number' && Number.isSafeInteger(d.couponValue))) return false;
        return true;
    }
    function editStatus(status) { return status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED'; }
    function guardForms(forms, confirmAction) {
        var pending = false, buttons = [];
        forms.forEach(function (form) {
            Array.prototype.forEach.call(form.querySelectorAll('button[type="submit"]'), function (button) { button.disabled = false; buttons.push(button); });
            form.addEventListener('submit', function (event) {
                if (pending || (form.dataset.requiresReady === 'true' && form.dataset.ready !== 'true') || (form.dataset.confirmMessage && !confirmAction(form.dataset.confirmMessage))) { event.preventDefault(); return; }
                pending = true; buttons.forEach(function (button) { button.disabled = true; });
            });
        });
        return function () { pending = false; buttons.forEach(function (button) { button.disabled = false; }); };
    }
    function display(value) { return value === null || value === undefined || value === '' ? '—' : String(value); }
    function eventLabel(value) {
        var labels = {PAGE_VIEWED:'浏览页面', CLICKED:'点击页面', PRODUCT_VIEWED:'查看商品', SEARCH_SUBMITTED:'提交搜索', PRODUCT_ADDED_TO_CART:'加入购物车', CHECKOUT_STARTED:'开始结账', CHECKOUT_COMPLETED:'完成结账'};
        return Object.prototype.hasOwnProperty.call(labels, value) ? labels[value] : display(value);
    }
    function formatTime(value, locale, zone) {
        if (value === null || value === undefined || value === '') return '—';
        var text = String(value), numeric = /^-?\d+(\.\d+)?$/.test(text) ? Number(text) : NaN;
        var date = Number.isFinite(numeric) ? new Date(Math.abs(numeric) < 100000000000 ? numeric * 1000 : numeric) : new Date(text);
        if (isNaN(date.getTime())) return '—';
        return new Intl.DateTimeFormat(locale || undefined, {timeZone:zone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', timeZoneName:'short'}).format(date);
    }
    function customerElement(doc, base, shop, id, name) {
        var hasId = typeof id === 'string' && id.trim().length > 0;
        var item = doc.createElement(hasId ? 'a' : 'strong');
        item.textContent = display(name || id);
        if (hasId) item.href = base + '?' + new URLSearchParams({shop:shop, customerId:id}).toString();
        return item;
    }
    function mount(win) {
        var root = win.document.querySelector('[data-mobile-automations]');
        if (!root || !root.dataset.shop) return;
        var doc = win.document, shop = root.dataset.shop;
        var forms = Array.prototype.slice.call(root.querySelectorAll('[data-automation-action]'));
        var resetGuard = guardForms(forms, function (message) { return win.confirm(message); });
        win.addEventListener('pageshow', function (event) { if (event.persisted) resetGuard(); });
        var detail = root.querySelector('[data-automation-detail]'), content = root.querySelector('[data-detail-content]'), state = root.querySelector('[data-detail-state]');
        var filter = root.querySelector('[data-detail-filter]'), currentId = '', currentPage = 1, totalPages = 1, requestId = 0;
        var editor = root.querySelector('[data-automation-editor]'), editorForm = root.querySelector('[data-automation-editor-form]'), couponRequest = 0;
        var detailTrigger = null, editorTrigger = null;
        function returnTo(trigger) {
            if (!trigger || trigger.isConnected === false) return;
            if (typeof trigger.focus === 'function') {
                try { trigger.focus({preventScroll:true}); } catch (error) { trigger.focus(); }
            }
            if (typeof trigger.scrollIntoView === 'function') {
                try { trigger.scrollIntoView({block:'center',behavior:'smooth'}); } catch (error) { trigger.scrollIntoView(); }
            }
        }
        function clear(node) { if (node) node.replaceChildren(); }
        function element(tag, text) { var node = doc.createElement(tag); node.textContent = display(text); return node; }
        function failure(response) {
            if (response.status === 401 || response.redirected) return '登录状态可能已过期，请重新进入应用。';
            if (response.status === 403) return '没有权限访问当前店铺。';
            return response.ok ? '' : '读取失败，请稍后重试。';
        }
        function getJson(url) {
            return win.fetch(url, {credentials:'same-origin', cache:'no-store', headers:{Accept:'application/json'}}).then(function (response) {
                var error = failure(response), type = response.headers.get('content-type') || '';
                if (!error && type && !/json/i.test(type)) error = '登录状态可能已过期，请重新进入应用。';
                if (error) throw new Error(error);
                return response.json();
            });
        }
        function detailUrl(id, page) {
            var params = new URLSearchParams({shop:shop, automationId:id, page:String(page), size:'20', q:filter.elements.q.value, lifecycle:filter.elements.lifecycle.value, provider:'ALL'});
            return root.dataset.detailUrl + '?' + params.toString();
        }
        function pair(container, label, value) { var row = doc.createElement('div'); row.appendChild(element('dt', label)); row.appendChild(element('dd', value)); container.appendChild(row); }
        function drawDetail(data) {
            var d = data.definition || {}, s = data.summary || {}, def = root.querySelector('[data-detail-definition]'), metrics = root.querySelector('[data-detail-metrics]');
            root.querySelector('[data-detail-name]').textContent = display(d.name);
            clear(def); clear(metrics);
            [['状态',({ACTIVE:'生效',PAUSED:'已暂停',DRAFT:'草稿'})[d.status] || d.status], ['旅程类型',({ABANDONED_CART:'购物车挽回',BROWSE_ABANDONMENT:'浏览挽回',POST_PURCHASE:'购买后跟进'})[d.journeyType] || d.journeyType], ['触发事件',eventLabel(d.triggerEvent)], ['等待分钟',d.waitMinutes], ['频控天数',d.frequencyDays], ['邮件模板',d.templateName], ['通道',d.provider], ['发件邮箱',d.sender], ['优惠券',d.discountSourceId], ['购买后退出',d.exitOnPurchase === true ? '是' : d.exitOnPurchase === false ? '否' : '—'], ['UTM 来源',d.utmSource], ['UTM 媒介',d.utmMedium], ['UTM 活动',d.utmCampaign || d.name], ['UTM 内容',d.utmContent || '按链接自动生成']].forEach(function (row) { pair(def,row[0],row[1]); });
            [['触发',s.triggeredCount],['等待中',s.waitingCount],['发送',s.sentCount],['接受',s.acceptedCount],['送达',s.deliveredCount],['打开人数',s.openedRecipientCount],['点击人数',s.clickedRecipientCount],['转化订单',s.orderCount],['净收入',s.netRevenue]].forEach(function (row) { var box=doc.createElement('div'); box.appendChild(element('span',row[0])); box.appendChild(element('strong',row[1])); metrics.appendChild(box); });
            var ga4=data.ga4Evaluation || {}; root.querySelector('[data-detail-ga4]').textContent = display(ga4.statusDisplayName) + ' · ' + display(ga4.statusMessage) + (ga4.showMetrics ? ' · 购买 ' + display(ga4.purchaseCountDisplay) + ' · 收入 ' + display(ga4.purchaseRevenueDisplay) + ' ' + display(ga4.currency) : '');
            var page=data.journeys || {}, host=root.querySelector('[data-detail-journeys]'); clear(host);
            var journeys=Array.isArray(page.items) ? page.items : [];
            if (!journeys.length) host.appendChild(element('p','暂无客户旅程'));
            journeys.forEach(function (j) { var card=doc.createElement('article'); card.className='ma-journey'; card.appendChild(customerElement(doc,root.dataset.customerUrl,shop,j.customerSourceId,j.customerName)); card.appendChild(element('p',display(j.email) + ' · ' + display(j.exitReason || j.status))); card.appendChild(element('p','触发 ' + formatTime(j.triggeredAt) + ' · 计划 ' + formatTime(j.dueAt))); card.appendChild(element('p','实际发送 ' + formatTime(j.sentAt) + ' · 通道 ' + display(j.provider))); card.appendChild(element('p','打开 ' + display(j.openedCount) + ' · 点击 ' + display(j.clickedCount) + ' · 订单 ' + display(j.orderCount))); host.appendChild(card); });
            currentPage = Number(page.page) || 1; totalPages = Number(page.totalPages) || 1;
            root.querySelector('[data-journey-page]').textContent = '第 ' + currentPage + ' / ' + totalPages + ' 页';
            root.querySelector('[data-journey-prev]').disabled = currentPage <= 1; root.querySelector('[data-journey-next]').disabled = currentPage >= totalPages;
        }
        function loadDetail(id, page, editing) {
            currentId = id; var request = ++requestId;
            if (editorForm) { ++couponRequest; editor.hidden=true; editorForm.dataset.ready='false'; }
            if (editing) { detail.hidden=true; content.hidden=true; }
            if (!editing) { detail.hidden=false; content.hidden=true; state.hidden=false; state.textContent='正在加载旅程详情…'; detail.scrollIntoView({behavior:'smooth',block:'start'}); }
            return getJson(detailUrl(id,page)).then(function (data) {
                if (request !== requestId) return;
                if (editing) { openEditor(data.definition); return; }
                drawDetail(data); state.hidden=true; content.hidden=false;
            }).catch(function (error) { if (request !== requestId) return; if (editing) { editor.hidden=false; editorForm.hidden=true; editorError(error.message || '规则读取失败，请稍后重试。'); } else { state.hidden=false; state.textContent=error.message || '读取失败，请稍后重试。'; } });
        }
        function editorError(message) { var n=root.querySelector('[data-editor-error]'); n.textContent=message; n.hidden=false; if (editorForm) { editorForm.dataset.ready='false'; editorForm.querySelector('button[type="submit"]').disabled=true; } }
        function available(name,value) { return Array.prototype.some.call(editorForm.elements[name].options, function (o) { return o.value === String(value); }); }
        function updateSender() { var s=editorForm.elements.provider; root.querySelector('[data-sender-preview]').textContent = s.selectedOptions.length ? '发件身份：' + (s.selectedOptions[0].dataset.sender || '—') : ''; }
        function updateCoupon() { var fixed=editorForm.elements.couponMode.value === 'FIXED_CODE'; root.querySelector('[data-coupon-fields]').hidden=!fixed; editorForm.elements.discountSourceId.required=fixed; }
        function loadDiscounts(selected) {
            var select=editorForm.elements.discountSourceId, status=root.querySelector('[data-coupon-state]'), save=editorForm.querySelector('button[type="submit"]');
            var request = ++couponRequest;
            status.textContent='正在读取优惠券…'; editorForm.dataset.ready='false'; select.disabled=true; save.disabled=true;
            var params=new URLSearchParams({shop:shop,q:root.querySelector('[data-coupon-query]').value});
            return getJson(root.dataset.discountUrl+'?'+params.toString()).then(function (items) {
                if (request !== couponRequest || editorForm.dataset.supported !== 'true') return;
                if (!Array.isArray(items)) throw new Error('优惠券数据不可用');
                select.replaceChildren(new Option('请选择有效优惠券',''));
                items.forEach(function (item) { if (item.sourceId) select.add(new Option([item.code,item.title,item.summary].filter(Boolean).join(' · '),item.sourceId)); });
                if (selected && !available('discountSourceId',selected)) select.add(new Option('当前优惠券 · '+selected,selected));
                select.value=selected || ''; status.textContent=''; select.disabled=false; editorForm.dataset.ready='true'; save.disabled=false;
            }).catch(function () { if (request !== couponRequest || editorForm.dataset.supported !== 'true') return; status.textContent='优惠券加载失败，请重试。'; select.disabled=true; save.disabled=true; });
        }
        function openEditor(d) {
            if (!editor || !editorForm) return;
            ++couponRequest; editor.hidden=false; editorForm.hidden=false; root.querySelector('[data-editor-error]').hidden=true; editorForm.reset(); editorForm.dataset.supported='false'; editorForm.dataset.ready='false';
            var save=editorForm.querySelector('button[type="submit"]');
            if (d && (!editableDefinition(d) || ['journeyType','triggerEvent','templateId','provider','couponMode'].some(function (key) { return !available(key,d[key]); }))) {
                editorError('当前规则包含不支持或不可用的配置，请在电脑端检查后编辑。'); editorForm.hidden=true; editor.scrollIntoView({behavior:'smooth',block:'start'}); return;
            }
            editorForm.action = d ? root.dataset.updateUrl : root.dataset.createUrl;
            editorForm.elements.automationId.value = d ? d.automationId : '';
            editorForm.dataset.supported='true';
            editorForm.elements.status.value = editStatus(d && d.status);
            root.querySelector('[data-editor-title]').textContent=d ? '编辑自动营销' : '新建自动营销';
            root.querySelector('[data-editor-status]').textContent=d ? (d.status === 'ACTIVE' ? '保存后规则保持生效；如需暂停请先使用暂停操作。' : '保存后规则保持禁用。') : '新建规则默认禁用；保存后可单独启用。';
            editorForm.dataset.confirmMessage=d && d.status === 'ACTIVE' ? '确认保存？此规则将保持生效，符合条件的客户可能收到邮件。' : '确认保存自动营销规则？规则将保持禁用。';
            if (d) {
                ['name','journeyType','triggerEvent','waitMinutes','frequencyDays','templateId','provider','couponMode','utmSource','utmMedium','utmCampaign','utmContent','couponValue'].forEach(function (key) { editorForm.elements[key].value = d[key] === null || d[key] === undefined ? '' : String(d[key]); });
                editorForm.elements.exitOnPurchase.checked=d.exitOnPurchase;
            }
            updateSender(); updateCoupon(); editorForm.dataset.ready='true'; save.disabled=false;
            if (d && d.couponMode === 'FIXED_CODE') loadDiscounts(d.discountSourceId);
            if (!d && (!editorForm.elements.templateId.options.length || editorForm.elements.templateId.options.length === 1 || editorForm.elements.provider.options.length <= 1)) { editorError('请先准备已发布模板和可用发件通道。'); editorForm.hidden=true; }
            editor.scrollIntoView({behavior:'smooth',block:'start'});
        }
        root.querySelectorAll('[data-automation-view], [data-automation-edit]').forEach(function (button) { button.disabled=false; button.addEventListener('click', function () { var row=button.closest('[data-automation-row]'), editing=button.hasAttribute('data-automation-edit'); if (editing) editorTrigger=button; else { detailTrigger=button; filter.elements.q.value=''; filter.elements.lifecycle.value='ALL'; } loadDetail(row.dataset.id,1,editing); }); });
        var create=root.querySelector('[data-automation-new]'); if (create && editorForm) { create.disabled=false; create.addEventListener('click',function () { ++requestId; currentId=''; detail.hidden=true; editorTrigger=create; openEditor(null); }); }
        root.querySelector('[data-detail-close]').addEventListener('click',function () { detail.hidden=true; currentId=''; ++requestId; returnTo(detailTrigger); });
        filter.addEventListener('submit',function (event) { event.preventDefault(); if(currentId) loadDetail(currentId,1,false); });
        root.querySelector('[data-journey-prev]').addEventListener('click',function () { if(currentId && currentPage>1) loadDetail(currentId,currentPage-1,false); });
        root.querySelector('[data-journey-next]').addEventListener('click',function () { if(currentId && currentPage<totalPages) loadDetail(currentId,currentPage+1,false); });
        if (editorForm) {
            root.querySelector('[data-editor-close]').addEventListener('click',function () { ++requestId; ++couponRequest; editor.hidden=true; editorForm.dataset.ready='false'; returnTo(editorTrigger); });
            editorForm.elements.provider.addEventListener('change',updateSender);
            editorForm.elements.couponMode.addEventListener('change',function () { updateCoupon(); if (editorForm.dataset.supported !== 'true') return; if (editorForm.elements.couponMode.value === 'FIXED_CODE') loadDiscounts(''); else { ++couponRequest; editorForm.dataset.ready='true'; editorForm.querySelector('button[type="submit"]').disabled=false; } });
            root.querySelector('[data-coupon-search]').addEventListener('click',function () { if (editorForm.dataset.supported === 'true') loadDiscounts(editorForm.elements.discountSourceId.value); });
        }
    }
    return { editableDefinition: editableDefinition, editStatus: editStatus, guardForms: guardForms, eventLabel:eventLabel, formatTime:formatTime, customerElement:customerElement, mount: mount };
}));
