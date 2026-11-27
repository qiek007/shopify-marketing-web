(function () {
    'use strict';
    const input = document.querySelector('[data-import-tag-url]');
    if (!input || !input.form || !input.list) return;
    const embedded = window.DidaShoplineWorkspace
        || new URL(window.location.href).searchParams.get('embedded') === '1';
    const requests = window.ShopifyEmbeddedRequests;
    if (embedded && (!requests || typeof requests.fetch !== 'function')) return;
    let currentRequest;
    let delay;
    async function refresh() {
        if (currentRequest) currentRequest.abort();
        const controller = new AbortController();
        currentRequest = controller;
        const url = new URL(input.dataset.importTagUrl, window.location.href);
        url.searchParams.set('shop', input.form.elements.shop.value);
        const term = input.value.trim();
        if (term) url.searchParams.set('q', term);
        try {
            const options = { credentials: 'same-origin', signal: controller.signal };
            const response = await (embedded ? requests.fetch(url.href, options) : fetch(url.href, options));
            if (!response.ok) return;
            const data = await response.json();
            if (controller !== currentRequest || input.value.trim() !== term) return;
            const tags = Array.isArray(data) ? data : data.items;
            if (!Array.isArray(tags)) return;
            input.list.replaceChildren(...tags.filter(tag => typeof tag === 'string').map(tag => new Option(tag)));
        } catch (error) {
            // The input still accepts a label when suggestions are unavailable.
        }
    }
    input.addEventListener('input', function () {
        clearTimeout(delay);
        delay = setTimeout(refresh, 180);
    });
    refresh();
}());
