(function (global) {
    'use strict';
    var activities = [
        'EMAIL_DELIVERED', 'EMAIL_OPENED', 'EMAIL_CLICKED', 'EMAIL_FAILED',
        'PRODUCT_VIEWED', 'PRODUCT_ADDED_TO_CART', 'ORDER_COMPLETED'
    ];
    var fieldActivities = {
        BEHAVIOR_PRODUCT_VIEWED: 'PRODUCT_VIEWED',
        BEHAVIOR_PRODUCT_ADDED_TO_CART: 'PRODUCT_ADDED_TO_CART',
        BEHAVIOR_ORDER_COMPLETED: 'ORDER_COMPLETED',
        BEHAVIOR_EMAIL_DELIVERED: 'EMAIL_DELIVERED',
        BEHAVIOR_EMAIL_OPENED: 'EMAIL_OPENED',
        BEHAVIOR_EMAIL_CLICKED: 'EMAIL_CLICKED',
        BEHAVIOR_EMAIL_FAILED: 'EMAIL_FAILED'
    };
    var activityFields = Object.keys(fieldActivities).reduce(function (result, field) {
        result[fieldActivities[field]] = field;
        return result;
    }, {});

    function parse(value) {
        try {
            var result = JSON.parse(value || '');
            return result && activities.indexOf(result.activity) >= 0 ? result : null;
        } catch (ignored) {
            return null;
        }
    }

    function ensureStyle() {
        if (document.getElementById('behavior-metric-editor-style')) return;
        var style = document.createElement('style');
        style.id = 'behavior-metric-editor-style';
        style.textContent = '.segment-rule-row.behavior-metric-rule-row{align-items:start}'
            + '.behavior-metric-editor{grid-column:1/-1;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;padding:12px;border:1px solid #d7e1dc;border-radius:8px;background:#f8fbf9}'
            + '.behavior-metric-editor label{display:grid;gap:6px}.behavior-metric-editor .behavior-metric-range{display:flex;align-items:center;gap:8px}'
            + '.behavior-metric-editor .behavior-metric-range input{min-width:0;width:100%}.behavior-metric-editor small{grid-column:1/-1;color:#66756e}'
            + '@media(max-width:900px){.behavior-metric-editor{grid-template-columns:1fr}}';
        document.head.appendChild(style);
    }

    function addOption(group, value, text) {
        var option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        group.appendChild(option);
    }

    function ensureOptions(field) {
        if (field.dataset.segmentOptionsGrouped === 'true') return;
        var selectedValue = field.value;
        var allCustomers = field.querySelector('option[value="ALL_CUSTOMERS"]');
        if (allCustomers) field.insertBefore(allCustomers, field.firstChild);

        function group(label) {
            var result = document.createElement('optgroup');
            result.label = label;
            return result;
        }
        function moveOptions(target, values) {
            values.forEach(function (name) {
                var option = field.querySelector('option[value="' + name + '"]');
                if (option) target.appendChild(option);
            });
            field.appendChild(target);
        }

        var profile = group('客户资料与活跃');
        moveOptions(profile, ['SEARCH_TEXT', 'EMAIL', 'CUSTOMER_NAME', 'LOCALE',
            'ACCOUNT_STATE', 'CUSTOMER_CREATED_AT', 'LAST_ACTIVITY_AT']);
        var eligibility = group('订阅与标签');
        moveOptions(eligibility, ['CONSENT_STATE', 'TAG', 'NO_TAG']);
        var commerce = group('订单与消费');
        moveOptions(commerce, ['ORDER_COUNT', 'TOTAL_SPENT', 'LAST_ORDER_AT', 'RECENCY_DAYS']);

        var onsite = document.createElement('optgroup');
        onsite.label = '站内行为（可按次数）';
        addOption(onsite, 'BEHAVIOR_PRODUCT_VIEWED', '有浏览记录');
        addOption(onsite, 'BEHAVIOR_PRODUCT_ADDED_TO_CART', '有加入购物车记录');
        addOption(onsite, 'BEHAVIOR_ORDER_COMPLETED', '有订单记录');
        field.appendChild(onsite);
        var onsiteTime = group('站内行为（按时间）');
        moveOptions(onsiteTime, ['WEB_VIEWED_AT', 'WEB_CARTED_AT']);

        var email = document.createElement('optgroup');
        email.label = '邮件互动（可按次数）';
        addOption(email, 'BEHAVIOR_EMAIL_DELIVERED', '已送达邮件');
        addOption(email, 'BEHAVIOR_EMAIL_OPENED', '已打开邮件');
        addOption(email, 'BEHAVIOR_EMAIL_CLICKED', '已点击链接');
        addOption(email, 'BEHAVIOR_EMAIL_FAILED', '发送失败/退信');
        field.appendChild(email);
        var emailTime = group('邮件互动（按时间）');
        moveOptions(emailTime, ['EMAIL_DELIVERED_AT', 'EMAIL_OPENED_AT', 'EMAIL_CLICKED_AT',
            'EMAIL_FAILED_AT', 'EMAIL_DELIVERED_NOT_OPENED_AT', 'EMAIL_OPENED_NOT_CLICKED_AT']);
        if (selectedValue) field.value = selectedValue;
        field.dataset.segmentOptionsGrouped = 'true';
    }

    function nullableCount(value) {
        return value === '' ? null : Number.parseInt(value, 10);
    }

    function serialize(row) {
        var editor = row.querySelector('.behavior-metric-editor');
        var value = row.querySelector('input[name="values"]');
        if (!editor || !value) return;
        value.value = JSON.stringify({
            activity: row.dataset.behaviorActivity,
            fromDate: editor.querySelector('[data-metric-from]').value || null,
            toDate: editor.querySelector('[data-metric-to]').value || null,
            minTotalCount: nullableCount(editor.querySelector('[data-metric-min-total]').value),
            maxTotalCount: nullableCount(editor.querySelector('[data-metric-max-total]').value),
            minUniqueCount: nullableCount(editor.querySelector('[data-metric-min-unique]').value),
            maxUniqueCount: nullableCount(editor.querySelector('[data-metric-max-unique]').value)
        });
    }

    function uniqueLabel(activity) {
        if (activity === 'ORDER_COMPLETED') return '去重订单数';
        if (activity === 'PRODUCT_VIEWED' || activity === 'PRODUCT_ADDED_TO_CART') {
            return '去重商品数';
        }
        return '去重邮件数';
    }

    function mount(row, value, activity) {
        var existing = row.querySelector('.behavior-metric-editor');
        row.dataset.behaviorActivity = activity;
        if (existing) {
            existing.querySelector('[data-metric-unique-label]').textContent = uniqueLabel(activity);
            serialize(row);
            return;
        }
        var initial = parse(value.value) || {};
        var editor = document.createElement('div');
        editor.className = 'behavior-metric-editor';
        editor.innerHTML = '<label><span>时间范围</span><span class="behavior-metric-range"><input type="date" data-metric-from aria-label="行为开始日期"><span>至</span><input type="date" data-metric-to aria-label="行为结束日期"></span></label>'
            + '<label><span>行为总次数</span><span class="behavior-metric-range"><input type="number" min="0" step="1" data-metric-min-total aria-label="行为总次数下限"><span>至</span><input type="number" min="0" step="1" data-metric-max-total aria-label="行为总次数上限"></span></label>'
            + '<label><span data-metric-unique-label>' + uniqueLabel(activity) + '</span><span class="behavior-metric-range"><input type="number" min="0" step="1" data-metric-min-unique aria-label="去重对象数下限"><span>至</span><input type="number" min="0" step="1" data-metric-max-unique aria-label="去重对象数上限"></span></label>'
            + '<small>邮件按邮件去重（链接点击不按 URL 去重），商品行为按商品去重，订单按订单去重；两个次数范围均可只填写一组。</small>';
        row.appendChild(editor);
        editor.querySelector('[data-metric-from]').value = initial.fromDate || '';
        editor.querySelector('[data-metric-to]').value = initial.toDate || '';
        editor.querySelector('[data-metric-min-total]').value = initial.minTotalCount == null ? '' : initial.minTotalCount;
        editor.querySelector('[data-metric-max-total]').value = initial.maxTotalCount == null ? '' : initial.maxTotalCount;
        editor.querySelector('[data-metric-min-unique]').value = initial.minUniqueCount == null ? '' : initial.minUniqueCount;
        editor.querySelector('[data-metric-max-unique]').value = initial.maxUniqueCount == null ? '' : initial.maxUniqueCount;
        editor.addEventListener('input', function () { serialize(row); });
        editor.addEventListener('change', function () { serialize(row); });
        row.classList.add('behavior-metric-rule-row');
        row.dataset.behaviorMetric = 'true';
        serialize(row);
    }

    function sync(row, field, operator, value) {
        ensureStyle();
        ensureOptions(field);
        var restored = parse(value.value);
        if (!row.dataset.fieldRestored && restored) {
            field.value = activityFields[restored.activity] || field.value;
        }
        row.dataset.fieldRestored = 'true';
        var activity = fieldActivities[field.value];
        if (!activity) {
            var editor = row.querySelector('.behavior-metric-editor');
            if (editor) editor.remove();
            if (row.dataset.behaviorMetric === 'true') value.value = '';
            row.dataset.behaviorMetric = 'false';
            delete row.dataset.behaviorActivity;
            row.classList.remove('behavior-metric-rule-row');
            value.type = 'text';
            return false;
        }
        operator.value = 'EXISTS';
        operator.querySelectorAll('option').forEach(function (option) {
            option.disabled = option.value !== 'EXISTS';
        });
        value.type = 'hidden';
        value.readOnly = false;
        mount(row, value, activity);
        return true;
    }

    global.SegmentBehaviorMetric = {sync: sync};
}(window));
