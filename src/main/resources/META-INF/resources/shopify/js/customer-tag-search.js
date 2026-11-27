(function (root, factory) {
    var api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.CustomerTagSearch = api;
}(typeof window === 'undefined' ? null : window, function () {
    'use strict';

    function bind(win, form, addTag) {
        var options = form.querySelector('.customer-tag-options');
        var input = options && options.querySelector('[data-customer-tag-search]');
        var status = options && options.querySelector('[data-customer-tag-search-status]');
        var clear = options && options.querySelector('[data-customer-tag-search-clear]');
        if (!input || !status) return;
        var timer, request, version = 0, term = '', matches = new Set(), phase = 'idle';

        function filter() {
            var query = term.toLocaleLowerCase();
            var found = false;
            options.querySelectorAll('label').forEach(function (label) {
                var tag = label.querySelector('input[name="tag"]');
                if (!tag) return;
                var match = label.textContent.trim().toLocaleLowerCase().includes(query) || matches.has(tag.value);
                label.hidden = Boolean(query) && tag.dataset.untagged !== 'true' && !match;
                if (match) found = true;
            });
            var initial = options.querySelector('[data-no-customer-tags]');
            if (initial) initial.hidden = Boolean(query);
            var message = '';
            if (query) {
                if (phase === 'loading') message = '正在搜索标签…';
                else if (phase === 'error') message = '标签搜索失败，请重试';
                else if (!found) message = '没有匹配的标签';
            }
            status.hidden = !message;
            if (status.textContent !== message) status.textContent = message;
            if (clear) clear.disabled = !input.value;
        }

        function search() {
            term = input.value.trim();
            matches = new Set();
            var current = ++version;
            win.clearTimeout(timer);
            if (request) request.abort();
            request = null;
            var shop = form.querySelector('input[name="shop"]');
            if (!term || !shop || !shop.value || !form.dataset.customerTagsUrl) {
                phase = 'idle';
                filter();
                return;
            }
            phase = 'loading';
            filter();
            timer = win.setTimeout(function () {
                var params = new URLSearchParams({ shop: shop.value, q: term });
                request = win.AbortController ? new win.AbortController() : null;
                win.fetch(form.dataset.customerTagsUrl + '?' + params.toString(), {
                    credentials: 'same-origin', headers: { Accept: 'application/json' },
                    signal: request ? request.signal : undefined
                }).then(function (response) {
                    if (!response.ok) throw new Error('Tag lookup failed');
                    return response.json();
                }).then(function (tags) {
                    if (current !== version) return;
                    if (!Array.isArray(tags) || tags.some(function (tag) { return typeof tag !== 'string'; })) {
                        throw new Error('Invalid tag lookup');
                    }
                    matches = new Set(tags);
                    tags.forEach(addTag);
                    phase = 'idle';
                    filter();
                }).catch(function () {
                    if (current !== version) return;
                    phase = 'error';
                    filter();
                });
            }, 200);
        }

        input.addEventListener('input', function (event) {
            event.stopPropagation();
            if (!event.isComposing) search();
        });
        input.addEventListener('compositionend', search);
        input.addEventListener('change', function (event) { event.stopPropagation(); });
        input.addEventListener('keydown', function (event) { if (event.key === 'Enter') event.preventDefault(); });
        function clearSearch() {
            input.value = '';
            search();
        }
        if (clear) clear.addEventListener('click', function () {
            clearSearch();
            input.focus();
        });
        form.addEventListener('reset', clearSearch);
        if (win.MutationObserver) {
            new win.MutationObserver(filter).observe(options, { childList: true });
        }
    }

    return { bind: bind };
}));
