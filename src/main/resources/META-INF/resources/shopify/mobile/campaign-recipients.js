(function (root, factory) {
    var api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root && root.document) api.init(root);
}(typeof window === 'undefined' ? null : window, function () {
    'use strict';
    var states = ['ALL','PENDING','ACCEPTED','NO_FEEDBACK','DELIVERED','OPENED','CLICKED','CONVERTED','FAILED','UNKNOWN','BOUNCED','UNSUBSCRIBED','COMPLAINT'];
    function normalizeFilters(value) {
        value = value || {};
        return {q:typeof value.q === 'string' ? value.q.trim().slice(0,255) : '',
            provider:typeof value.provider === 'string' && /^[A-Z0-9_-]{1,64}$/.test(value.provider) ? value.provider : 'ALL',
            lifecycle:states.indexOf(value.lifecycle) >= 0 ? value.lifecycle : 'ALL'};
    }
    function pageNumber(value) {
        var page = Number(value);
        return Number.isSafeInteger(page) && page > 0 && page <= 1000000 ? page : 1;
    }
    function requestUrl(endpoint, origin, shop, campaign, filters, page) {
        var url = new URL(endpoint, origin);
        if (url.origin !== origin || !/\/campaigns\/detail\/recipients$/.test(url.pathname)) throw new Error('Invalid recipient endpoint');
        url.search = ''; url.hash = '';
        url.searchParams.set('shop', shop); url.searchParams.set('campaignId', campaign);
        var values = normalizeFilters(filters);
        Object.keys(values).forEach(function (key) { url.searchParams.set(key, values[key]); });
        url.searchParams.set('page', pageNumber(page)); url.searchParams.set('size','10');
        url.searchParams.set('view','mobile');
        return url.href;
    }
    function install(win, root) {
        var form = root.querySelector('[data-recipient-form]');
        var host = root.querySelector('[data-recipient-results]');
        var status = root.querySelector('[data-recipient-state]');
        var clear = root.querySelector('[data-recipient-clear]');
        if (!form || !host || !status) return;
        var key = root.dataset.user && !/^:*$/.test(root.dataset.user)
            ? 'mobile-campaign-recipients:' + JSON.stringify([root.dataset.context || '',root.dataset.user,root.dataset.shop,root.dataset.campaign]) : null;
        var saved = null;
        try { if (key) saved = JSON.parse(win.sessionStorage.getItem(key)); } catch (error) { /* State persistence is optional. */ }
        var params = new URL(win.location.href).searchParams;
        var explicit = ['q','provider','lifecycle','page'].some(function (name) { return params.has(name); });
        if (saved && !explicit) {
            var restored = normalizeFilters(saved);
            Object.keys(restored).forEach(function (name) {
                form.elements[name].value = restored[name];
                if (name !== 'q' && !form.elements[name].value) form.elements[name].value = 'ALL';
            });
        }
        var navigation = win.performance && win.performance.getEntriesByType ? win.performance.getEntriesByType('navigation')[0] : null;
        var restoreScroll = navigation && navigation.type === 'back_forward' && saved && Number.isFinite(saved.scroll);
        var generation = 0, controller = null, applied = null, currentPage = 1;
        function readFilters() {
            return normalizeFilters({q:form.elements.q.value,provider:form.elements.provider.value,lifecycle:form.elements.lifecycle.value});
        }
        function remember() {
            if (!key || !applied) return;
            try { win.sessionStorage.setItem(key,JSON.stringify(Object.assign({},applied,{page:currentPage,scroll:win.scrollY}))); }
            catch (error) { /* Browsing remains usable when storage is blocked. */ }
        }
        function reveal(target) {
            if (typeof target.scrollIntoView !== 'function') return;
            win.requestAnimationFrame(function () {
                try { target.scrollIntoView({block:'start'}); } catch (error) { target.scrollIntoView(true); }
            });
        }
        function load(page) {
            var filters = readFilters();
            var interactive = applied !== null;
            page = pageNumber(page);
            if (page > 1 && applied && JSON.stringify(filters) !== JSON.stringify(applied)) page = 1;
            var version = ++generation;
            if (controller) controller.abort();
            controller = win.AbortController ? new win.AbortController() : null;
            host.setAttribute('aria-busy','true');
            status.textContent = '正在读取收件人明细…';
            var options = {credentials:'same-origin',cache:'no-store',headers:{Accept:'text/html'}};
            if (controller) options.signal = controller.signal;
            return win.fetch(requestUrl(root.dataset.url,win.location.origin,root.dataset.shop,root.dataset.campaign,filters,page),options)
                .then(function (response) {
                    if (version !== generation) return null;
                    var message;
                    if (response.status === 401 || response.redirected) message = '登录状态可能已过期，请返回应用重新进入。';
                    else if (response.status === 403) message = '没有权限查看当前活动的收件人明细。';
                    else if (response.status < 200 || response.status >= 300) message = '明细读取失败，请点击“查询”重试。';
                    var type = response.headers.get('content-type') || '';
                    if (!message && type && !/\bhtml\b/i.test(type)) message = '明细暂不可用，请稍后重新查询。';
                    if (message) { var failure = new Error(message); failure.recipientMessage = true; failure.recipientStatus = response.status; throw failure; }
                    return response.text();
                }).then(function (html) {
                    if (version !== generation || html === null) return;
                    var parsed = new win.DOMParser().parseFromString(html,'text/html');
                    var result = parsed.querySelector('[data-mobile-recipient-results]');
                    if (!result) throw new Error('Missing recipient results');
                    host.replaceChildren(win.document.importNode(result,true));
                    host.querySelectorAll('[data-recipient-provider]').forEach(function (label) {
                        Array.prototype.some.call(form.elements.provider.options,function (option) {
                            if (option.value !== label.dataset.recipientProvider) return false;
                            label.textContent = option.text.trim(); return true;
                        });
                    });
                    applied = filters; currentPage = pageNumber(result.dataset.page);
                    remember();
                    status.textContent = '已加载第 ' + currentPage + ' 页收件人明细。';
                    if (restoreScroll) {
                        restoreScroll = false;
                        win.requestAnimationFrame(function () { win.scrollTo(0,Math.max(0,saved.scroll)); });
                    } else if (interactive) reveal(host);
                }).catch(function (error) {
                    if (version !== generation) return;
                    if (error && (error.recipientStatus === 401 || error.recipientStatus === 403 || /登录状态/.test(error.message))) {
                        host.replaceChildren(); applied = null;
                    }
                    status.textContent = error && error.recipientMessage ? error.message : '明细读取失败，请点击“查询”重试。';
                    if (applied) status.textContent += ' 下方保留上一次成功查询的结果。';
                    if (interactive) reveal(status);
                }).finally(function () { if (version === generation) host.removeAttribute('aria-busy'); });
        }
        form.addEventListener('submit',function (event) { event.preventDefault(); load(1); });
        if (clear) clear.addEventListener('click',function () {
            form.elements.q.value = ''; form.elements.provider.value = 'ALL'; form.elements.lifecycle.value = 'ALL'; load(1);
        });
        host.addEventListener('click',function (event) {
            var pager = event.target.closest('[data-recipient-page]');
            if (pager && !pager.disabled) { event.preventDefault(); load(pager.dataset.recipientPage); }
            else if (event.target.closest('[data-recipient-customer]')) remember();
        });
        load(saved && !explicit ? saved.page : params.get('page'));
        return {load:load};
    }
    function init(win) {
        var root = win.document.querySelector('[data-mobile-recipients]');
        if (root) return install(win,root);
    }
    return {normalizeFilters:normalizeFilters,requestUrl:requestUrl,install:install,init:init};
}));
