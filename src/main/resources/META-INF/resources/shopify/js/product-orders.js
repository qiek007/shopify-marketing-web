(function () {
  'use strict';

  function init(root) {
    if (!root || root.dataset.productOrdersBound === 'true') return;
    var host = root.querySelector('[data-product-orders-host]');
    if (!host) return;
    root.dataset.productOrdersBound = 'true';
    var request;
    var loaded = false;

    function load(page) {
      if (request) request.abort();
      request = new AbortController();
      host.setAttribute('aria-busy', 'true');
      host.innerHTML = '<div class="async-loading"><i class="fa fa-spinner fa-spin"></i><strong>正在加载关联订单</strong></div>';
      var url = new URL(root.dataset.ordersUrl, window.location.href);
      url.searchParams.set('page', page || '1');
      fetch(url.toString(), {
        credentials: 'same-origin', signal: request.signal, headers: { Accept: 'text/html' }
      }).then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.text();
      }).then(function (html) {
        host.innerHTML = html;
        loaded = true;
      }).catch(function (error) {
        if (error.name === 'AbortError') return;
        host.innerHTML = '<div class="empty-state compact"><i class="fa fa-exclamation-circle"></i><strong>关联订单加载失败</strong><button class="action-button" type="button" data-product-orders-page="1">重试</button></div>';
      }).finally(function () {
        host.removeAttribute('aria-busy');
      });
    }

    root.addEventListener('toggle', function () {
      if (root.open && !loaded) load(1);
    });
    host.addEventListener('click', function (event) {
      var button = event.target.closest('[data-product-orders-page]');
      if (!button) return;
      event.preventDefault();
      load(button.dataset.productOrdersPage);
    });
  }

  document.querySelectorAll('[data-product-orders]').forEach(init);
}());
