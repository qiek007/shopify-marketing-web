(function () {
    'use strict';

    var selector = 'time[data-browser-time]';
    var browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    var formatter = new Intl.DateTimeFormat(undefined, {
        timeZone: browserZone,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        timeZoneName: 'short'
    });
    var dateTimeFormatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: browserZone,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hourCycle: 'h23'
    });

    function parse(value) {
        if (value === null || value === undefined || value === '') return null;
        var text = String(value).trim();
        if (!text) return null;
        var numeric = /^-?\d+(\.\d+)?$/.test(text) ? Number(text) : NaN;
        if (Number.isFinite(numeric)) {
            if (Math.abs(numeric) < 100000000000) numeric *= 1000;
            return new Date(numeric);
        }
        return new Date(text);
    }

    function formatDateTime(date) {
        var parts = {};
        dateTimeFormatter.formatToParts(date).forEach(function (part) {
            if (part.type !== 'literal') parts[part.type] = part.value;
        });
        return parts.year + '-' + parts.month + '-' + parts.day + ' '
                + parts.hour + ':' + parts.minute + ':' + parts.second;
    }

    function formatElement(element) {
        var raw = element.getAttribute('datetime') || element.dataset.browserTime;
        var format = element.dataset.browserTimeFormat || 'localized';
        var cacheKey = raw + '|' + format;
        if (!raw || element.dataset.browserTimeFormatted === cacheKey) return;
        var date = parse(raw);
        if (!date || isNaN(date.getTime())) return;
        var utc = date.toISOString();
        element.textContent = format === 'date-time' ? formatDateTime(date) : formatter.format(date);
        element.setAttribute('datetime', utc);
        element.title = '显示时区: ' + browserZone + '\nUTC: ' + utc;
        element.dataset.browserTimeFormatted = cacheKey;
    }

    function formatRoot(root) {
        if (!root) return;
        if (root.nodeType === 1 && root.matches(selector)) formatElement(root);
        if (root.querySelectorAll) root.querySelectorAll(selector).forEach(formatElement);
    }

    function start() {
        formatRoot(document);
        new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                mutation.addedNodes.forEach(formatRoot);
            });
        }).observe(document.documentElement, { childList: true, subtree: true });
    }

    window.BrowserTime = { parse: parse, formatElement: formatElement,
        formatRoot: formatRoot, timeZone: browserZone };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
}());
