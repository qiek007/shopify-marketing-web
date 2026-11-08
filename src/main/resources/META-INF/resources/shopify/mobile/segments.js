(function (root, factory) {
    var api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root && root.document) api.init(root.document, root);
}(typeof window === 'undefined' ? null : window, function () {
    'use strict';
    function safeBehaviorValue(value) {
        try {
            var parsed = JSON.parse(value);
            var keys = ['activity', 'fromDate', 'toDate', 'minTotalCount', 'maxTotalCount', 'minUniqueCount', 'maxUniqueCount'];
            var activities = ['EMAIL_DELIVERED','EMAIL_OPENED','EMAIL_CLICKED','EMAIL_FAILED','PRODUCT_VIEWED','PRODUCT_ADDED_TO_CART','ORDER_COMPLETED'];
            return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
                && Object.keys(parsed).every(function (key) { return keys.indexOf(key) >= 0; })
                && activities.indexOf(parsed.activity) >= 0
                && ['fromDate','toDate'].every(function (key) { return parsed[key] == null || (typeof parsed[key] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed[key])); })
                && ['minTotalCount','maxTotalCount','minUniqueCount','maxUniqueCount'].every(function (key) { return parsed[key] == null || (Number.isInteger(parsed[key]) && parsed[key] >= 0); });
        } catch (error) { return false; }
    }
    function createRuleState(field, operator, value) {
        var current = {field: field, operator: operator, value: value};
        return {submission: function () { return Object.assign({}, current); },
            update: function (f, o, v) { current = {field: f, operator: o, value: v}; }};
    }
    function lockUnknownRule(row) {
        var field = row.querySelector('[name="fields"]');
        var value = row.querySelector('[name="values"]');
        var locked = /^BEHAVIOR_/.test(field.value) && !safeBehaviorValue(value.value);
        row.dataset.lockedMetric = locked ? 'true' : 'false';
        if (locked) value.readOnly = true;
        return locked;
    }
    function restoreLockedRule(row, state) {
        var original = state.submission();
        row.querySelector('[name="fields"]').value = original.field;
        row.querySelector('[name="operators"]').value = original.operator;
        row.querySelector('[name="values"]').value = original.value;
    }
    function submissionForRow(row, state) {
        if (row.dataset.dirty !== 'true') return state.submission();
        return {field: row.querySelector('[name="fields"]').value,
            operator: row.querySelector('[name="operators"]').value,
            value: row.querySelector('[name="values"]').value};
    }
    function isPreviewHtml(html) {
        return /<section\s+class=["']ms-result["']/.test(html);
    }
    function labelOriginalOption(select) {
        var options = Array.prototype.slice.call(select.querySelectorAll('option'));
        var original = options.find(function (option) { return option.dataset.originalOption === 'true'; });
        if (!original) return;
        var match = options.find(function (option) { return option !== original && !option.hidden && option.value === original.value; });
        if (match) original.textContent = match.textContent;
    }
    function updateRuleControls(groups, addGroup) {
        var allGroups = Array.prototype.slice.call(groups.querySelectorAll('.segment-rule-group'));
        var total = groups.querySelectorAll('.segment-rule-row').length;
        addGroup.disabled = total >= 20;
        allGroups.forEach(function (group, index) {
            var rows = group.querySelectorAll('.segment-rule-row');
            group.querySelector('h2').textContent = '条件组 ' + (index + 1);
            group.querySelector('.remove-group').disabled = allGroups.length <= 1;
            group.querySelector('.add-group-rule').disabled = total >= 20;
            rows.forEach(function (row) { row.querySelector('.remove-rule').disabled = rows.length <= 1; });
        });
    }
    function init(document, window) {
        var form = document.getElementById('mobile-segment-form');
        if (!form) return;
        var groups = document.getElementById('mobile-segment-groups');
        var addGroup = document.getElementById('mobile-add-group');
        var save = document.getElementById('mobile-segment-save');
        var preview = document.getElementById('mobile-segment-preview');
        var notice = document.getElementById('mobile-segment-notice');
        var result = document.getElementById('mobile-segment-results');
        var states = new WeakMap(), generation = 0, controller = null, submitting = false, next = Date.now();
        groups.querySelectorAll('.segment-rule-row').forEach(function (row) {
            labelOriginalOption(row.querySelector('[name="fields"]'));
            labelOriginalOption(row.querySelector('[name="operators"]'));
        });
        if (!addGroup || !save || !preview) return;
        function count() { return groups.querySelectorAll('.segment-rule-row').length; }
        function rowParts(row) { return [row.querySelector('[name="fields"]'), row.querySelector('[name="operators"]'), row.querySelector('[name="values"]')]; }
        function stateFor(row) { var p = rowParts(row), state = states.get(row); if (!state) { state = createRuleState(p[0].value, p[1].value, p[2].value); states.set(row, state); } return state; }
        function invalidate() { generation++; if (controller) controller.abort(); result.replaceChildren(); updateRuleControls(groups, addGroup); notice.textContent = '条件已更改，请重新预览。'; }
        function syncRow(row, restoreMetric) {
            var p = rowParts(row), field = p[0], operator = p[1], value = p[2];
            if (!restoreMetric) row.dataset.fieldRestored = 'true';
            if (window.SegmentBehaviorMetric && window.SegmentBehaviorMetric.sync(row, field, operator, value)) {
                return;
            }
            var times = ['EXISTS','BEFORE','AFTER','ON_OR_AFTER'];
            var allowed = {ALL_CUSTOMERS:['EXISTS'],SEARCH_TEXT:['CONTAINS'],CONSENT_STATE:['EQ','NE'],ORDER_COUNT:['EQ','GTE','LTE'],TOTAL_SPENT:['EQ','GTE','LTE'],TAG:['EQ','CONTAINS'],NO_TAG:['EXISTS'],LAST_ORDER_AT:times,RECENCY_DAYS:['EQ','GTE','LTE'],LAST_ACTIVITY_AT:times,CUSTOMER_CREATED_AT:['BEFORE','AFTER','ON_OR_AFTER'],EMAIL:['EQ','NE','CONTAINS'],CUSTOMER_NAME:['CONTAINS'],LOCALE:['EQ','NE'],ACCOUNT_STATE:['EQ','NE'],WEB_VIEWED_AT:times,WEB_CARTED_AT:times,EMAIL_DELIVERED_AT:times,EMAIL_OPENED_AT:times,EMAIL_CLICKED_AT:times,EMAIL_FAILED_AT:times,EMAIL_DELIVERED_NOT_OPENED_AT:times,EMAIL_OPENED_NOT_CLICKED_AT:times}[field.value];
            if (!allowed) { notice.textContent = '该字段不受移动端编辑器支持，请在电脑端修改。'; return; }
            operator.querySelectorAll('option').forEach(function (option) { option.disabled = allowed.indexOf(option.value) < 0; });
            if (allowed.indexOf(operator.value) < 0) operator.value = allowed[0];
            var numeric = ['ORDER_COUNT','TOTAL_SPENT','RECENCY_DAYS'].indexOf(field.value) >= 0;
            var dated = field.value.endsWith('_AT');
            var fixed = operator.value === 'EXISTS';
            value.type = fixed ? 'text' : numeric ? 'number' : dated ? 'date' : 'text';
            if (numeric) { value.min = '0'; value.step = field.value === 'TOTAL_SPENT' ? '0.01' : '1'; }
            else { value.removeAttribute('min'); value.removeAttribute('step'); }
            if (fixed) value.value = 'true';
            value.readOnly = fixed;
        }
        function newRow(group) {
            if (count() >= 20) { notice.textContent = '最多 20 条条件。'; return; }
            var row = document.getElementById('mobile-rule-template').content.firstElementChild.cloneNode(true);
            row.querySelector('[name="ruleGroupIds"]').value = group.dataset.groupId;
            group.querySelector('.segment-group-rules').appendChild(row);
            stateFor(row); row.dataset.dirty = 'true'; syncRow(row, false);
        }
        addGroup.addEventListener('click', function () {
            if (count() >= 20) { notice.textContent = '最多 20 条条件。'; return; }
            var id;
            do { id = 'mobile-' + (++next); } while (Array.prototype.some.call(groups.children, function (g) { return g.dataset.groupId === id; }));
            var group = document.getElementById('mobile-group-template').content.firstElementChild.cloneNode(true);
            group.dataset.groupId = id; group.querySelector('[name="groupIds"]').value = id;
            groups.appendChild(group); newRow(group); invalidate();
        });
        groups.addEventListener('click', function (event) {
            var button = event.target.closest('button'); if (!button) return;
            var row = button.closest('.segment-rule-row'), group = button.closest('.segment-rule-group');
            if (button.classList.contains('add-group-rule')) { newRow(group); invalidate(); }
            if (button.classList.contains('remove-rule') && group.querySelectorAll('.segment-rule-row').length > 1) { row.remove(); invalidate(); }
            if (button.classList.contains('remove-group') && groups.children.length > 1) { group.remove(); invalidate(); }
            if (button.classList.contains('edit-metric')) {
                var p = rowParts(row);
                if (!safeBehaviorValue(p[2].value)) { notice.textContent = '此行为规则包含移动端无法识别的内容，请在电脑端修改；未改动时将原样保留。'; return; }
                syncRow(row, true); invalidate(); button.hidden = true;
            }
        });
        groups.addEventListener('change', function (event) {
            var row = event.target.closest('.segment-rule-row');
            if (row && row.dataset.lockedMetric === 'true' && (event.target.name === 'fields' || event.target.name === 'operators')) {
                restoreLockedRule(row, stateFor(row));
                notice.textContent = '此规则含未知参数，已保持原样；请在电脑端修改。';
                event.stopPropagation();
                return;
            }
            if (row && (event.target.name === 'fields' || event.target.name === 'operators')) { row.dataset.dirty = 'true'; syncRow(row, false); }
        });
        form.addEventListener('input', function (event) {
            var row = event.target.closest('.segment-rule-row');
            if (row && row.dataset.lockedMetric !== 'true') row.dataset.dirty = 'true';
            invalidate();
        });
        form.addEventListener('change', invalidate);
        function loadPreview(page) {
            if (!form.reportValidity()) return;
            var current = ++generation; if (controller) controller.abort(); controller = new AbortController();
            var data = new FormData(form); data.set('previewPage', String(page));
            ['fields','operators','values'].forEach(function (key) { data.delete(key); });
            groups.querySelectorAll('.segment-rule-row').forEach(function (row) {
                var rule = submissionForRow(row, stateFor(row));
                data.append('fields', rule.field); data.append('operators', rule.operator); data.append('values', rule.value);
            });
            notice.textContent = '正在预览客户…';
            window.fetch(form.dataset.previewUrl, {method:'POST', body:data, credentials:'same-origin', redirect:'manual', cache:'no-store', signal:controller.signal})
                .then(function (response) { if (!response.ok || response.type === 'opaqueredirect' || (response.headers.get('content-type') || '').indexOf('text/html') < 0) throw new Error('preview'); return response.text(); })
                .then(function (html) { if (current !== generation) return; if (!isPreviewHtml(html)) throw new Error('preview'); result.innerHTML = html; notice.textContent = '预览完成，实际发送前将重新计算受众。'; })
                .catch(function (error) { if (current === generation && error.name !== 'AbortError') { result.replaceChildren(); notice.textContent = '预览失败，请检查规则和登录状态后重试。'; } });
        }
        preview.addEventListener('click', function () { loadPreview(1); });
        result.addEventListener('click', function (event) { var button = event.target.closest('[data-segment-preview-page]'); if (button) loadPreview(button.dataset.segmentPreviewPage); });
        form.addEventListener('submit', function (event) {
            if (submitting) { event.preventDefault(); return; }
            groups.querySelectorAll('.segment-rule-row').forEach(function (row) {
                if (row.dataset.dirty !== 'true') restoreLockedRule(row, stateFor(row));
            });
            submitting = true; save.disabled = true; save.textContent = '正在保存…';
        });
        groups.querySelectorAll('.segment-rule-row').forEach(function (row) {
            stateFor(row);
            if (row.dataset.newRule === 'true') { row.dataset.dirty = 'true'; syncRow(row, false); }
            else if (lockUnknownRule(row)) notice.textContent = '部分行为规则含未知参数，将原样保留；请在电脑端修改这些规则。';
        });
        updateRuleControls(groups, addGroup); preview.disabled = false; save.disabled = false;
    }
    return {safeBehaviorValue: safeBehaviorValue, createRuleState: createRuleState,
        lockUnknownRule: lockUnknownRule, restoreLockedRule: restoreLockedRule,
        submissionForRow: submissionForRow, isPreviewHtml: isPreviewHtml,
        labelOriginalOption: labelOriginalOption, updateRuleControls: updateRuleControls, init: init};
}));
