(function () {
    'use strict';
    var dialog = document.querySelector('[data-import-error-dialog]');
    if (!dialog || typeof dialog.showModal !== 'function') return;
    var content = dialog.querySelector('[data-error-content]');
    var close = dialog.querySelector('[data-error-close]');
    var meta = dialog.querySelector('[data-error-meta]');
    function showResult(result) {
        var label = result.querySelector('[data-import-error-meta]');
        meta.textContent = label ? label.textContent : '';
        result.hidden = false;
        content.replaceChildren(result);
    }
    var requestId = 0;
    close.addEventListener('click', function () { dialog.close(); });
    var initial = document.querySelector('[data-import-errors-result]');
    if (initial) {
        showResult(initial);
        dialog.showModal();
    }
    document.addEventListener('click', async function (event) {
        var link = event.target.closest('[data-import-errors-link]');
        if (!link || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        var current = ++requestId;
        meta.textContent = '';
        content.textContent = '正在加载错误数据…';
        if (!dialog.open) dialog.showModal();
        try {
            var response = await fetch(link.href, { credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest' } });
            if (!response.ok) throw new Error('请求失败');
            var html = await response.text();
            var result = new DOMParser().parseFromString(html, 'text/html').querySelector('[data-import-errors-result]');
            if (!result) throw new Error('没有返回错误数据');
            if (current !== requestId || !dialog.open) return;
            showResult(result);
        } catch (error) {
            if (current === requestId && dialog.open) content.textContent = '加载失败，请关闭后重试。';
        }
    });
}());