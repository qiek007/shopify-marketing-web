(function (root, factory) {
    var api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root && root.document) api.init(root.document);
}(typeof window === 'undefined' ? null : window, function () {
    'use strict';
    function filterInfo(activity) {
        var descriptions = {
            VIEWED: ['浏览日期范围', '按客户浏览商品的发生时间筛选'],
            CARTED: ['加入购物车日期范围', '按客户加入购物车的发生时间筛选'],
            ORDERED: ['订单日期范围', '按有效订单的处理时间筛选'],
            EMAIL_DELIVERED: ['送达日期范围', '按邮件送达时间筛选'],
            EMAIL_OPENED: ['打开日期范围', '按邮件打开时间筛选，可能受邮箱隐私代理影响'],
            EMAIL_CLICKED: ['点击日期范围', '按链接点击时间筛选'],
            EMAIL_FAILED: ['失败日期范围', '按发送失败、拒绝或退信时间筛选'],
            EMAIL_DELIVERED_NOT_OPENED: ['送达日期范围', '最近送达邮件仍未打开'],
            EMAIL_OPENED_NOT_CLICKED: ['打开日期范围', '最近打开邮件仍未点击']
        };
        var selected = descriptions[activity] || ['最近活动日期范围', '按最近活动时间筛选，无活动记录时按客户资料更新时间'];
        var countable = ['VIEWED', 'CARTED', 'ORDERED', 'EMAIL_DELIVERED', 'EMAIL_OPENED', 'EMAIL_CLICKED', 'EMAIL_FAILED'].indexOf(activity) !== -1;
        var unique = activity === 'ORDERED' ? '去重订单数' : activity === 'VIEWED' || activity === 'CARTED' ? '去重商品数' : '去重邮件数';
        return {date: selected[0], hint: selected[1], countable: countable, unique: unique};
    }
    function setCountFields(fields, visible) {
        Array.prototype.forEach.call(fields, function (field) {
            field.hidden = !visible;
            field.querySelectorAll('input').forEach(function (input) { input.disabled = !visible; });
        });
    }
    function setTagFields(fields, untagged) {
        Array.prototype.forEach.call(fields, function (field) { field.disabled = untagged; });
    }
    function timelineRangeError(from, to) {
        if (!from || !to) return '请选择开始和结束日期';
        var start = Date.parse(from + 'T00:00:00Z'), end = Date.parse(to + 'T00:00:00Z');
        if (!Number.isFinite(start) || !Number.isFinite(end)) return '日期格式无效';
        if (end < start) return '开始日期不能晚于结束日期';
        if (end - start > 399 * 86400000) return '时间线查询范围不能超过 400 天';
        return '';
    }
    function init(document) {
        var form = document.getElementById('mobile-customer-filter');
        if (form) {
            var select = form.querySelector('[name="activity"]');
            var untagged = form.querySelector('[data-untagged-filter]');
            function update() {
                var info = filterInfo(select.value);
                form.querySelector('[data-date-label]').textContent = info.date;
                form.querySelector('[data-date-hint]').textContent = info.hint;
                form.querySelector('[data-unique-label]').textContent = info.unique;
                setCountFields(form.querySelectorAll('[data-count-filter]'), info.countable);
                setTagFields(form.querySelectorAll('[data-tag-input]'), untagged.checked);
            }
            select.addEventListener('change', update);
            untagged.addEventListener('change', update);
            update();
        }
        var timeline = document.getElementById('mobile-customer-timeline-filter');
        if (timeline) timeline.addEventListener('submit', function (event) {
            var error = timelineRangeError(timeline.elements.timelineFromDate.value, timeline.elements.timelineToDate.value);
            var notice = document.getElementById('mobile-timeline-error');
            notice.textContent = error;
            notice.hidden = !error;
            if (error) event.preventDefault();
        });
    }
    return {filterInfo: filterInfo, setCountFields: setCountFields, setTagFields: setTagFields,
        timelineRangeError: timelineRangeError, init: init};
}));
