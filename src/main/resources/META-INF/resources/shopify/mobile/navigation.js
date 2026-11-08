(function (root, factory) {
    var api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root && root.document) api.init(root, root.document.currentScript);
}(typeof window === 'undefined' ? null : window, function () {
    'use strict';

    function matchingShops(shops, query) {
        var search = String(query || '').trim().toLocaleLowerCase();
        return shops.filter(function (shop) {
            return (shop.name + ' ' + shop.id).toLocaleLowerCase().includes(search);
        });
    }

    function listReturnUrl(raw, origin, context, shop, area) {
        try {
            var customerList = area === 'customers';
            var source = new URL(raw, origin);
            if (source.origin !== origin || source.pathname !== context + '/mobile/' + (customerList ? 'customers' : 'campaigns')
                    || source.searchParams.get('shop') !== shop) return null;
            var result = new URL(source.pathname, origin);
            var keys = customerList
                ? ['shop', 'q', 'activity', 'tag', 'fromDate', 'toDate', 'minSpent', 'maxSpent', 'minBehaviorCount', 'maxBehaviorCount', 'minUniqueBehaviorCount', 'maxUniqueBehaviorCount', 'page']
                : ['shop', 'q', 'status', 'fromDate', 'toDate', 'page', 'size'];
            keys.forEach(function (key) {
                source.searchParams.getAll(key).forEach(function (value) { result.searchParams.append(key, value); });
            });
            return result.pathname + result.search;
        } catch (error) { return null; }
    }

    function dateRangeValid(from, to) {
        return !from || !to || from <= to;
    }

    function customerPreviewUrl(raw, origin, context, shop) {
        try {
            var source = new URL(raw, origin);
            var id = source.searchParams.get('customerId');
            if (source.origin !== origin || source.pathname !== context + '/mobile/customers/detail'
                    || source.searchParams.get('shop') !== shop || !id || !id.trim()) return null;
            return source.pathname + '?' + new URLSearchParams({shop: shop, customerId: id}).toString();
        } catch (error) { return null; }
    }

    function initCustomerPreview(win, context, shop) {
        var document = win.document;
        var dialog = document.getElementById('mobile-customer-preview');
        if (!dialog || typeof dialog.showModal !== 'function') return;
        var host = dialog.querySelector('[data-customer-preview-frame]');
        var loading = dialog.querySelector('[data-customer-preview-loading]');
        var trigger = null;
        var currentFrame = null;
        document.addEventListener('click', function (event) {
            if (event.defaultPrevented || event.button > 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
            var link = event.target.closest('.ms-result a[href], .ma-journey a[href]');
            if (!link) return;
            var url = customerPreviewUrl(link.href, win.location.origin, context, shop);
            if (!url) return;
            event.preventDefault();
            trigger = link;
            host.replaceChildren();
            loading.hidden = false;
            var frame = document.createElement('iframe');
            currentFrame = frame;
            frame.title = '客户资料、订单和行为时间线';
            frame.src = url;
            frame.addEventListener('load', function () { if (frame === currentFrame) loading.hidden = true; });
            host.appendChild(frame);
            dialog.showModal();
        });
        dialog.querySelector('[data-customer-preview-close]').addEventListener('click', function () { dialog.close(); });
        dialog.addEventListener('close', function () {
            currentFrame = null;
            host.replaceChildren();
            if (trigger && trigger.isConnected) {
                trigger.focus({preventScroll: true});
                trigger.scrollIntoView({block: 'center'});
            }
        });
    }

    function initShopPicker(win) {
        var document = win.document;
        var form = document.querySelector('.mobile-shop');
        var dialog = document.getElementById('mobile-shop-dialog');
        if (!form || !dialog || typeof dialog.showModal !== 'function') return;
        var select = form.querySelector('select[name=shop]');
        var trigger = form.querySelector('.mobile-shop-trigger');
        var search = document.getElementById('mobile-shop-search');
        var results = dialog.querySelector('[data-shop-results]');
        var count = dialog.querySelector('[data-shop-count]');
        var shops = Array.prototype.map.call(select.options, function (option) {
            return {id: option.value, name: option.text.trim()};
        });

        function paint() {
            results.replaceChildren();
            var matches = matchingShops(shops, search.value);
            count.textContent = matches.length ? '找到 ' + matches.length + ' 家店铺，点击即可切换' : '没有匹配的店铺，请换个关键词';
            matches.forEach(function (shop) {
                var button = document.createElement('button');
                button.type = 'button';
                var name = document.createElement('strong');
                var domain = document.createElement('small');
                name.textContent = shop.name;
                domain.textContent = shop.id;
                button.appendChild(name);
                button.appendChild(domain);
                if (shop.id === select.value) button.setAttribute('aria-current', 'true');
                button.addEventListener('click', function () {
                    dialog.close();
                    if (shop.id === select.value) return;
                    select.value = shop.id;
                    trigger.textContent = '正在切换…';
                    trigger.disabled = true;
                    form.requestSubmit();
                });
                results.appendChild(button);
            });
        }

        trigger.textContent = select.options[select.selectedIndex].text.trim() + ' ▾';
        trigger.title = select.value;
        trigger.hidden = false;
        form.querySelector('.mobile-shop-row').hidden = true;
        trigger.addEventListener('click', function () {
            search.value = '';
            paint();
            dialog.showModal();
            search.focus();
        });
        search.addEventListener('input', paint);
        dialog.querySelector('[data-shop-close]').addEventListener('click', function () { dialog.close(); });
        dialog.addEventListener('close', function () { trigger.focus(); });
        win.addEventListener('pageshow', function () {
            trigger.disabled = false;
            trigger.textContent = select.options[select.selectedIndex].text.trim() + ' ▾';
        });
    }

    function init(win, script) {
        if (!script) return;
        var document = win.document;
        initShopPicker(win);
        var context = script.dataset.context || '';
        var shop = script.dataset.shop || '';
        initCustomerPreview(win, context, shop);
        var area = script.dataset.area === 'customers' ? 'customers' : 'campaigns';
        var key = 'mobile-' + area + '-list:' + (script.dataset.user || '') + ':' + shop;
        var list = document.querySelector(area === 'customers' ? '[data-mobile-customer-list]' : '[data-mobile-list]');
        var saved;
        try { saved = JSON.parse(win.sessionStorage.getItem(key)); } catch (error) { saved = null; }

        if (list) {
            var filter = document.querySelector('.mobile-filter') || document.getElementById('mobile-customer-filter');
            if (filter) {
                var from = filter.querySelector('[name=fromDate]');
                var to = filter.querySelector('[name=toDate]');
                function validateDates() {
                    to.setCustomValidity(dateRangeValid(from.value, to.value) ? '' : '结束日期不能早于开始日期');
                }
                from.addEventListener('input', validateDates);
                to.addEventListener('input', validateDates);
                filter.addEventListener('submit', function (event) {
                    validateDates();
                    if (!filter.reportValidity()) event.preventDefault();
                });
                filter.addEventListener('invalid', function (event) {
                    var details = event.target.closest('details');
                    if (details) details.open = true;
                }, true);
            }
            var current = new URL(win.location.href);
            current.searchParams.set('shop', shop);
            var currentUrl = listReturnUrl(current.href, win.location.origin, context, shop, area);
            if (win.location.hash === '#mobile-list-return' && saved
                    && listReturnUrl(saved.url, win.location.origin, context, shop, area) === currentUrl) {
                win.requestAnimationFrame(function () { win.scrollTo(0, Number(saved.scroll) || 0); });
                win.history.replaceState(null, '', currentUrl);
            }
            function remember() {
                try { win.sessionStorage.setItem(key, JSON.stringify({url: currentUrl, scroll: win.scrollY})); }
                catch (error) { /* The links remain usable when session storage is unavailable. */ }
            }
            document.querySelectorAll('a.mobile-campaign, a.mc-card, a[href*="/mobile/campaigns/editor"]').forEach(function (link) {
                link.addEventListener('click', remember);
            });
            win.addEventListener('pagehide', remember);
        } else if (saved) {
            var returnUrl = listReturnUrl(saved.url, win.location.origin, context, shop, area);
            if (returnUrl) document.querySelectorAll(area === 'customers' ? '[data-mobile-customer-return]' : '[data-mobile-list-return]').forEach(function (link) {
                link.href = returnUrl + '#mobile-list-return';
            });
        }
    }

    return {matchingShops: matchingShops, listReturnUrl: listReturnUrl, dateRangeValid: dateRangeValid,
        customerPreviewUrl: customerPreviewUrl, init: init};
}));
