(function () {
  'use strict';

  function init(root) {
    if (!root || root.dataset.customerDialogBound === 'true') return;
    var dialog = root.querySelector('[data-customer-detail-dialog]');
    var body = root.querySelector('[data-customer-detail-body]');
    var title = root.querySelector('[data-customer-detail-title]');
    var previewDialog = root.querySelector('[data-customer-preview-dialog]');
    var previewFrame = root.querySelector('[data-customer-preview-frame]');
    if (!dialog || !body) return;
    root.dataset.customerDialogBound = 'true';
    var request;
    var trigger;
    var scrollX = 0;
    var scrollY = 0;

    function initializeTimeline() {
      var timelineRoot = body.querySelector('[data-customer-timeline]');
      if (timelineRoot && window.ShopifyCustomerTimeline) {
        window.ShopifyCustomerTimeline.init(timelineRoot);
      }
    }

    function open(link) {
      if (request) request.abort();
      request = new AbortController();
      trigger = link;
      scrollX = window.scrollX;
      scrollY = window.scrollY;
      if (title) title.textContent = link.dataset.customerName || link.textContent.trim() || '客户明细';
      body.setAttribute('aria-busy', 'true');
      body.innerHTML = '<div class="async-loading campaign-customer-loading"><i class="fa fa-spinner fa-spin"></i><strong>正在加载客户明细</strong></div>';
      if (!dialog.open) {
        dialog.showModal();
        window.scrollTo(scrollX, scrollY);
      }
      fetch(link.dataset.customerDetailUrl, {
        credentials: 'same-origin', signal: request.signal, headers: { Accept: 'text/html' }
      }).then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.text();
      }).then(function (html) {
        body.innerHTML = html;
        initializeTimeline();
      }).catch(function (error) {
        if (error.name === 'AbortError') return;
        body.innerHTML = '<div class="empty-state"><i class="fa fa-exclamation-circle"></i><strong>客户明细加载失败</strong><span>请关闭后重新打开</span></div>';
      }).finally(function () {
        body.removeAttribute('aria-busy');
      });
    }

    root.addEventListener('click', function (event) {
      var link = event.target.closest('[data-customer-detail-url]');
      if (link) {
        if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        open(link);
        return;
      }
      var close = event.target.closest('[data-customer-detail-close]');
      if (close) dialog.close();
    });

    body.addEventListener('click', function (event) {
      var link = event.target.closest('[data-customer-email-preview]');
      if (!link || !previewDialog || !previewFrame) return;
      event.preventDefault();
      previewFrame.src = link.href;
      if (!previewDialog.open) previewDialog.showModal();
    });

    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', function () {
      var returnFocus = trigger;
      if (request) request.abort();
      body.replaceChildren();
      trigger = null;
      if (previewDialog && previewDialog.open) previewDialog.close();
      if (returnFocus && document.contains(returnFocus)) returnFocus.focus({ preventScroll: true });
      window.scrollTo(scrollX, scrollY);
    });
    if (previewDialog && previewFrame) {
      previewDialog.addEventListener('click', function (event) {
        if (event.target === previewDialog || event.target.closest('[data-customer-preview-close]')) {
          previewDialog.close();
        }
      });
      previewDialog.addEventListener('close', function () { previewFrame.src = 'about:blank'; });
    }
  }

  window.ShopifyCustomerDialog = window.ShopifyCustomerDialog || {};
  window.ShopifyCustomerDialog.init = init;
  document.querySelectorAll('[data-customer-dialog-root]').forEach(init);
}());
