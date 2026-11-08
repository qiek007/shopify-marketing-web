(function (root, factory) {
    var api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root && root.document) {
        var forms = Array.prototype.slice.call(root.document.querySelectorAll('[data-mobile-campaign-action]'));
        var timezone = root.document.querySelector('[data-mobile-schedule-timezone]');
        if (timezone) timezone.textContent = '按当前浏览器时区 ' + (Intl.DateTimeFormat().resolvedOptions().timeZone || '本地时区') + ' 选择时间';
        var planned = root.document.querySelector('[data-mobile-scheduled-time]');
        if (planned && planned.dataset.scheduledAt) {
            var current = api.parseInstant(planned.dataset.scheduledAt);
            if (current && !isNaN(current.getTime())) planned.textContent = current.toLocaleString(undefined, {year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', timeZoneName:'short'});
        }
        var reset = api.installActionGuard(forms, function (message) { return root.confirm(message); });
        var loading = root.document.querySelector('[data-mobile-action-loading]');
        if (loading) loading.hidden = true;
        root.addEventListener('pageshow', function (event) { if (event.persisted) reset(); });
    }
}(typeof window === 'undefined' ? null : window, function () {
    'use strict';

    function localDateTimeValue(date) {
        return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    }
    function parseInstant(value) {
        if (value === null || value === undefined || value === '') return null;
        var numeric = typeof value === 'number' ? value : (/^-?\d+(\.\d+)?$/.test(String(value)) ? Number(value) : NaN);
        if (Number.isFinite(numeric)) return new Date(Math.abs(numeric) < 100000000000 ? numeric * 1000 : numeric);
        return new Date(value);
    }
    function scheduleInstant(value, now) {
        var selected = new Date(value);
        if (!value || isNaN(selected.getTime()) || selected <= now) return { error: '请选择晚于当前时间的发送日期和时间' };
        var nextDay = new Date(selected.getTime() + 24 * 60 * 60000);
        var offsetChange = nextDay.getTimezoneOffset() - selected.getTimezoneOffset();
        var ambiguous = offsetChange > 0 && localDateTimeValue(new Date(selected.getTime() + offsetChange * 60000)) === value;
        if (localDateTimeValue(selected) !== value || ambiguous) return { error: '此时间位于夏令时切换时段，请选择其他时间' };
        return { value: selected.toISOString() };
    }

    function installActionGuard(forms, confirmAction) {
        var pending = false;
        var buttons = [];
        forms.forEach(function (form) {
            var local = form.dataset.scheduleAction === 'true' && form.elements ? form.elements.scheduleLocal : null;
            var reason = form.dataset.rejectAction === 'true' && form.elements ? form.elements.reason : null;
            if (local) {
                var current = parseInstant(form.dataset.scheduledAt);
                var minimum = new Date(Date.now() + 60000);
                local.min = localDateTimeValue(minimum);
                local.value = localDateTimeValue(current && !isNaN(current.getTime()) && current > minimum ? current : new Date(Date.now() + 10 * 60000));
                local.addEventListener('input', function () { local.setCustomValidity(''); });
            }
            if (reason) reason.addEventListener('input', function () { reason.setCustomValidity(''); });
            Array.prototype.forEach.call(form.querySelectorAll('button[type="submit"]'), function (button) {
                if (form.dataset.requiresGuard === 'true') button.disabled = false;
                buttons.push({ button: button, disabled: button.disabled });
            });
            form.addEventListener('submit', function (event) {
                if (pending) { event.preventDefault(); return; }
                if (reason && !reason.value.trim()) {
                    event.preventDefault(); reason.setCustomValidity('请填写驳回原因'); reason.reportValidity(); return;
                }
                if (local) {
                    var schedule = scheduleInstant(local.value, new Date());
                    if (schedule.error) { event.preventDefault(); local.setCustomValidity(schedule.error); local.reportValidity(); return; }
                    form.elements.scheduledAt.value = schedule.value;
                }
                var message = form.dataset.confirmMessage;
                if (message && !confirmAction(message)) { event.preventDefault(); return; }
                pending = true;
                buttons.forEach(function (entry) { entry.button.disabled = true; });
            });
        });
        return function () {
            pending = false;
            buttons.forEach(function (entry) { entry.button.disabled = entry.disabled; });
        };
    }

    return { installActionGuard: installActionGuard, scheduleInstant: scheduleInstant, parseInstant: parseInstant };
}));
