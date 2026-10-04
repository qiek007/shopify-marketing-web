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
  var detailState = { automationId: '', page: 1, totalPages: 1, filterQueried: false };
  var filterForm = detail.querySelector('[data-automation-filter]');
  var exportButton = detail.querySelector('[data-automation-export]');
  var exportPanel = detail.querySelector('[data-automation-export-panel]');
  var exportList = detail.querySelector('[data-automation-export-list]');
  var recipientExportTimer;

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
    field('utmSource').value = 'auw';
    field('utmMedium').value = 'email';
    field('utmCampaign').value = '';
    field('utmContent').value = '';
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
      'frequencyDays', 'couponMode', 'utmSource', 'utmMedium', 'utmCampaign', 'utmContent'].forEach(function (key) {
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
    detail.querySelector('[data-automation-utm-source]').textContent =
      text(definition.utmSource, 'auw');
    detail.querySelector('[data-automation-utm-medium]').textContent =
      text(definition.utmMedium, 'email');
    detail.querySelector('[data-automation-utm-campaign]').textContent =
      definition.utmCampaign || definition.name || '—';
    detail.querySelector('[data-automation-utm-content]').textContent =
      text(definition.utmContent, '按链接自动生成');
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
  function filterValue(name) {
    var control = filterForm && filterForm.elements.namedItem(name);
    return control ? control.value : '';
  }
  function exportParameters() {
    return new URLSearchParams({
      shop: shop, automationId: detailState.automationId,
      q: filterValue('q'), provider: filterValue('provider') || 'ALL',
      lifecycle: filterValue('lifecycle') || 'ALL'
    });
  }
  function conditionsChanged() {
    detailState.filterQueried = false;
    if (exportButton) {
      exportButton.disabled = true;
      exportButton.title = '请先执行查询';
    }
  }
  function exportStatusLabel(status) {
    return { PENDING: '等待生成', RUNNING: '正在生成', READY: '已完成',
      FAILED: '生成失败', EXPIRED: '已过期' }[status] || text(status);
  }
  function renderExportJobs(items) {
    if (!exportList) return;
    exportList.replaceChildren();
    if (!items.length) {
      var empty = document.createElement('div');
      empty.className = 'campaign-export-empty';
      empty.textContent = '尚未提交导出任务';
      exportList.appendChild(empty);
      return;
    }
    items.forEach(function (item) {
      var article = document.createElement('article');
      article.className = 'campaign-export-job ' + String(item.status || '').toLowerCase();
      var info = document.createElement('div');
      var title = document.createElement('strong');
      var progress = document.createElement('span');
      title.textContent = exportStatusLabel(item.status);
      progress.textContent = text(item.processedRows, '0') + ' / ' + text(item.totalRows, '0')
        + ' 条 · ' + text(item.progressPercent, '0') + '%';
      info.append(title, progress);
      if (item.errorSummary) {
        var error = document.createElement('small');
        error.className = 'danger-text';
        error.textContent = item.errorSummary;
        info.appendChild(error);
      }
      var actions = document.createElement('div');
      actions.className = 'campaign-export-actions';
      if (item.ready) {
        var download = document.createElement('a');
        download.className = 'action-button';
        download.href = root.dataset.exportDownloadUrl + '?' + new URLSearchParams({
          shop: shop, jobId: item.jobId
        }).toString();
        download.textContent = '下载 Excel';
        actions.appendChild(download);
      }
      if (item.deletable) {
        var remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'action-button danger-text';
        remove.setAttribute('data-automation-export-delete', item.jobId);
        remove.textContent = '删除';
        actions.appendChild(remove);
      }
      article.append(info, actions);
      exportList.appendChild(article);
    });
  }
  function refreshExportJobs() {
    if (!exportPanel || !exportPanel.open || !detailState.automationId) return Promise.resolve();
    clearTimeout(recipientExportTimer);
    var params = new URLSearchParams({ shop: shop, automationId: detailState.automationId });
    return fetch(root.dataset.exportStatusUrl + '?' + params.toString(),
      { headers: { Accept: 'application/json' } })
      .then(function (response) {
        if (!response.ok) throw new Error('导出任务加载失败');
        return response.json();
      })
      .then(function (payload) {
        var items = Array.isArray(payload) ? payload : (payload.items || []);
        renderExportJobs(items);
        if (items.some(function (item) {
          return item.status === 'PENDING' || item.status === 'RUNNING';
        })) recipientExportTimer = setTimeout(refreshExportJobs, 2000);
      })
      .catch(function (error) {
        renderExportJobs([{ status: 'FAILED', processedRows: 0, totalRows: 0,
          progressPercent: 0, errorSummary: error.message }]);
      });
  }
  function loadDetail(page, markQueried) {
    showDetailState('loading');
    var queriedConditions = exportParameters().toString();
    var url = detailUrl + '?shop=' + encodeURIComponent(shop)
      + '&automationId=' + encodeURIComponent(detailState.automationId)
      + '&q=' + encodeURIComponent(filterValue('q'))
      + '&provider=' + encodeURIComponent(filterValue('provider') || 'ALL')
      + '&lifecycle=' + encodeURIComponent(filterValue('lifecycle') || 'ALL')
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
        if (markQueried && exportParameters().toString() === queriedConditions) {
          detailState.filterQueried = true;
          if (exportButton) {
            exportButton.disabled = false;
            exportButton.title = '';
          }
        }
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
    if (filterForm) filterForm.reset();
    conditionsChanged();
    if (exportPanel) exportPanel.open = false;
    detail.showModal();
    loadDetail(1, false);
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
  if (filterForm) {
    filterForm.addEventListener('submit', function (event) {
      event.preventDefault();
      loadDetail(1, true);
    });
    filterForm.addEventListener('input', conditionsChanged);
    filterForm.addEventListener('change', conditionsChanged);
  }
  if (exportButton) exportButton.addEventListener('click', function () {
    if (!detailState.filterQueried) return;
    var submittedConditions = exportParameters().toString();
    exportButton.disabled = true;
    fetch(root.dataset.exportRequestUrl, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json' }, body: exportParameters().toString()
    }).then(function (response) {
      if (!response.ok) throw new Error('导出任务提交失败');
      return response.json();
    }).then(function () {
      if (exportPanel) exportPanel.open = true;
      return refreshExportJobs();
    }).catch(function (error) {
      window.alert(error.message);
    }).finally(function () {
      exportButton.disabled = !detailState.filterQueried
        || exportParameters().toString() !== submittedConditions;
    });
  });
  if (exportPanel) exportPanel.addEventListener('toggle', function () {
    if (exportPanel.open) refreshExportJobs(); else clearTimeout(recipientExportTimer);
  });
  if (exportList) exportList.addEventListener('click', function (event) {
    var remove = event.target.closest('[data-automation-export-delete]');
    if (!remove || !window.confirm('确认删除这条导出记录及其文件吗？')) return;
    var params = exportParameters();
    params.set('jobId', remove.getAttribute('data-automation-export-delete'));
    fetch(root.dataset.exportDeleteUrl, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json' }, body: params.toString()
    }).then(function (response) {
      if (!response.ok) throw new Error('导出记录删除失败');
      return refreshExportJobs();
    }).catch(function (error) { window.alert(error.message); });
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
        ? detailState.page - 1 : detailState.page + 1, false);
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
    dialog.addEventListener('close', function () { clearTimeout(recipientExportTimer); });
  });
  refreshSender();
  refreshCouponVisibility();
  var requestedAutomationId = new URLSearchParams(window.location.search).get('automationId');
  if (requestedAutomationId) {
    openDetail({ dataset: { automationId: requestedAutomationId } });
  }
})();
