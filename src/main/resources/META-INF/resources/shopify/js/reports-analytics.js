(function () {
    var host = document.querySelector('[data-report-series]');
    if (!host) return;
    var points = Array.prototype.map.call(host.querySelectorAll('i'), function (node) {
        function number(name) { return Number(node.getAttribute('data-' + name) || 0); }
        return { label: node.getAttribute('data-label') || '', sent: number('sent'),
            delivered: number('delivered'), opened: number('opened'), clicked: number('clicked'),
            orders: number('orders'), revenue: number('revenue'), ga4: number('ga4') };
    });
    var ns = 'http://www.w3.org/2000/svg';
    var colors = { sent: '#172d3d', delivered: '#16845b', opened: '#3978a8',
        clicked: '#d59035', revenue: '#d59035', ga4: '#73639a' };

    function element(name, attributes, text) {
        var node = document.createElementNS(ns, name);
        Object.keys(attributes || {}).forEach(function (key) { node.setAttribute(key, attributes[key]); });
        if (text !== undefined) node.textContent = text;
        return node;
    }
    function maxValue(keys) {
        var max = 0;
        points.forEach(function (point) { keys.forEach(function (key) { max = Math.max(max, point[key]); }); });
        if (max <= 0) return 1;
        var power = Math.pow(10, Math.floor(Math.log10(max)));
        return Math.ceil(max / power) * power;
    }
    function x(index) { return points.length <= 1 ? 380 : 48 + index * (680 / (points.length - 1)); }
    function y(value, max) { return 258 - value / max * 218; }
    function axes(svg, max) {
        for (var step = 0; step <= 4; step++) {
            var py = 258 - step * 54.5;
            svg.appendChild(element('line', { x1: 48, y1: py, x2: 728, y2: py, 'class': 'report-chart-gridline' }));
            svg.appendChild(element('text', { x: 40, y: py + 3, 'text-anchor': 'end', 'class': 'report-chart-axis' }, Math.round(max * step / 4).toLocaleString()));
        }
        var every = Math.max(1, Math.ceil(points.length / 7));
        points.forEach(function (point, index) {
            if (index % every && index !== points.length - 1) return;
            svg.appendChild(element('text', { x: x(index), y: 282, 'text-anchor': 'middle', 'class': 'report-chart-axis' }, point.label));
        });
    }
    function line(svg, key, max, color) {
        if (!points.length) return;
        var path = points.map(function (point, index) { return (index ? 'L' : 'M') + x(index) + ' ' + y(point[key], max); }).join(' ');
        svg.appendChild(element('path', { d: path, stroke: color, 'class': 'report-chart-path' }));
        points.forEach(function (point, index) {
            var circle = element('circle', { cx: x(index), cy: y(point[key], max), r: 3.7, fill: color, 'class': 'report-chart-point' });
            circle.appendChild(element('title', {}, point.label + ' · ' + point[key].toLocaleString()));
            svg.appendChild(circle);
        });
    }
    function engagement() {
        var svg = document.querySelector('[data-engagement-chart]');
        if (!svg) return;
        svg.textContent = '';
        var max = maxValue(['sent', 'delivered', 'opened', 'clicked']);
        axes(svg, max);
        ['sent', 'delivered', 'opened', 'clicked'].forEach(function (key) { line(svg, key, max, colors[key]); });
    }
    function commerce() {
        var svg = document.querySelector('[data-commerce-chart]');
        if (!svg) return;
        svg.textContent = '';
        var moneyMax = maxValue(['revenue', 'ga4']);
        var orderMax = maxValue(['orders']);
        axes(svg, moneyMax);
        var spacing = points.length <= 1 ? 40 : 660 / points.length;
        var width = Math.max(7, Math.min(28, spacing * .52));
        points.forEach(function (point, index) {
            var height = point.orders / orderMax * 218;
            var bar = element('rect', { x: x(index) - width / 2, y: 258 - height, width: width,
                height: height, rx: 2, 'class': 'report-order-bar' });
            bar.appendChild(element('title', {}, point.label + ' · 订单 ' + point.orders.toLocaleString()));
            svg.appendChild(bar);
        });
        line(svg, 'revenue', moneyMax, colors.revenue);
        line(svg, 'ga4', moneyMax, colors.ga4);
    }
    function render() { engagement(); commerce(); }
    var frame;
    function schedule() { cancelAnimationFrame(frame); frame = requestAnimationFrame(render); }
    requestAnimationFrame(render);
    window.addEventListener('resize', schedule, { passive: true });
})();
