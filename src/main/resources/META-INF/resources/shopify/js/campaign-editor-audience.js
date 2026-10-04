(function () {
    'use strict';

    var root = document.querySelector('.campaign-audience-tags');
    if (!root) return;
    var pickers = Array.prototype.slice.call(root.querySelectorAll('.customer-tag-select'));
    var segment = document.querySelector('[name="segmentId"]');
    var confirmation = root.querySelector('.checkbox-row');
    var confirmationCheckbox = root.querySelector('[name="allCustomersConfirmed"]');

    function syncAllCustomersConfirmation() {
        if (!segment || !confirmation || !confirmationCheckbox) return;
        var hasAudienceCriteria = Boolean(segment.value.trim())
            || Boolean(root.querySelector(
                'input[name="includeTags"]:checked,input[name="excludeTags"]:checked'));
        confirmation.hidden = hasAudienceCriteria;
        confirmationCheckbox.disabled = hasAudienceCriteria;
        if (hasAudienceCriteria) confirmationCheckbox.checked = false;
    }

    function checkedLabels(details) {
        return Array.prototype.map.call(
            details.querySelectorAll('.customer-tag-options input[type="checkbox"]:checked'),
            function (checkbox) {
                var label = checkbox.closest('label');
                var text = label && label.querySelector('span');
                return text ? text.textContent.trim() : checkbox.value;
            });
    }

    function renderSummary(details) {
        var summary = details.querySelector('summary span');
        if (!summary) return;
        if (!summary.dataset.emptyLabel) summary.dataset.emptyLabel = summary.textContent.trim();
        var labels = checkedLabels(details);
        if (!labels.length) {
            summary.textContent = summary.dataset.emptyLabel;
            summary.removeAttribute('title');
            return;
        }
        summary.textContent = labels.length <= 2
            ? labels.join('、')
            : labels.slice(0, 2).join('、') + ' 等 ' + labels.length + ' 个';
        summary.title = labels.join('、');
    }

    function closeAll(except) {
        pickers.forEach(function (details) {
            if (details !== except) details.removeAttribute('open');
        });
    }

    pickers.forEach(function (details) {
        renderSummary(details);
        details.addEventListener('toggle', function () {
            if (details.open) closeAll(details);
        });
        details.querySelectorAll('input[type="checkbox"]').forEach(function (checkbox) {
            checkbox.addEventListener('change', function () {
                renderSummary(details);
                syncAllCustomersConfirmation();
            });
        });
    });
    if (segment) segment.addEventListener('change', syncAllCustomersConfirmation);
    syncAllCustomersConfirmation();

    document.addEventListener('click', function (event) {
        if (event.target.closest('.customer-tag-select')) return;
        closeAll();
    });
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') closeAll();
    });
})();
