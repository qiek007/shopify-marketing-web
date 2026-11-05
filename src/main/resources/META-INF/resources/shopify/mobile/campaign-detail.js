(function (root, factory) {
    var api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root && root.document) {
        var forms = Array.prototype.slice.call(root.document.querySelectorAll('[data-mobile-campaign-action]'));
        var reset = api.installActionGuard(forms, function (message) { return root.confirm(message); });
        var loading = root.document.querySelector('[data-mobile-action-loading]');
        if (loading) loading.hidden = true;
        root.addEventListener('pageshow', function (event) { if (event.persisted) reset(); });
    }
}(typeof window === 'undefined' ? null : window, function () {
    'use strict';

    function installActionGuard(forms, confirmAction) {
        var pending = false;
        var buttons = [];
        forms.forEach(function (form) {
            Array.prototype.forEach.call(form.querySelectorAll('button[type="submit"]'), function (button) {
                if (form.dataset.requiresGuard === 'true') button.disabled = false;
                buttons.push({ button: button, disabled: button.disabled });
            });
            form.addEventListener('submit', function (event) {
                if (pending) { event.preventDefault(); return; }
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

    return { installActionGuard: installActionGuard };
}));
