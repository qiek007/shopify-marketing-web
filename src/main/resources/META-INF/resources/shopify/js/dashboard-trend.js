(function () {
  'use strict';
  var root = document.querySelector('[data-dashboard-trend]');
  if (!root) return;
  var state = root.querySelector('[data-trend-state]');
  var visual = root.querySelector('[data-trend-visual]');
  var svg = root.querySelector('[data-trend-svg]');
  var tooltip = root.querySelector('[data-trend-tooltip]');
  var details = root.querySelector('[data-trend-details]');
  var updated = root.querySelector('[data-trend-updated]');
  var note = root.querySelector('[data-trend-context]');
  var body = root.querySelector('[data-trend-rows]');
  var exportLink = root.querySelector('[data-trend-export]');
  var periods = Array.from(root.querySelectorAll('[data-trend-period]'));
  var range = root.querySelector('[data-trend-range]');
  var totals = root.querySelector('[data-trend-totals]');
  var detailLabel = root.querySelector('[data-trend-detail-label]');
  var customForm = root.querySelector('[data-trend-custom-form]');
  var customError = root.querySelector('[data-trend-custom-error]');
  var lastRange = null;
  var requestVersion = 0;
  var ns = 'http://www.w3.org/2000/svg';
  var colors = { sent: '#13805b', delivered: '#126f9b', opened: '#8d5ab0', clicked: '#b37b13', unsubscribed: '#bd4650', orders: '#697a91', shopify: '#bb7528', ga4: '#2a79b4' };
  var integer = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
  var compact = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 });
  var money = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function element(name, attrs, parent) {
    var node = document.createElementNS(ns, name);
    Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, attrs[key]); });
    if (parent) parent.appendChild(node);
    return node;
  }
  function label(text, x, y, attrs) {
    var node = element('text', Object.assign({ x: x, y: y }, attrs || {}), svg);
    node.textContent = text;
    return node;
  }
  function number(value) { return Number.isFinite(Number(value)) ? Number(value) : 0; }
  function optionalCount(value) { return value === null || value === undefined ? null : number(value); }
  function countLabel(value) { return value === null || value === undefined ? '待汇总' : integer.format(number(value)); }
  function amount(value, currency) {
    return value === null || value === undefined ? '—'
      : money.format(number(value)) + (currency ? ' ' + currency : '');
  }
  function dateLabel(value) { return value ? value.slice(5) : ''; }
  function bucketLabel(day) { return day.label || dateLabel(day.date); }
  function grain(data) {
    return data.granularity || (data.period === 'day' ? 'hour' : data.period === 'year' ? 'month' : 'day');
  }
  function bucketTitle(day, data) {
    var unit = grain(data);
    return unit === 'hour' ? day.date + ' ' + day.label
      : unit === 'month' ? day.date.slice(0, 7) : unit === 'year' ? day.label : day.date;
  }
  function monotonePath(values, xValue, yValue) {
    var path = '', points = [];
    function flush() {
      if (!points.length) return;
      path += ' M ' + points[0].x.toFixed(2) + ' ' + points[0].y.toFixed(2);
      if (points.length === 1) { points = []; return; }
      var slopes = [];
      for (var i = 0; i < points.length - 1; i++) {
        slopes.push((points[i + 1].y - points[i].y) / (points[i + 1].x - points[i].x));
      }
      var tangents = [slopes[0]];
      for (var j = 1; j < points.length - 1; j++) {
        var previous = slopes[j - 1], next = slopes[j];
        tangents[j] = previous * next <= 0 ? 0 : 2 * previous * next / (previous + next);
      }
      tangents[points.length - 1] = slopes[slopes.length - 1];
      for (var k = 0; k < slopes.length; k++) {
        var slope = slopes[k];
        if (slope === 0) {
          tangents[k] = 0;
          tangents[k + 1] = 0;
        } else {
          var a = tangents[k] / slope, b = tangents[k + 1] / slope;
          var magnitude = Math.sqrt(a * a + b * b);
          if (magnitude > 3) {
            var scale = 3 / magnitude;
            tangents[k] = scale * a * slope;
            tangents[k + 1] = scale * b * slope;
          }
        }
        var width = points[k + 1].x - points[k].x;
        path += ' C ' + (points[k].x + width / 3).toFixed(2) + ' '
          + (points[k].y + tangents[k] * width / 3).toFixed(2) + ' '
          + (points[k + 1].x - width / 3).toFixed(2) + ' '
          + (points[k + 1].y - tangents[k + 1] * width / 3).toFixed(2) + ' '
          + points[k + 1].x.toFixed(2) + ' ' + points[k + 1].y.toFixed(2);
      }
      points = [];
    }
    values.forEach(function (value, index) {
      if (value === null) { flush(); return; }
      points.push({ x: xValue(index), y: yValue(value) });
    });
    flush();
    return path;
  }
  function appendCell(row, value) {
    var cell = document.createElement('td');
    cell.textContent = String(value);
    row.appendChild(cell);
  }

  function renderTable(data) {
    body.replaceChildren();
    data.days.slice().reverse().forEach(function (day) {
      var row = document.createElement('tr');
      appendCell(row, bucketTitle(day, data));
      appendCell(row, day.future ? '—' : countLabel(day.emailSentCount));
      appendCell(row, data.shopifyOrdersAvailable && !day.future ? countLabel(day.shopifyOrderCount) : '—');
      appendCell(row, data.shopifyRevenueMixed ? '币种混合' : amount(day.shopifyOrderAmount, data.shopifyCurrency));
      appendCell(row, data.ga4RevenueMixed ? '币种混合' : amount(day.ga4PurchaseRevenue, data.ga4Currency));
      appendCell(row, day.future ? '—' : countLabel(day.emailDeliveredCount));
      appendCell(row, day.future ? '—' : countLabel(day.emailOpenedCount));
      appendCell(row, day.future ? '—' : countLabel(day.emailClickedCount));
      appendCell(row, day.future ? '—' : countLabel(day.emailUnsubscribedCount));
      body.appendChild(row);
    });
    details.hidden = false;
    details.open = !details.hasAttribute('data-trend-default-collapsed');
  }

  function renderChart(data) {
    var days = data.days;
    var firstX = 125, lastX = 1475;
    var x = function (index) { return firstX + (lastX - firstX) * index / Math.max(1, days.length - 1); };
    var sent = days.map(function (day) { return optionalCount(day.emailSentCount); });
    var delivered = days.map(function (day) { return optionalCount(day.emailDeliveredCount); });
    var opened = days.map(function (day) { return optionalCount(day.emailOpenedCount); });
    var clicked = days.map(function (day) { return optionalCount(day.emailClickedCount); });
    var unsubscribed = days.map(function (day) { return optionalCount(day.emailUnsubscribedCount); });
    var orders = days.map(function (day) { return data.shopifyOrdersAvailable ? optionalCount(day.shopifyOrderCount) : null; });
    var shopify = days.map(function (day) { return data.shopifyRevenueMixed ? null
      : optionalCount(day.shopifyOrderAmount); });
    var ga4 = days.map(function (day) { return data.ga4RevenueMixed ? null : optionalCount(day.ga4PurchaseRevenue); });
    var peak = function (values) { return Math.max(1, ...values.filter(function (item) { return item !== null; })); };
    var sentMax = peak(sent.concat(delivered, opened, clicked, unsubscribed)), orderMax = peak(orders);
    var sameCurrency = !!data.shopifyCurrency && data.shopifyCurrency === data.ga4Currency;
    var sharedMoneyMax = peak(shopify.concat(ga4));
    var shopifyMax = sameCurrency ? sharedMoneyMax : peak(shopify);
    var ga4Max = sameCurrency ? sharedMoneyMax : peak(ga4);
    var y = function (value, max, top, bottom) { return bottom - (value / max) * (bottom - top); };
    svg.replaceChildren();

    [{ top: 43, bottom: 134 }, { top: 200, bottom: 291 }].forEach(function (panel) {
      [0, 0.5, 1].forEach(function (fraction) {
        var ordinate = panel.bottom - fraction * (panel.bottom - panel.top);
        element('line', { x1: firstX, x2: lastX, y1: ordinate, y2: ordinate,
          stroke: fraction === 0 ? '#bccbd2' : '#e5ecef', 'stroke-dasharray': fraction === 0 ? '' : '3 4' }, svg);
      });
    });
    var unit = { hour: '小时', day: '日', month: '月', year: '年' }[grain(data)];
    label('数量 / ' + unit, firstX, 20, { 'font-weight': '700', fill: '#304852' });
    label('金额 / ' + unit, firstX, 177, { 'font-weight': '700', fill: '#304852' });
    label(compact.format(sentMax), 112, 47, { 'text-anchor': 'end', fill: colors.sent });
    label('0', 112, 138, { 'text-anchor': 'end' });
    if (data.shopifyOrdersAvailable) {
      label(compact.format(orderMax), 1488, 47, { fill: colors.orders });
      label('0', 1488, 138);
    }
    if (!data.shopifyRevenueMixed && data.shopifyOrdersAvailable) {
      label(compact.format(shopifyMax) + ' ' + (data.shopifyCurrency || ''), 112, 204,
        { 'text-anchor': 'end', fill: colors.shopify });
    }
    if (data.ga4Connected && data.period !== 'day' && !data.ga4RevenueMixed) {
      label(compact.format(ga4Max) + ' ' + (data.ga4Currency || ''), 1488, 204,
        { fill: colors.ga4 });
    }
    label('0', 112, 295, { 'text-anchor': 'end' });
    var tickStep = Math.max(1, Math.ceil((days.length - 1) / (data.period === 'year' ? 11 : 7)));
    for (var index = 0; index < days.length; index++) {
      if (index % tickStep !== 0 && index !== days.length - 1) continue;
      if (tickStep > 1 && index > 0 && days.length - 1 - index < tickStep / 2 && index !== days.length - 1) continue;
      label(bucketLabel(days[index]), x(index), 326, { 'text-anchor': 'middle' });
    }

    var series = [
      { key: 'sent', values: sent, max: sentMax, top: 43, bottom: 134 },
      { key: 'delivered', values: delivered, max: sentMax, top: 43, bottom: 134 },
      { key: 'opened', values: opened, max: sentMax, top: 43, bottom: 134 },
      { key: 'clicked', values: clicked, max: sentMax, top: 43, bottom: 134 },
      { key: 'unsubscribed', values: unsubscribed, max: sentMax, top: 43, bottom: 134 },
      { key: 'orders', values: orders, max: orderMax, top: 43, bottom: 134 },
      { key: 'shopify', values: shopify, max: shopifyMax, top: 200, bottom: 291 },
      { key: 'ga4', values: ga4, max: ga4Max, top: 200, bottom: 291 }
    ];
    series.forEach(function (line) {
      var path = monotonePath(line.values, x, function (value) {
        return y(value, line.max, line.top, line.bottom);
      });
      if (path) element('path', { d: path, fill: 'none', stroke: colors[line.key],
        'stroke-width': 2.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, svg);
      line.values.forEach(function (value, i) {
        if (value !== null && line.values[i - 1] == null && line.values[i + 1] == null) {
          element('circle', { cx: x(i), cy: y(value, line.max, line.top, line.bottom), r: 4,
            fill: colors[line.key] }, svg);
        }
      });
    });
    var markers = element('g', { visibility: 'hidden' }, svg);
    var crosshair = element('line', { y1: 32, y2: 300, stroke: '#78919c',
      'stroke-width': 1, 'stroke-dasharray': '4 4' }, markers);
    var circles = series.map(function (line) {
      return element('circle', { r: 4.5, fill: '#fff', stroke: colors[line.key],
        'stroke-width': 2.4 }, markers);
    });
    svg.onpointermove = function (event) {
      var rect = svg.getBoundingClientRect();
      var chartX = (event.clientX - rect.left) * 1600 / rect.width;
      var i = Math.max(0, Math.min(days.length - 1,
        Math.round((chartX - firstX) / (lastX - firstX) * (days.length - 1))));
      markers.setAttribute('visibility', 'visible');
      crosshair.setAttribute('x1', x(i));
      crosshair.setAttribute('x2', x(i));
      series.forEach(function (line, index) {
        var value = line.values[i];
        circles[index].setAttribute('visibility', value === null ? 'hidden' : 'visible');
        if (value !== null) {
          circles[index].setAttribute('cx', x(i));
          circles[index].setAttribute('cy', y(value, line.max, line.top, line.bottom));
        }
      });
      var day = days[i];
      if (day.future) {
        markers.setAttribute('visibility', 'hidden');
        tooltip.hidden = true;
        return;
      }
      tooltip.textContent = bucketTitle(day, data) + '\n邮件发送 ' + countLabel(sent[i])
        + '\n邮件送达 ' + countLabel(delivered[i])
        + '\n邮件打开人数 ' + countLabel(opened[i])
        + '\n邮件点击人数 ' + countLabel(clicked[i])
        + '\n邮件退订 ' + countLabel(unsubscribed[i])
        + '\nShopify 订单 ' + (data.shopifyOrdersAvailable ? countLabel(orders[i]) : '—')
        + '\nShopify 金额 ' + (data.shopifyRevenueMixed ? '币种混合' : amount(day.shopifyOrderAmount, data.shopifyCurrency))
        + '\nGA4 邮件收入 ' + (data.ga4RevenueMixed ? '币种混合'
          : amount(day.ga4PurchaseRevenue, data.ga4Currency));
      tooltip.hidden = false;
      tooltip.style.left = Math.max(8, Math.min(visual.clientWidth - 220,
        event.clientX - visual.getBoundingClientRect().left + 14)) + 'px';
      var tooltipTop = event.clientY - visual.getBoundingClientRect().top + 14;
      var maximumTooltipTop = Math.max(8, visual.clientHeight - tooltip.offsetHeight - 8);
      tooltip.style.top = Math.max(8, Math.min(maximumTooltipTop, tooltipTop)) + 'px';
    };
    svg.onpointerleave = function () {
      markers.setAttribute('visibility', 'hidden');
      tooltip.hidden = true;
    };
  }

  function renderTotals(data) {
    var metrics = [
      ['邮件发送数', 'emailSentCount'], ['邮件送达数', 'emailDeliveredCount'],
      ['邮件打开人数', 'emailOpenedCount'], ['邮件点击人数', 'emailClickedCount'],
      ['邮件退订数', 'emailUnsubscribedCount'],
      ['Shopify 订单数', 'shopifyOrderCount', data.shopifyOrdersAvailable],
      ['Shopify 订单金额', 'shopifyOrderAmount', data.shopifyOrdersAvailable, data.shopifyCurrency || '', data.shopifyRevenueMixed],
      ['GA4 邮件购买收入', 'ga4PurchaseRevenue', data.ga4Connected, data.ga4Currency || '', data.ga4RevenueMixed]
    ];
    totals.replaceChildren();
    var elapsed = data.days.filter(function (day) { return !day.future; });
    metrics.forEach(function (metric) {
      var values = data.period === 'day' && metric[1] === 'ga4PurchaseRevenue'
        ? [data.dayGa4Revenue] : elapsed.map(function (day) { return day[metric[1]]; });
      var known = values.filter(function (value) { return value != null; });
      var sum = known.length ? known.reduce(function (total, value) { return total + number(value); }, 0) : null;
      var value = metric[2] === false ? '—' : metric[4] ? '币种混合' : sum === null ? '待汇总'
        : metric.length > 3 ? amount(sum, metric[3]) : integer.format(sum);
      var card = document.createElement('div');
      var name = document.createElement('span');
      var count = document.createElement('strong');
      name.textContent = metric[0];
      count.textContent = value;
      card.append(name, count);
      totals.appendChild(card);
    });
    totals.hidden = false;
  }

  function render(data) {
    if (data.fromDate && data.toDate) lastRange = { fromDate: data.fromDate, toDate: data.toDate };
    range.textContent = data.fromDate && data.toDate
      ? (data.fromDate === data.toDate ? data.fromDate : data.fromDate + ' 至 ' + data.toDate) + ' · ' + data.timeZone
      : '';
    if (!data.ready || !Array.isArray(data.days) || !data.days.length) {
      state.textContent = data.period === 'custom' ? '所选日期范围内暂无已汇总的趋势数据。' : '所选周期的趋势正在汇总。';
      updated.textContent = data.period === 'custom' ? '暂无数据' : '数据准备中';
      return;
    }
    state.hidden = true;
    visual.hidden = false;
    var synced = data.updatedAt ? new Date(data.updatedAt) : null;
    updated.textContent = synced && !Number.isNaN(synced.getTime())
      ? '汇总更新：' + synced.toLocaleString() : '已汇总';
    renderChart(data);
    renderTable(data);
    renderTotals(data);
    var grainLabel = { hour: '小时', day: '日', month: '月', year: '年' }[grain(data)];
    detailLabel.textContent = '查看每' + grainLabel + '明细';
    var exportUrl = new URL(exportLink.href);
    exportUrl.searchParams.set('period', data.period);
    if (data.period === 'custom') {
      exportUrl.searchParams.set('fromDate', data.fromDate);
      exportUrl.searchParams.set('toDate', data.toDate);
    } else {
      exportUrl.searchParams.delete('fromDate');
      exportUrl.searchParams.delete('toDate');
    }
    exportLink.href = exportUrl.href;
    exportLink.hidden = false;
    var notes = ['统计日按 ' + data.timeZone,
      '邮件为服务商提交数；批量任务按请求开始日、旧模式按请求开始时间归集',
      '送达、退订为回执次数，按活动汇总创建日归集；打开、点击为活动内去重收件人数，按首次记录日归集',
      'Shopify 金额为未取消订单总额，未扣退款；GA4 为本平台邮件活动购买收入，两者口径独立'];
    if (data.incomplete) notes.push('部分历史数据待汇总，合计仅包含已汇总的数据');
    if (daysAwaitingEngagement(data.days)) notes.push('部分邮件回执指标待汇总');
    if (!data.shopifyOrdersAvailable) notes.push('当前店铺未接入 Shopify 订单，订单指标暂不可用');
    if (data.shopifyRevenueMixed) notes.push('Shopify 订单币种混合，订单金额不合计展示');
    if (data.ga4RevenueMixed) notes.push('GA4 报告币种混合，邮件购买收入不合计展示');
    if (!data.ga4Connected) notes.push('GA4 尚未连接，邮件购买收入暂不可用');
    if (data.ga4Connected && data.period === 'day') notes.push('GA4 邮件购买收入只提供当天汇总');
    else if (data.ga4Connected && !data.ga4RevenueMixed && data.days.some(function (day) {
      return !day.future && day.ga4PurchaseRevenue == null;
    })) notes.push('GA4 未覆盖的时段留空');
    if (data.shopifyCurrency && data.ga4Currency && data.shopifyCurrency !== data.ga4Currency) {
      notes.push('两种金额币种不同，分别使用独立刻度，不可直接比较');
    }
    note.textContent = notes.join(' · ');
  }

  function daysAwaitingEngagement(days) {
    return days.some(function(day) { return !day.future && (day.emailDeliveredCount == null || day.emailOpenedCount == null || day.emailClickedCount == null || day.emailUnsubscribedCount == null); });
  }

  if (!root.dataset.shop) {
    state.textContent = '请选择店铺以查看趋势。';
    return;
  }
  function load(period, dates) {
    var version = ++requestVersion;
    periods.forEach(function (button) { button.setAttribute('aria-pressed', String(button.dataset.trendPeriod === period)); });
    state.hidden = false;
    state.textContent = '正在读取趋势…';
    updated.textContent = '读取中';
    visual.hidden = details.hidden = tooltip.hidden = totals.hidden = exportLink.hidden = true;
    range.textContent = note.textContent = '';
    var url = new URL(root.dataset.trendUrl, window.location.href);
    url.searchParams.set('shop', root.dataset.shop);
    url.searchParams.set('period', period);
    if (dates) {
      url.searchParams.set('fromDate', dates.fromDate);
      url.searchParams.set('toDate', dates.toDate);
    }
    var options = { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } };
    var embedded = window.DidaShoplineWorkspace || new URL(window.location.href).searchParams.get('embedded') === '1';
    var requests = window.ShopifyEmbeddedRequests;
    if (embedded && (!requests || typeof requests.fetch !== 'function')) {
      state.textContent = '嵌入会话暂不可用，请重新打开应用。';
      updated.textContent = '暂不可用';
      return;
    }
    (embedded ? requests.fetch(url.href, options) : fetch(url.href, options)).then(function (response) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('没有权限读取当前店铺的趋势数据。');
      }
      if (!response.ok || !(response.headers.get('Content-Type') || '').toLowerCase().includes('json')) {
        throw new Error('趋势暂不可用，请稍后重试。');
      }
      return response.json();
    }).then(function (data) {
      if (version !== requestVersion) return;
      if (data.period !== period) throw new Error('当前趋势服务尚未提供所选周期。');
      if (dates && (data.fromDate !== dates.fromDate || data.toDate !== dates.toDate)) {
        throw new Error('趋势服务返回的日期与选择不一致。');
      }
      render(data);
    }).catch(function (error) {
      if (version !== requestVersion) return;
      state.textContent = error && error.message ? error.message : '趋势暂不可用，请稍后重试。';
      updated.textContent = '暂不可用';
    });
  }
  function showCustomForm(show) {
    if (!customForm) return;
    customForm.hidden = !show;
    customError.hidden = true;
    periods.forEach(function (button) {
      if (button.dataset.trendPeriod === 'custom') button.setAttribute('aria-expanded', String(show));
    });
    if (show && lastRange) {
      if (!customForm.elements.fromDate.value) customForm.elements.fromDate.value = lastRange.fromDate;
      if (!customForm.elements.toDate.value) customForm.elements.toDate.value = lastRange.toDate;
    }
  }
  periods.forEach(function (button) {
    button.addEventListener('click', function () {
      var period = button.dataset.trendPeriod;
      showCustomForm(period === 'custom');
      if (period !== 'custom') load(period);
    });
  });
  if (customForm) {
    customForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var from = customForm.elements.fromDate.value;
      var to = customForm.elements.toDate.value;
      if (!from || !to || from > to) {
        customError.textContent = '请选择起止日期，开始日期不能晚于结束日期。';
        customError.hidden = false;
        return;
      }
      customError.hidden = true;
      load('custom', { fromDate: from, toDate: to });
    });
  }
  load('month');
}());
