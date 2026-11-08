(function (root, factory) {
    var api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root && root.document) api.mount(root);
}(typeof window === 'undefined' ? null : window, function () {
    'use strict';
    function calendarDate(value) {
        var parts;
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
            parts = value.split('-').map(Number);
        } else if (Array.isArray(value) && value.length === 3 && value.every(Number.isInteger)) {
            parts = value;
        } else return null;
        var year = parts[0], month = parts[1], day = parts[2];
        if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1) return null;
        var leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
        var monthDays = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        if (day > monthDays[month - 1]) return null;
        return String(year).padStart(4, '0') + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    }
    function classify(data) {
        if (!data || typeof data.ready !== 'boolean') return 'incomplete';
        if (!data.ready) return 'preparing';
        if (!Array.isArray(data.days)) return 'incomplete';
        if (!data.days.length) return 'empty';
        var dates = data.days.map(function (day) { return day ? calendarDate(day.date) : null; });
        if (dates.length !== 30 || dates.some(function (date) { return date === null; })) return 'incomplete';
        for (var i = 1; i < dates.length; i++) {
            if (dates[i - 1] >= dates[i]) return 'incomplete';
        }
        return 'ready';
    }
    function sum(days, key) {
        var total = 0;
        for (var i = 0; i < days.length; i++) {
            var value = days[i][key];
            if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) return null;
            total += value;
            if (!Number.isSafeInteger(total)) return null;
        }
        return total;
    }
    function summarize(data, range) {
        if (classify(data) !== 'ready' || (range !== 7 && range !== 30)) return null;
        var selected = data.days.slice(-range).map(function (day) {
            return Object.assign({}, day, {date: calendarDate(day.date)});
        });
        return { days: selected, sent: sum(selected, 'emailSentCount'),
            delivered: sum(selected, 'emailDeliveredCount'),
            orders: data.shopifyOrdersAvailable === true ? sum(selected, 'shopifyOrderCount') : null };
    }
    function responseError(status, redirected, type) {
        if (status === 401 || redirected || (status === 200 && type && !/\bjson\b/i.test(type))) return '登录状态可能已过期，请返回应用重新进入。';
        if (status === 403) return '没有权限读取当前店铺的趋势数据。';
        if (status < 200 || status >= 300) return '趋势暂不可用，请稍后重试。';
        return null;
    }
    function errorMessage(error) {
        return error && error.isTrendError === true ? error.message : '趋势暂不可用，请稍后重试。';
    }
    function mount(win) {
        var root = win.document.querySelector('[data-mobile-trends]');
        if (!root) return;
        var state = root.querySelector('[data-mobile-trend-state]');
        var content = root.querySelector('[data-mobile-trend-content]');
        var totals = root.querySelector('[data-mobile-trend-totals]');
        var rows = root.querySelector('[data-mobile-trend-rows]');
        var period = root.querySelector('[data-mobile-trend-period]');
        var metadata = root.querySelector('[data-mobile-trend-meta]');
        var buttons = Array.prototype.slice.call(root.querySelectorAll('[data-mobile-range]'));
        var data;
        function item(parent, name, value, unavailable) {
            var box = win.document.createElement('div');
            var label = win.document.createElement('span'); label.textContent = name;
            var number = win.document.createElement('strong');
            number.textContent = value === null ? (unavailable || '待汇总') : new Intl.NumberFormat().format(value);
            box.appendChild(label); box.appendChild(number); parent.appendChild(box);
        }
        function paint(range) {
            var summary = summarize(data, range);
            if (!summary) return;
            totals.replaceChildren(); rows.replaceChildren();
            item(totals, '邮件发送', summary.sent);
            item(totals, '邮件送达', summary.delivered);
            item(totals, 'Shopify 订单', summary.orders, data.shopifyOrdersAvailable === true ? '待汇总' : '不可用');
            period.textContent = summary.days[0].date + ' 至 ' + summary.days[summary.days.length - 1].date;
            buttons.forEach(function (button) { button.setAttribute('aria-pressed', String(Number(button.dataset.mobileRange) === range)); });
            summary.days.slice().reverse().forEach(function (day) {
                var row = win.document.createElement('div');
                var date = win.document.createElement('time'); date.textContent = day.date; date.dateTime = day.date;
                var counts = win.document.createElement('span');
                var sent = sum([day], 'emailSentCount'), delivered = sum([day], 'emailDeliveredCount');
                counts.textContent = '发送 ' + (sent === null ? '待汇总' : sent.toLocaleString())
                    + ' · 送达 ' + (delivered === null ? '待汇总' : delivered.toLocaleString());
                row.appendChild(date); row.appendChild(counts); rows.appendChild(row);
            });
        }
        buttons.forEach(function (button) { button.addEventListener('click', function () { paint(Number(button.dataset.mobileRange)); }); });
        if (!root.dataset.shop) { state.textContent = '请选择店铺以查看趋势。'; return; }
        win.fetch(root.dataset.trendUrl + '?shop=' + encodeURIComponent(root.dataset.shop), {
            credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' }
        }).then(function (response) {
            var error = responseError(response.status, response.redirected, response.headers.get('content-type') || '');
            if (error) { var failure = new Error(error); failure.isTrendError = true; throw failure; }
            return response.json();
        }).then(function (result) {
            var type = classify(result);
            if (type !== 'ready') {
                state.textContent = type === 'empty' ? '当前没有趋势数据。' : type === 'incomplete' ? '趋势数据不完整，请稍后刷新。' : '后台正在生成每日汇总，请稍后刷新。';
                return;
            }
            data = result;
            metadata.textContent = (data.timeZone ? '统计时区：' + data.timeZone + '。' : '')
                + '邮件发送为服务商提交数；送达为回执次数，按活动汇总创建日归集。';
            state.hidden = true; content.hidden = false;
            paint(7);
        }).catch(function (error) {
            state.textContent = errorMessage(error);
        });
    }
    return { classify: classify, summarize: summarize, responseError: responseError, errorMessage: errorMessage, mount: mount };
}));
