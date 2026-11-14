(function () {
    'use strict';

    var root = document.querySelector('.campaign-audience-tags');
    if (!root) return;
    var pickers = Array.prototype.slice.call(root.querySelectorAll('.customer-tag-select'));
    var segment = document.querySelector('[name="segmentId"]');
    var confirmation = root.querySelector('.checkbox-row');
    var confirmationCheckbox = root.querySelector('[name="allCustomersConfirmed"]');

    function hasCriteria() {
        return Boolean(segment && segment.value.trim())
            || Boolean(root.querySelector('input[name="segmentIds"]:checked,input[name="includeTags"]:checked,input[name="excludeTags"]:checked'));
    }

    function syncAllCustomersConfirmation() {
        if (!confirmation || !confirmationCheckbox) return;
        var hasAudienceCriteria = hasCriteria();
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
    root.querySelectorAll('#campaign-segment-multi [data-tag-search]').forEach(function (input) {
        var picker = input.closest('details');
        input.addEventListener('input', function () {
            var query = input.value.trim().toLocaleLowerCase();
            var found = 0;
            picker.querySelectorAll('.customer-tag-options > label').forEach(function (label) {
                label.hidden = !label.textContent.toLocaleLowerCase().includes(query);
                if (!label.hidden) found++;
            });
            picker.querySelector('[data-tag-search-empty]').hidden = found !== 0;
        });
        input.addEventListener('keydown', function (event) { if (event.key === 'Enter') event.preventDefault(); });
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

    var preview = root.querySelector('[data-draft-audience-preview]');
    if (!preview) return;
    var form = root.closest('form');
    var status = preview.querySelector('[data-draft-preview-status]');
    var result = preview.querySelector('[data-draft-preview-result]');
    var rows = preview.querySelector('[data-draft-preview-rows]');
    var start = root.querySelector('[data-draft-preview-open]');
    if (!start) return;
    var previous = preview.querySelector('[data-draft-preview-prev]');
    var next = preview.querySelector('[data-draft-preview-next]');
    var pageLabel = preview.querySelector('[data-draft-preview-page]');
    var audienceNames = ['shop','campaignId','segmentId','segmentIds','includeTags','excludeTags',
        'includeTagMode','segmentTagRelation','allCustomersConfirmed','repeatIntervalHours'];
    var request;
    var page = 1;
    function showStatus(text) {
        status.textContent = text;
        status.hidden = !text;
        preview.hidden = !text;
    }
    function clearResults() {
        rows.replaceChildren();
        result.hidden = true;
    }
    function invalidate() {
        if (request) request.abort();
        request = null;
        start.disabled = false;
        clearResults();
        if (!status.hidden) showStatus('受众条件已修改，请重新预览。');
    }
    function validateAudience() {
        var count = root.querySelectorAll('[name="segmentIds"]:checked').length;
        if (count > 20) return '最多选择 20 个客户分群。';
        if (!hasCriteria() && !confirmationCheckbox?.checked) return '请先选择客户分群或标签，或明确确认全部客户。';
        return '';
    }
    function render(data) {
        if (!Array.isArray(data.customers) || !Number.isInteger(data.total) || !Number.isInteger(data.page)
                || !Number.isInteger(data.pageSize) || data.pageSize < 1) throw Error('受众预览响应无效');
        page = data.page;
        var pageCount = Math.ceil(data.total / data.pageSize);
        for (var customer of data.customers) {
            var row = document.createElement('tr');
            for (var text of [customer.customerName, customer.email,
                    customer.consentState === 'NOT_SUBSCRIBED' ? '未订阅（发送需确认）' : '已订阅',
                    customer.sourceTypeDisplayName]) {
                var cell = document.createElement('td');
                cell.textContent = text || '—';
                row.appendChild(cell);
            }
            rows.appendChild(row);
        }
        previous.disabled = page <= 1;
        next.disabled = page >= pageCount;
        pageLabel.textContent = '第 ' + page + ' / ' + pageCount + ' 页';
        result.hidden = data.total === 0;
        showStatus(data.total ? '符合条件的客户：' + data.total.toLocaleString() + ' 人' : '没有符合当前条件且具备发送资格的客户。');
    }
    async function load(requestedPage) {
        if (request) request.abort();
        clearResults();
        var validationMessage = validateAudience();
        if (validationMessage) { showStatus(validationMessage); return; }
        var params = new URLSearchParams();
        for (var entry of new FormData(form)) {
            if (audienceNames.includes(entry[0])) params.append(entry[0], entry[1]);
        }
        params.set('page', requestedPage);
        params.set('size', '20');
        var current = new AbortController();
        request = current;
        start.disabled = true;
        showStatus('正在匹配客户…');
        try {
            var response = await fetch(preview.dataset.draftAudiencePreview, {
                method: 'POST', body: params, signal: current.signal,
                headers: {'Accept': 'application/json'}, cache: 'no-store'
            });
            var data = await response.json().catch(function () { return {}; });
            if (request !== current) return;
            if (!response.ok) throw Error(data.message || '暂时无法预览受众，请稍后重试。');
            render(data);
        } catch (error) {
            if (request === current) showStatus(error.message || '暂时无法预览受众，请稍后重试。');
        } finally {
            if (request === current) {
                request = null;
                start.disabled = false;
            }
        }
    }
    form.addEventListener('change', function (event) {
        if (audienceNames.includes(event.target.name)) invalidate();
    });
    form.querySelector('[name="repeatIntervalHours"]')?.addEventListener('input', invalidate);
    start.addEventListener('click', function () { load(1); });
    previous.addEventListener('click', function () { load(page - 1); });
    next.addEventListener('click', function () { load(page + 1); });
})();
