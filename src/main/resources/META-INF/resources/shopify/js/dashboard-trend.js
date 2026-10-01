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
  var ns = 'http://www.w3.org/2000/svg';
  var colors = { sent: '#13805b', orders: '#697a91', shopify: '#bb7528', ga4: '#2a79b4' };
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
  function amount(value, currency) {
    return value === null || value === undefined ? '—'
      : money.format(number(value)) + (currency ? ' ' + currency : '');
  }
  function dateLabel(value) { return value ? value.slice(5) : ''; }
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
    data.days.forEach(function (day) {
      var row = document.createElement('tr');
      appendCell(row, day.date);
      appendCell(row, integer.format(number(day.emailSentCount)));
      appendCell(row, data.shopifyOrdersAvailable ? integer.format(number(day.shopifyOrderCount)) : '—');
      appendCell(row, data.shopifyRevenueMixed ? '币种混合' : amount(day.shopifyOrderAmount, data.shopifyCurrency));
      appendCell(row, data.ga4RevenueMixed ? '币种混合' : amount(day.ga4PurchaseRevenue, data.ga4Currency));
      body.appendChild(row);
    });
    details.hidden = false;
    details.open = !details.hasAttribute('data-trend-default-collapsed');
  }

  function renderChart(data) {
    var days = data.days;
    var firstX = 125, lastX = 1475;
    var x = function (index) { return firstX + (lastX - firstX) * index / (days.length - 1); };
    var sent = days.map(function (day) { return number(day.emailSentCount); });
    var orders = days.map(function (day) { return data.shopifyOrdersAvailable ? number(day.shopifyOrderCount) : null; });
    var shopify = days.map(function (day) { return data.shopifyRevenueMixed ? null
      : day.shopifyOrderAmount === null ? null : number(day.shopifyOrderAmount); });
    var ga4 = days.map(function (day) { return day.ga4PurchaseRevenue === null ? null : number(day.ga4PurchaseRevenue); });
    var peak = function (values) { return Math.max(1, ...values.filter(function (item) { return item !== null; })); };
    var sentMax = peak(sent), orderMax = peak(orders);
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
    label('数量 / 日', firstX, 20, { 'font-weight': '700', fill: '#304852' });
    label('金额 / 日', firstX, 177, { 'font-weight': '700', fill: '#304852' });
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
    if (data.ga4Connected) {
      label(compact.format(ga4Max) + ' ' + (data.ga4Currency || ''), 1488, 204,
        { fill: colors.ga4 });
    }
    label('0', 112, 295, { 'text-anchor': 'end' });
    for (var index = 0; index < days.length; index++) {
      if (index % 5 !== 0 && index !== days.length - 1) continue;
      label(dateLabel(days[index].date), x(index), 326, { 'text-anchor': 'middle' });
    }

    var series = [
      { key: 'sent', values: sent, max: sentMax, top: 43, bottom: 134 },
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
    });
    var markers = element('g', { visibility: 'hidden' }, svg);
    var crosshair = element('line', { y1: 32, y2: 300, stroke: '#78919c',
      'stroke-width': 1, 'stroke-dasharray': '4 4' }, markers);
    var circles = series.map(function (line) {
      return element('circle', { r: 4.5, fill: '#fff', stroke: colors[line.key],
        'stroke-width': 2.4 }, markers);
    });
    svg.addEventListener('pointermove', function (event) {
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
      tooltip.textContent = day.date + '\n邮件发送 ' + integer.format(sent[i])
        + '\nShopify 订单 ' + (orders[i] === null ? '—' : integer.format(orders[i]))
        + '\nShopify 金额 ' + (data.shopifyRevenueMixed ? '币种混合' : amount(day.shopifyOrderAmount, data.shopifyCurrency))
        + '\nGA4 邮件收入 ' + (data.ga4RevenueMixed ? '币种混合'
          : amount(day.ga4PurchaseRevenue, data.ga4Currency));
      tooltip.hidden = false;
      tooltip.style.left = Math.max(8, Math.min(visual.clientWidth - 220,
        event.clientX - visual.getBoundingClientRect().left + 14)) + 'px';
      tooltip.style.top = '14px';
    });
    svg.addEventListener('pointerleave', function () {
      markers.setAttribute('visibility', 'hidden');
      tooltip.hidden = true;
    });
  }

  function render(data) {
    if (!data.ready || !data.days || data.days.length !== 30) {
      state.textContent = '后台正在生成近 30 天汇总，请稍后刷新页面。';
      updated.textContent = '数据准备中';
      return;
    }
    state.hidden = true;
    visual.hidden = false;
    var synced = data.updatedAt ? new Date(data.updatedAt) : null;
    updated.textContent = synced && !Number.isNaN(synced.getTime())
      ? '汇总更新：' + synced.toLocaleString() : '已汇总';
    renderChart(data);
    renderTable(data);
    exportLink.hidden = false;
    var notes = ['统计日按 ' + data.timeZone,
      '邮件为服务商接受数；批量任务按批次完成日、旧模式按发送时间归集',
      'Shopify 金额为未取消订单总额，未扣退款；GA4 为本平台邮件活动购买收入，两者口径独立'];
    if (!data.shopifyOrdersAvailable) notes.push('当前店铺未接入 Shopify 订单，订单指标暂不可用');
    if (data.shopifyRevenueMixed) notes.push('Shopify 订单币种混合，订单金额不合计展示');
    if (data.ga4RevenueMixed) notes.push('GA4 报告币种混合，邮件购买收入不合计展示');
    if (!data.ga4Connected) notes.push('GA4 尚未连接，邮件购买收入暂不可用');
    if (data.ga4Connected && !data.ga4RevenueMixed && data.days.some(function (day) {
      return day.ga4PurchaseRevenue === null;
    })) notes.push('GA4 未覆盖的日期显示“—”，不代表零收入');
    if (data.shopifyCurrency && data.ga4Currency && data.shopifyCurrency !== data.ga4Currency) {
      notes.push('两种金额币种不同，分别使用独立刻度，不可直接比较');
    }
    note.textContent = notes.join(' · ');
  }

  if (!root.dataset.shop) {
    state.textContent = '请选择店铺以查看趋势。';
    return;
  }
  fetch(root.dataset.trendUrl + '?shop=' + encodeURIComponent(root.dataset.shop), {
    credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' }
  }).then(function (response) {
    if (response.status === 404) throw new Error('当前服务尚未加载趋势接口，请重启店铺端。');
    if (response.status === 401 || response.status === 403) {
      throw new Error('没有权限读取当前店铺的趋势数据。');
    }
    if (!response.ok) throw new Error('趋势暂不可用，请确认 v38 数据库迁移和后台任务状态。');
    return response.json();
  }).then(render).catch(function (error) {
    state.textContent = error && error.message ? error.message : '趋势暂不可用，请稍后重试。';
    updated.textContent = '暂不可用';
  });
}());
