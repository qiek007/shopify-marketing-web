(function () {
  var root = document.querySelector('[data-automation-root]');
  var editor = document.getElementById('automation-editor-dialog');
  var detail = document.getElementById('automation-detail-dialog');
  var customerDialog = document.getElementById('automation-customer-dialog');
  if (!root || !editor || !detail || !editor.showModal) return;

  var form = document.getElementById('automation-editor-form');
  var title = document.getElementById('automation-editor-title');
  var preview = document.getElementById('automation-sender-preview');
  var shop = root.dataset.shop || '';
  var detailUrl = root.dataset.detailUrl || '/automations/detail';
  var discountUrl = root.dataset.discountUrl || '/templates/discounts';
  var customerUrl = root.dataset.customerUrl || '/segments/customer/detail';
  var createAction = form.action;
  var updateAction = form.dataset.updateAction;
  var detailState = { automationId: '', page: 1, totalPages: 1 };

  function field(name) { return form.elements.namedItem(name); }
  function text(value, fallback) {
    return value === null || value === undefined || value === '' ? (fallback || '—') : String(value);
  }
  function formatTime(value) {
    if (!value) return '—';
    var normalized = value;
    if (typeof normalized === 'number' && Math.abs(normalized) < 1000000000000) {
      normalized *= 1000;
    } else if (typeof normalized === 'string' && /^\d+(\.\d+)?$/.test(normalized)) {
      normalized = Number(normalized);
      if (Math.abs(normalized) < 1000000000000) normalized *= 1000;
    }
    var date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? text(value) : date.toLocaleString();
  }
  function providerLabel(provider) {
    var option = Array.from(field('provider').options).find(function (item) {
      return item.value === provider;
    });
    return option ? option.textContent : text(provider);
  }
  function labelValue(value, labels) { return labels[value] || text(value); }
  function appendCell(row, value, className) {
    var cell = document.createElement('td');
    if (className) cell.className = className;
    cell.textContent = text(value);
    row.appendChild(cell);
    return cell;
  }
  function refreshSender() {
    var provider = field('provider').value;
    var row = document.querySelector('[data-sender-provider="' + provider + '"]');
    preview.value = row ? row.getAttribute('data-sender-header') : '';
  }
  function refreshCouponVisibility() {
    var fixed = field('couponMode').value === 'FIXED_CODE';
    var row = editor.querySelector('[data-automation-discount-row]');
    row.hidden = !fixed;
    row.style.setProperty('display', fixed ? 'grid' : 'none', 'important');
    field('discountSourceId').required = fixed;
    if (!fixed) field('discountSourceId').value = '';
  }
  function discountLabel(item) {
    return [item.code, item.title, item.summary].filter(Boolean).join(' · ');
  }
  function loadDiscounts(selectedId, query) {
    var select = field('discountSourceId');
    select.disabled = true;
    var url = discountUrl + '?shop=' + encodeURIComponent(shop)
      + '&q=' + encodeURIComponent(query || '');
    return fetch(url, { headers: { Accept: 'application/json' } })
      .then(function (response) {
        if (!response.ok) throw new Error('优惠券加载失败');
        return response.json();
      })
      .then(function (items) {
        select.replaceChildren(new Option('请选择有效优惠券', ''));
        (items || []).forEach(function (item) {
          select.add(new Option(discountLabel(item), item.sourceId));
        });
        if (selectedId && !Array.from(select.options).some(function (option) {
          return option.value === selectedId;
        })) {
          select.add(new Option('当前优惠券 · ' + selectedId, selectedId));
        }
        select.value = selectedId || '';
      })
      .catch(function (error) {
        select.replaceChildren(new Option(error.message || '优惠券加载失败', ''));
      })
      .finally(function () { select.disabled = false; });
  }
  function openNew() {
    form.reset();
    form.action = createAction;
    field('automationId').value = '';
    field('status').value = 'PAUSED';
    field('couponMode').value = 'NONE';
    title.textContent = '新建自动营销';
    refreshSender();
    refreshCouponVisibility();
    editor.showModal();
  }
  function openEdit(row) {
    form.reset();
    form.action = updateAction;
    var data = row.dataset;
    field('automationId').value = data.automationId;
    ['name', 'journeyType', 'triggerEvent', 'waitMinutes', 'templateId', 'provider',
      'frequencyDays', 'couponMode'].forEach(function (key) {
      field(key).value = data[key] || '';
    });
    field('status').value = data.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED';
    field('exitOnPurchase').checked = data.exitOnPurchase === 'true';
    title.textContent = '编辑自动营销';
    refreshSender();
    refreshCouponVisibility();
    if (data.couponMode === 'FIXED_CODE') loadDiscounts(data.discountSourceId || '', '');
    editor.showModal();
  }
  function showDetailState(name) {
    detail.querySelector('[data-automation-detail-loading]').hidden = name !== 'loading';
    detail.querySelector('[data-automation-detail-error]').hidden = name !== 'error';
    detail.querySelector('[data-automation-detail-content]').hidden = name !== 'content';
  }
  function renderDefinition(definition) {
    var labels = {
      status: { ACTIVE: '生效', DRAFT: '禁用', PAUSED: '禁用' },
      journeyType: { ABANDONED_CART: '购物车挽回', BROWSE_ABANDONMENT: '浏览挽回', POST_PURCHASE: '购买后跟进' },
      exitOnPurchase: { true: '是', false: '否' }
    };
    detail.querySelectorAll('[data-automation-detail]').forEach(function (node) {
      var key = node.getAttribute('data-automation-detail');
      var value = definition[key];
      if (key === 'waitMinutes') value = text(value, '0') + ' 分钟';
      if (key === 'frequencyDays') value = text(value, '0') + ' 天';
      if (key === 'provider') value = providerLabel(value);
      node.textContent = labels[key] ? labelValue(String(value), labels[key]) : text(value);
    });
  }
  function renderMetrics(summary) {
    var metrics = [
      ['触发', summary.triggeredCount, 'fa-bolt'], ['等待中', summary.waitingCount, 'fa-clock-o'],
      ['发送', summary.sentCount, 'fa-paper-plane-o'], ['接受', summary.acceptedCount, 'fa-check-circle-o'],
      ['送达', summary.deliveredCount, 'fa-envelope-o'],
      ['打开', text(summary.openedRecipientCount, '0') + ' 人 / ' + text(summary.openedCount, '0') + ' 次', 'fa-envelope-open-o'],
      ['点击', text(summary.clickedRecipientCount, '0') + ' 人 / ' + text(summary.clickedCount, '0') + ' 次', 'fa-hand-pointer-o'],
      ['转化', text(summary.orderCount, '0') + ' 单 / ' + text(summary.netRevenue, '0'), 'fa-shopping-cart']
    ];
    var container = detail.querySelector('[data-automation-metrics]');
    container.replaceChildren();
    metrics.forEach(function (metric) {
      var item = document.createElement('div');
      var label = document.createElement('span');
      var icon = document.createElement('i');
      var value = document.createElement('strong');
      label.className = 'automation-metric-label';
      icon.className = 'fa ' + metric[2] + ' automation-metric-icon';
      icon.setAttribute('aria-hidden', 'true');
      label.append(icon, document.createTextNode(metric[0]));
      value.textContent = text(metric[1], '0');
      item.append(label, value);
      container.appendChild(item);
    });
  }
  function renderGa4Evaluation(evaluation) {
    var ga4 = evaluation || {};
    detail.querySelector('[data-automation-ga4-status]').textContent = text(ga4.statusDisplayName);
    var message = ga4.showMetrics ? ga4.healthMessage : ga4.statusMessage;
    var messageNode = detail.querySelector('[data-automation-ga4-message]');
    messageNode.textContent = message || '';
    messageNode.hidden = !message;
    var metrics = detail.querySelector('[data-automation-ga4-metrics]');
    metrics.hidden = !ga4.showMetrics;
    if (!ga4.showMetrics) return;
    detail.querySelector('[data-automation-ga4-count]').textContent = text(ga4.purchaseCountDisplay, '0');
    detail.querySelector('[data-automation-ga4-revenue]').textContent =
      text(ga4.purchaseRevenueDisplay, '0.00') + ' ' + (ga4.currency || '');
    var time = detail.querySelector('[data-automation-ga4-time]');
    time.removeAttribute('datetime');
    time.removeAttribute('data-browser-time-formatted');
    if (ga4.lastSyncedAt) {
      time.dataset.browserTime = ga4.lastSyncedAt;
      time.textContent = text(ga4.lastSyncedAt);
      if (window.BrowserTime) window.BrowserTime.formatElement(time);
      else time.textContent = formatTime(ga4.lastSyncedAt);
    } else {
      time.removeAttribute('data-browser-time');
      time.textContent = '—';
    }
    detail.querySelector('[data-automation-ga4-model]').textContent = text(ga4.reportingAttributionModel);
  }
  function renderJourneys(page) {
    var body = detail.querySelector('[data-automation-detail-rows]');
    body.replaceChildren();
    (page.items || []).forEach(function (item) {
      var row = document.createElement('tr');
      var customerCell = document.createElement('td');
      if (item.customerSourceId) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'link-button';
        button.setAttribute('data-automation-customer', item.customerSourceId);
        button.textContent = text(item.customerName, item.customerSourceId);
        customerCell.appendChild(button);
      } else {
        customerCell.textContent = text(item.customerName);
      }
      var email = document.createElement('span');
      email.className = 'cell-note';
      email.textContent = text(item.email);
      customerCell.appendChild(email);
      row.appendChild(customerCell);
      appendCell(row, formatTime(item.triggeredAt));
      appendCell(row, formatTime(item.dueAt));
      appendCell(row, formatTime(item.sentAt));
      appendCell(row, providerLabel(item.provider));
      appendCell(row, (item.accepted ? '接受' : '—') + ' / ' + (item.delivered ? '送达' : '—'));
      appendCell(row, text(item.openedCount, '0') + ' / ' + text(item.clickedCount, '0'));
      appendCell(row, text(item.orderCount, '0') + ' / ' + text(item.netRevenue, '0'));
      appendCell(row, item.exitReason || item.status);
      body.appendChild(row);
    });
    detail.querySelector('[data-automation-detail-empty]').hidden = (page.items || []).length !== 0;
    var currentPage = Math.max(1, page.page || 1);
    var totalPages = Math.max(1, page.totalPages || 1);
    detailState.page = currentPage;
    detailState.totalPages = totalPages;
    detail.querySelector('[data-automation-detail-page-label]').textContent =
      '第 ' + currentPage + ' / ' + totalPages + ' 页';
    detail.querySelector('[data-automation-detail-page="previous"]').disabled = currentPage <= 1;
    detail.querySelector('[data-automation-detail-page="next"]').disabled = currentPage >= totalPages;
  }
  function loadDetail(page) {
    showDetailState('loading');
    var url = detailUrl + '?shop=' + encodeURIComponent(shop)
      + '&automationId=' + encodeURIComponent(detailState.automationId)
      + '&page=' + encodeURIComponent(page || 1) + '&size=20';
    return fetch(url, { headers: { Accept: 'application/json' } })
      .then(function (response) {
        if (!response.ok) throw new Error('自动营销明细加载失败');
        return response.json();
      })
      .then(function (data) {
        renderDefinition(data.definition || {});
        renderMetrics(data.summary || {});
        renderGa4Evaluation(data.ga4Evaluation);
        renderJourneys(data.journeys || { items: [], page: 1, totalPages: 1 });
        showDetailState('content');
      })
      .catch(function (error) {
        detail.querySelector('[data-automation-detail-error] span').textContent = error.message;
        showDetailState('error');
      });
  }
  function openDetail(row) {
    detailState.automationId = row.dataset.automationId;
    detailState.page = 1;
    detail.showModal();
    loadDetail(1);
  }
  function openCustomer(customerId) {
    if (!customerDialog) return;
    var body = customerDialog.querySelector('[data-automation-customer-detail]');
    body.innerHTML = '<div class="automation-detail-state"><i class="fa fa-circle-o-notch fa-spin"></i><span>正在加载客户明细</span></div>';
    customerDialog.showModal();
    fetch(customerUrl + '?shop=' + encodeURIComponent(shop)
      + '&customerId=' + encodeURIComponent(customerId), { headers: { Accept: 'text/html' } })
      .then(function (response) {
        if (!response.ok) throw new Error('客户明细加载失败');
        return response.text();
      })
      .then(function (html) {
        body.innerHTML = html;
        var timelineRoot = body.querySelector('[data-customer-timeline]');
        if (timelineRoot && window.ShopifyCustomerTimeline) {
          window.ShopifyCustomerTimeline.init(timelineRoot);
        }
      })
      .catch(function (error) { body.textContent = error.message; });
  }

  field('provider').addEventListener('change', refreshSender);
  field('couponMode').addEventListener('change', function () {
    refreshCouponVisibility();
    if (field('couponMode').value === 'FIXED_CODE') loadDiscounts(field('discountSourceId').value, '');
  });
  editor.querySelector('[data-automation-discount-search-button]').addEventListener('click', function () {
    loadDiscounts(field('discountSourceId').value,
      editor.querySelector('[data-automation-discount-search]').value);
  });
  form.addEventListener('submit', function (event) {
    if (field('couponMode').value === 'FIXED_CODE' && !field('discountSourceId').value) {
      event.preventDefault();
      field('discountSourceId').setCustomValidity('请选择固定优惠券');
      field('discountSourceId').reportValidity();
    } else {
      field('discountSourceId').setCustomValidity('');
    }
  });
  document.addEventListener('click', function (event) {
    var newButton = event.target.closest('[data-automation-new]');
    if (newButton) { openNew(); return; }
    var closeButton = event.target.closest('[data-automation-close]');
    if (closeButton) { closeButton.closest('dialog').close(); return; }
    var customerButton = event.target.closest('[data-automation-customer]');
    if (customerButton) { openCustomer(customerButton.dataset.automationCustomer); return; }
    var pageButton = event.target.closest('[data-automation-detail-page]');
    if (pageButton && !pageButton.disabled) {
      loadDetail(pageButton.dataset.automationDetailPage === 'previous'
        ? detailState.page - 1 : detailState.page + 1);
      return;
    }
    var button = event.target.closest('[data-automation-view],[data-automation-edit]');
    if (!button) return;
    var row = button.closest('[data-automation-id]');
    if (!row) return;
    if (button.hasAttribute('data-automation-view')) openDetail(row); else openEdit(row);
  });
  [editor, detail, customerDialog].filter(Boolean).forEach(function (dialog) {
    dialog.addEventListener('cancel', function (event) { event.preventDefault(); });
  });
  refreshSender();
  refreshCouponVisibility();
  var requestedAutomationId = new URLSearchParams(window.location.search).get('automationId');
  if (requestedAutomationId) {
    openDetail({ dataset: { automationId: requestedAutomationId } });
  }
})();
