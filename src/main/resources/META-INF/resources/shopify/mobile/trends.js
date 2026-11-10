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
        if (classify(data) !== 'ready' || (range !== 1 && range !== 7 && range !== 30)) return null;
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
    function countValue(value) {
        return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
    }
    function summarizeHourly(data) {
        if (!data || calendarDate(data.date) !== data.date || typeof data.timeZone !== 'string'
                || !data.timeZone || !Number.isFinite(Date.parse(data.generatedAt))
                || !Array.isArray(data.hours) || data.hours.length < 23 || data.hours.length > 25) return null;
        var previous = null, futureSeen = false;
        for (var i = 0; i < data.hours.length; i++) {
            var hour = data.hours[i];
            if (!hour || typeof hour.date !== 'string' || hour.date.slice(0, 10) !== data.date
                    || typeof hour.label !== 'string' || !/^\d{2}:\d{2}( [+-]\d{2}:\d{2})?$/.test(hour.label)
                    || typeof hour.future !== 'boolean') return null;
            var instant = Date.parse(hour.date);
            if (!Number.isFinite(instant) || (instant > Date.parse(data.generatedAt)) !== hour.future
                    || previous !== null && instant - previous !== 3600000
                    || futureSeen && !hour.future) return null;
            if (hour.future) {
                if (hour.emailSentCount != null || hour.emailDeliveredCount != null) return null;
                futureSeen = true;
            } else if ((hour.emailSentCount != null && countValue(hour.emailSentCount) === null)
                    || (hour.emailDeliveredCount != null && countValue(hour.emailDeliveredCount) === null)) return null;
            previous = instant;
        }
        var elapsed = data.hours.filter(function (hour) { return !hour.future; });
        if (!elapsed.length) return null;
        return {hours:data.hours, sent:sum(elapsed, 'emailSentCount'), delivered:sum(elapsed, 'emailDeliveredCount')};
    }
    function nearestDay(fraction, count) {
        return Math.max(0, Math.min(count - 1, Math.round(fraction * (count - 1))));
    }
    function chartModel(days) {
        var model = {width:600, height:300, left:72, right:568, top:20, bottom:246};
        var definitions = [
            {key:'emailSentCount', label:'发送', color:'#087453'},
            {key:'emailDeliveredCount', label:'送达', color:'#247ea2'}
        ];
        var maximum = 0;
        days.forEach(function (day) {
            definitions.forEach(function (series) { maximum = Math.max(maximum, countValue(day[series.key]) || 0); });
        });
        model.upper = Math.max(4, Math.ceil(maximum / 4) * 4);
        model.x = function (index) {
            return days.length === 1 ? (model.left + model.right) / 2
                : model.left + index / (days.length - 1) * (model.right - model.left);
        };
        model.series = definitions.map(function (definition) {
            var points = days.map(function (day, index) {
                var value = countValue(day[definition.key]);
                return value === null ? null : {x:model.x(index), y:model.bottom - value / model.upper * (model.bottom - model.top), value:value};
            });
            var segments = [], current = [];
            points.forEach(function (point) {
                if (point) current.push(point);
                else if (current.length) { segments.push(current); current = []; }
            });
            if (current.length) segments.push(current);
            return Object.assign({}, definition, {points:points, segments:segments});
        });
        return model;
    }
    function smoothPath(points) {
        if (!points.length) return '';
        var slopes = [], tangents = [];
        for (var i = 1; i < points.length; i++) {
            slopes.push((points[i].y - points[i - 1].y) / (points[i].x - points[i - 1].x));
        }
        for (var j = 0; j < points.length; j++) {
            if (!j) tangents.push(slopes[0] || 0);
            else if (j === points.length - 1) tangents.push(slopes[j - 1]);
            else {
                var before = slopes[j - 1], after = slopes[j];
                // Flat tangents at extrema keep the curve inside the measured values.
                tangents.push(before * after <= 0 ? 0 : 2 * before * after / (before + after));
            }
        }
        var path = 'M' + points[0].x + ',' + points[0].y;
        for (var k = 1; k < points.length; k++) {
            var previous = points[k - 1], point = points[k];
            var third = (point.x - previous.x) / 3;
            path += ' C' + (previous.x + third) + ',' + (previous.y + third * tangents[k - 1])
                + ' ' + (point.x - third) + ',' + (point.y - third * tangents[k])
                + ' ' + point.x + ',' + point.y;
        }
        return path;
    }
    function renderChart(win, host, readout, days, options) {
        var document = win.document;
        var hourly = options && options.hourly;
        var model = chartModel(days);
        var ns = 'http://www.w3.org/2000/svg';
        function svgElement(name, attributes, parent, text) {
            var node = document.createElementNS(ns, name);
            Object.keys(attributes).forEach(function (key) { node.setAttribute(key, attributes[key]); });
            if (text !== undefined) node.textContent = text;
            parent.appendChild(node);
            return node;
        }
        function countText(value) {
            return value === null ? '待汇总' : new Intl.NumberFormat().format(value);
        }
        host.replaceChildren();
        var svg = svgElement('svg', {viewBox:'0 0 600 300', tabindex:'0', role:'slider',
            'aria-label':hourly ? '今日每小时邮件发送与送达趋势，左右滑动或按方向键查看明细'
                : '每日邮件发送与送达趋势，左右滑动或按方向键查看明细',
            'aria-valuemin':'1', 'aria-valuemax':days.length}, host);
        var compact = new Intl.NumberFormat('zh-CN', {notation:'compact', maximumFractionDigits:1});
        for (var tick = 0; tick <= 4; tick++) {
            var y = model.bottom - tick / 4 * (model.bottom - model.top);
            svgElement('line', {x1:model.left, x2:model.right, y1:y, y2:y, stroke:'#dfeae4'}, svg);
            svgElement('text', {x:model.left - 10, y:y + 6, 'text-anchor':'end', fill:'#61776b', 'font-size':'20'}, svg, compact.format(model.upper * tick / 4));
        }
        var ticks = hourly ? [0, 6, 12, 18, days.length - 1] : [0, Math.floor((days.length - 1) / 2), days.length - 1];
        ticks.filter(function (index, position, indices) {
            return indices.indexOf(index) === position;
        }).forEach(function (index) {
            svgElement('text', {x:model.x(index), y:282, 'text-anchor':'middle', fill:'#61776b', 'font-size':'20'}, svg,
                hourly ? days[index].label.slice(0, 5) : days[index].date.slice(5));
        });
        model.series.forEach(function (series) {
            series.segments.forEach(function (segment) {
                var path = smoothPath(segment);
                svgElement('path', {d:path, fill:'none', stroke:series.color, 'stroke-width':'3', 'vector-effect':'non-scaling-stroke', 'stroke-linejoin':'round'}, svg);
                if (segment.length === 1) svgElement('circle', {cx:segment[0].x, cy:segment[0].y, r:'4', fill:series.color}, svg);
            });
        });
        var guide = svgElement('line', {x1:0, x2:0, y1:model.top, y2:model.bottom, stroke:'#789389', 'stroke-dasharray':'6 5'}, svg);
        var markers = model.series.map(function (series) {
            return svgElement('circle', {r:'6', fill:series.color, stroke:'#fff', 'stroke-width':'2'}, svg);
        });
        var tooltip = document.createElement('div');
        tooltip.className = 'mobile-trends-tooltip';
        tooltip.hidden = true;
        host.appendChild(tooltip);
        var selected = days.length - 1;
        if (hourly) while (selected > 0 && days[selected].future) selected--;
        var pointer = null;
        function select(index, clientY, showTooltip) {
            selected = index;
            var day = days[index];
            var sent = countText(countValue(day.emailSentCount));
            var delivered = countText(countValue(day.emailDeliveredCount));
            var title = hourly ? options.date + ' ' + day.label : day.date;
            var description = title + (day.future ? ' · 未到该时段' : ' · 发送 ' + sent + ' · 送达 ' + delivered);
            readout.textContent = description;
            svg.setAttribute('aria-valuenow', index + 1);
            svg.setAttribute('aria-valuetext', description);
            guide.setAttribute('x1', model.x(index));
            guide.setAttribute('x2', model.x(index));
            markers.forEach(function (marker, series) {
                var point = model.series[series].points[index];
                marker.setAttribute('visibility', point ? 'visible' : 'hidden');
                if (point) { marker.setAttribute('cx', point.x); marker.setAttribute('cy', point.y); }
            });
            tooltip.textContent = title + (day.future ? '\n未到该时段' : '\n发送 ' + sent + '\n送达 ' + delivered);
            tooltip.hidden = !showTooltip;
            if (!showTooltip) return;
            var rect = host.getBoundingClientRect();
            var x = model.x(index) / model.width * rect.width;
            tooltip.style.left = Math.max(4, Math.min(rect.width - tooltip.offsetWidth - 4, x - tooltip.offsetWidth / 2)) + 'px';
            var top = clientY === undefined ? 8 : clientY - rect.top - tooltip.offsetHeight - 16;
            tooltip.style.top = Math.max(4, Math.min(rect.height - tooltip.offsetHeight - 4, top)) + 'px';
        }
        function follow(event) {
            var rect = svg.getBoundingClientRect();
            if (!rect.width) return;
            var x = (event.clientX - rect.left) / rect.width * model.width;
            select(nearestDay((x - model.left) / (model.right - model.left), days.length), event.clientY, true);
        }
        svg.addEventListener('pointerdown', function (event) {
            pointer = event.pointerId;
            follow(event);
            if (svg.setPointerCapture) {
                try { svg.setPointerCapture(event.pointerId); } catch (error) { /* The details still follow clicks when capture is unavailable. */ }
            }
        });
        svg.addEventListener('pointermove', function (event) { if (event.pointerType === 'mouse' || event.pointerId === pointer) follow(event); });
        svg.addEventListener('pointerup', function () { pointer = null; });
        svg.addEventListener('pointercancel', function () { pointer = null; tooltip.hidden = true; });
        svg.addEventListener('pointerleave', function (event) { if (event.pointerType === 'mouse' && pointer === null) tooltip.hidden = true; });
        svg.addEventListener('keydown', function (event) {
            var next = {ArrowLeft:selected - 1, ArrowRight:selected + 1, Home:0, End:days.length - 1};
            if (!Object.prototype.hasOwnProperty.call(next, event.key)) return;
            event.preventDefault();
            select(Math.max(0, Math.min(days.length - 1, next[event.key])), undefined, true);
        });
        select(selected, undefined, false);
    }
    function mount(win) {
        var root = win.document.querySelector('[data-mobile-trends]');
        if (!root) return;
        var state = root.querySelector('[data-mobile-trend-state]');
        var content = root.querySelector('[data-mobile-trend-content]');
        var totals = root.querySelector('[data-mobile-trend-totals]');
        var chart = root.querySelector('[data-mobile-trend-chart]');
        var readout = root.querySelector('[data-mobile-trend-selection]');
        var period = root.querySelector('[data-mobile-trend-period]');
        var metadata = root.querySelector('[data-mobile-trend-meta]');
        var help = root.querySelector('[data-mobile-trend-help]');
        var buttons = Array.prototype.slice.call(root.querySelectorAll('[data-mobile-range]'));
        var data;
        var requestVersion = 0;
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
            var version = ++requestVersion;
            chart.hidden = false;
            totals.replaceChildren();
            item(totals, '邮件发送', summary.sent);
            item(totals, '邮件送达', summary.delivered);
            item(totals, 'Shopify 订单', summary.orders, data.shopifyOrdersAvailable === true ? '待汇总' : '不可用');
            period.textContent = range === 1 ? summary.days[0].date + '（今天）'
                : summary.days[0].date + ' 至 ' + summary.days[summary.days.length - 1].date;
            buttons.forEach(function (button) { button.setAttribute('aria-pressed', String(Number(button.dataset.mobileRange) === range)); });
            metadata.textContent = (data.timeZone ? '统计时区：' + data.timeZone + '。' : '')
                + '邮件发送为服务商提交数；送达为回执次数，按活动汇总创建日归集。';
            if (help) help.textContent = '点击或左右滑动曲线，查看对应日期明细';
            if (range !== 1) { renderChart(win, chart, readout, summary.days); return; }
            chart.hidden = true;
            chart.replaceChildren();
            readout.textContent = '正在读取今天的小时趋势…';
            if (help) help.textContent = '今天按小时显示，当前小时尚未结束。';
            win.fetch(root.dataset.hourlyUrl + '?shop=' + encodeURIComponent(root.dataset.shop), {
                credentials:'same-origin', cache:'no-store', headers:{Accept:'application/json'}
            }).then(function (response) {
                var message = responseError(response.status, response.redirected, response.headers.get('content-type') || '');
                if (message) { var failure = new Error(message); failure.isTrendError = true; throw failure; }
                return response.json();
            }).then(function (result) {
                if (version !== requestVersion) return;
                var hourlySummary = summarizeHourly(result);
                if (!hourlySummary) throw new Error('Invalid hourly response');
                totals.replaceChildren();
                item(totals, '邮件发送', hourlySummary.sent);
                item(totals, '邮件送达', hourlySummary.delivered);
                item(totals, 'Shopify 订单', result.date === summary.days[0].date ? summary.orders : null,
                    data.shopifyOrdersAvailable === true ? '待汇总' : '不可用');
                period.textContent = result.date + '（今天 · 按小时）';
                metadata.textContent = '统计时区：' + result.timeZone + '。每小时独立统计，当前小时尚未结束。'
                    + '发送为服务商提交数；送达为回执次数，按活动汇总创建时间归集。';
                if (help) help.textContent = '点击或左右滑动曲线，查看小时明细；未来时段留空。';
                chart.hidden = false;
                renderChart(win, chart, readout, hourlySummary.hours, {hourly:true, date:result.date});
            }).catch(function (error) {
                if (version !== requestVersion) return;
                readout.textContent = error && error.isTrendError ? error.message
                    : '小时趋势暂不可用，请稍后点击“今天”重试。';
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
            paint(1);
        }).catch(function (error) {
            state.textContent = errorMessage(error);
        });
    }
    return { classify: classify, summarize: summarize, responseError: responseError, errorMessage: errorMessage,
        chartModel: chartModel, smoothPath: smoothPath, summarizeHourly: summarizeHourly,
        nearestDay: nearestDay, renderChart: renderChart, mount: mount };
}));
