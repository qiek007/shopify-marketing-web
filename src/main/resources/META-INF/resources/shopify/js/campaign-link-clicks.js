(function (root, factory) {
    var api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root && root.document) {
        root.document.querySelectorAll('[data-campaign-link-clicks]').forEach(function (panel) {
            api.mount(root, panel);
        });
    }
}(typeof window === 'undefined' ? null : window, function () {
    'use strict';

    var palette = ['#167d62', '#276596', '#6956a7', '#a86024', '#1a8b97', '#974a77', '#76812d', '#426189', '#647982', '#b4bfc7'];
    var number = new Intl.NumberFormat('zh-CN');
    var percent = new Intl.NumberFormat('zh-CN', { style: 'percent', maximumFractionDigits: 1 });
    var ns = 'http://www.w3.org/2000/svg';

    function slices(rows) {
        var ranked = rows.filter(function (row) { return row.clicks > 0 && row.key !== 'unmatched'; })
            .sort(function (a, b) { return b.clicks - a.clicks || a.key.localeCompare(b.key); });
        var top = ranked.slice(0, 8);
        if (ranked.length > 8) {
            top.push({ key: '__other__', label: '其他', other: true,
                clicks: ranked.slice(8).reduce(function (sum, row) { return sum + row.clicks; }, 0) });
        }
        var unmatched = rows.find(function (row) { return row.key === 'unmatched' && row.clicks > 0; });
        if (unmatched) top.push(unmatched);
        return top;
    }

    function ringPath(start, end) {
        function point(fraction, radius) {
            var angle = fraction * 2 * Math.PI - Math.PI / 2;
            return (100 + radius * Math.cos(angle)) + ' ' + (100 + radius * Math.sin(angle));
        }
        if (end - start >= 1) {
            return 'M 100 12 A 88 88 0 1 1 100 188 A 88 88 0 1 1 100 12 Z'
                + ' M 100 47 A 53 53 0 1 0 100 153 A 53 53 0 1 0 100 47 Z';
        }
        var large = end - start > 0.5 ? 1 : 0;
        return 'M ' + point(start, 88) + ' A 88 88 0 ' + large + ' 1 ' + point(end, 88)
            + ' L ' + point(end, 53) + ' A 53 53 0 ' + large + ' 0 ' + point(start, 53) + ' Z';
    }

    function safeLanding(value) {
        if (typeof value !== 'string') return null;
        try {
            var url = new URL(value);
            return (url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password ? url.href : null;
        } catch (error) {
            return null;
        }
    }

    function mount(win, panel) {
        var doc = win.document;
        var status = panel.querySelector('[data-clc-status]');
        var chart = panel.querySelector('[data-clc-chart]');
        var legend = panel.querySelector('[data-clc-legend]');
        var list = panel.querySelector('[data-clc-all-links]');
        var dialog = panel.querySelector('[data-clc-link-dialog]');
        var details = panel.querySelector('[data-clc-details]');
        var updateButton = panel.querySelector('[data-clc-refresh]');
        var previewFrame = doc.getElementById('campaign-preview-frame');
        var previewSelection = '';
        var timer, selected, report, renderedReport, pending = false, disposed = false;

        function element(tag, text) {
            var node = doc.createElement(tag);
            if (text != null) node.textContent = text;
            return node;
        }

        function svgElement(tag, attrs, label) {
            var node = doc.createElementNS(ns, tag);
            Object.keys(attrs).forEach(function (key) { node.setAttribute(key, attrs[key]); });
            if (label) node.textContent = label;
            return node;
        }

        function rowLabel(row) {
            return row.position == null ? row.label : '第 ' + row.position + ' 处 · ' + row.label;
        }

        function ratio(count) { return report.totalClicks > 0 ? percent.format(count / report.totalClicks) : '0%'; }

        function locatePreview(key, reveal) {
            if (!previewFrame || !previewFrame.dataset.previewSrc) return;
            var fragment = typeof key === 'string' && /^[a-f0-9]{64}$/.test(key) ? '#campaign-preview-link-' + key : '';
            if (fragment === previewSelection && !(reveal && fragment)) return;
            previewFrame.src = previewFrame.dataset.previewSrc + fragment;
            previewSelection = fragment;
        }

        function show(row, reveal) {
            if (row.other) {
                renderLinkList();
                if (!dialog.open) dialog.showModal();
                return;
            }
            if (reveal) selected = row.key;
            locatePreview(row.key, reveal);
            details.hidden = false;
            var summary = element('div');
            summary.className = 'clc-detail-summary';
            summary.append(element('p', number.format(row.clicks) + ' 次点击 · ' + number.format(row.people)
                + ' 人 · ' + ratio(row.clicks)));
            details.replaceChildren(element('strong', rowLabel(row)), summary);
            if (reveal && details.scrollIntoView) details.scrollIntoView({ block: 'nearest' });
            var url = safeLanding(row.destination);
            var landing = safeLanding(row.landing);
            if (!url || !landing) return;
            var actions = element('div');
            actions.className = 'clc-actions';
            var open = element('a', '打开落地页');
            open.className = 'clc-action';
            open.href = landing;
            open.target = '_blank';
            open.rel = 'noopener noreferrer';
            actions.append(open);
            if (win.navigator.clipboard && win.navigator.clipboard.writeText) {
                var copy = element('button', '复制地址');
                copy.type = 'button';
                copy.className = 'clc-action';
                copy.addEventListener('click', function () {
                    win.navigator.clipboard.writeText(row.destination).then(function () { copy.textContent = '已复制'; })
                        .catch(function () { copy.textContent = '复制失败，请重试'; });
                });
                actions.append(copy);
            }
            summary.append(actions);
        }

        function rowButton(row, color, inDialog) {
            var button = element('button');
            button.type = 'button';
            button.className = 'clc-link-row';
            if (row.other) {
                button.setAttribute('aria-haspopup', 'dialog');
                button.setAttribute('aria-controls', dialog.id);
            }
            if (color) {
                var dot = element('span');
                dot.className = 'clc-key';
                dot.style.backgroundColor = color;
                dot.setAttribute('aria-hidden', 'true');
                button.append(dot);
            }
            var label = element('span', rowLabel(row));
            label.className = 'clc-link-label';
            label.title = label.textContent;
            button.append(label, element('strong', number.format(row.clicks)),
                element('span', ratio(row.clicks)));
            button.addEventListener('click', function () {
                var current = row;
                if (inDialog) {
                    dialog.close();
                    current = report.links.find(function (link) { return link.key === row.key; });
                }
                if (current) show(current, true);
            });
            return button;
        }

        function renderLinkList() {
            var links = report.links.filter(function (row) { return row.key !== 'unmatched'; })
                .sort(function (a, b) { return b.clicks - a.clicks || a.key.localeCompare(b.key); });
            list.replaceChildren();
            links.forEach(function (row) { list.append(rowButton(row, null, true)); });
        }

        function render() {
            renderedReport = report;
            var labels = { PENDING: '等待首次统计', BACKFILL: '正在补算已有点击', LIVE: '随回调更新', FROZEN: '已归档固化',
                UNAVAILABLE: '此活动没有可用的逐链接统计' };
            status.textContent = labels[report.status];
            var frozen = report.status === 'FROZEN';
            var displayTime = frozen ? report.frozenAt : report.updatedAt;
            if (displayTime) {
                var at = new Date(displayTime);
                if (!isNaN(at.getTime())) status.textContent += (frozen ? ' · 固化时间 ' : ' · 统计更新时间 ')
                    + at.toLocaleString('zh-CN', { timeZoneName: 'short' });
            }
            chart.replaceChildren();
            legend.replaceChildren();
            var segments = slices(report.links);
            var needsZeroClickGroup = report.links.some(function (row) { return row.key !== 'unmatched' && row.clicks === 0; })
                && !segments.some(function (row) { return row.other; });
            chart.hidden = !segments.length;
            legend.hidden = !segments.length && !needsZeroClickGroup;
            updateButton.hidden = report.status === 'FROZEN' || report.status === 'UNAVAILABLE';
            if (segments.length) {
                var svg = svgElement('svg', { viewBox: '0 0 200 200', role: 'group', 'aria-label': '链接点击次数分布' });
                var cursor = 0;
                segments.forEach(function (row, index) {
                    var end = cursor + row.clicks / report.totalClicks;
                    var description = rowLabel(row) + ' · ' + number.format(row.clicks) + ' 次点击 · ' + ratio(row.clicks);
                    var path = svgElement('path', { d: ringPath(cursor, end), fill: palette[index], tabindex: '0',
                        role: 'button', 'aria-label': description });
                    if (row.other) {
                        path.setAttribute('aria-haspopup', 'dialog');
                        path.setAttribute('aria-controls', dialog.id);
                    }
                    path.append(svgElement('title', {}, description));
                    path.addEventListener('click', function () { show(row, true); });
                    path.addEventListener('keydown', function (event) {
                        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); show(row, true); }
                    });
                    svg.append(path);
                    cursor = end;
                    legend.append(rowButton(row, palette[index]));
                });
                svg.append(svgElement('text', { x: 100, y: 97, 'text-anchor': 'middle', class: 'clc-total' }, number.format(report.totalClicks)),
                    svgElement('text', { x: 100, y: 118, 'text-anchor': 'middle', class: 'clc-caption' }, '有效期内点击'));
                chart.append(svg);
            } else if (report.status === 'LIVE' || report.status === 'FROZEN') {
                status.textContent += ' · 暂无有效期内点击';
            }
            if (needsZeroClickGroup) legend.append(rowButton({ key: '__other__', label: '其他', other: true, clicks: 0 }, palette[8]));
            var current = report.links.find(function (row) { return row.key === selected; })
                || segments.find(function (row) { return !row.other && row.key !== 'unmatched'; });
            if (current) show(current);
            else {
                details.hidden = true;
                locatePreview(null);
            }
        }

        function schedule() {
            win.clearTimeout(timer);
            if (!disposed && (!report || (report.status !== 'FROZEN' && report.status !== 'UNAVAILABLE'))) {
                timer = win.setTimeout(function () { if (!doc.hidden) load(); else schedule(); }, 15000);
            }
        }

        function load() {
            if (pending || disposed) return;
            pending = true;
            updateButton.disabled = true;
            if (!report) status.textContent = '正在读取链接统计…';
            win.fetch(panel.dataset.campaignLinkClicks, { credentials: 'same-origin', cache: 'no-store',
                headers: { Accept: 'application/json' } }).then(function (response) {
                if (!response.ok) throw new Error('stats unavailable');
                return response.json();
            }).then(function (data) {
                if (disposed) return;
                if (!data || !['PENDING', 'BACKFILL', 'LIVE', 'FROZEN', 'UNAVAILABLE'].includes(data.status)
                        || !Number.isSafeInteger(data.totalClicks) || data.totalClicks < 0 || !Array.isArray(data.links)
                        || data.links.some(function (row) { return !row || typeof row.key !== 'string'
                            || !Number.isSafeInteger(row.clicks) || row.clicks < 0
                            || !Number.isSafeInteger(row.people) || row.people < 0; })
                        || data.links.reduce(function (sum, row) { return sum + row.clicks; }, 0) !== data.totalClicks) {
                    throw new Error('invalid report');
                }
                report = data;
                if (!dialog.open) render();
            }).catch(function () {
                if (!disposed) status.textContent = report ? '刷新失败，显示上次统计结果' : '暂时无法读取链接统计，请刷新重试';
            }).finally(function () {
                pending = false;
                updateButton.disabled = false;
                schedule();
            });
        }

        dialog.addEventListener('close', function () {
            if (report && report !== renderedReport) render();
        });
        updateButton.addEventListener('click', load);
        win.addEventListener('pagehide', function () { disposed = true; win.clearTimeout(timer); });
        win.addEventListener('pageshow', function (event) { if (event.persisted) { disposed = false; load(); } });
        load();
    }

    return { slices: slices, ringPath: ringPath, safeLanding: safeLanding, mount: mount };
}));
