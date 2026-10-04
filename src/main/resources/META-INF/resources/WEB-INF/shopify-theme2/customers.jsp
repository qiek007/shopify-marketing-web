<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ page language="java" pageEncoding="UTF-8" contentType="text/html; charset=UTF-8" %>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
    <title>客户管理 - Shopify 邮件营销</title>
    <c:set var="ctx" value="${pageContext.request.contextPath}"/>
    <link rel="stylesheet" href="${ctx}/baseui/static/h-ui/css/H-ui.min.css">
    <link rel="stylesheet" href="${ctx}/baseui/static/h-ui.admin/css/H-ui.admin.css">
    <link rel="stylesheet" href="${ctx}/baseui/lib/font-awesome-4.7.0/css/font-awesome.min.css">
    <link rel="stylesheet" href="${ctx}${uiAssetBase}/css/dashboard.css?v=20260925-p124">
</head>
<body class="shopify-console">
<%@ include file="fragments/header.jspf" %>
<div class="console-layout">
    <%@ include file="fragments/navigation.jspf" %>
    <main class="console-main">
        <section class="page-heading"><div><p class="eyebrow">客户管理</p></div></section>
        <section class="content-section">
            <div class="section-heading"><div><h2>客户列表</h2><p>每页显示 10 位客户，查询结果同步分页</p></div><div class="section-heading-actions"><span id="customer-result-count" class="section-count" data-customer-result-count>正在统计</span><c:if test="${not empty selectedShop and canManageCustomers}"><a class="primary-button compact" href="${ctx}/customers/imports?shop=${selectedShop}"><i class="fa fa-upload"></i>导入客户</a></c:if></div></div>
            <form class="workspace-form" method="get" action="${ctx}/customers/results" data-customer-results-form data-initial-page="${empty param.page ? 1 : param.page}" data-customer-tags-url="${ctx}/customers/tags/options">
                <input type="hidden" name="shop" value="${selectedShop}">
                <div class="form-grid">
                    <label><span>姓名或邮箱</span><input name="q" value="<c:out value='${customerFilter.search}'/>" placeholder="搜索姓名或邮箱"></label>
                    <div class="customer-tag-field"><span>客户标签</span><details class="customer-tag-select"><summary><span data-customer-tag-summary>${empty customerFilter.tags ? '全部标签' : '已选标签'}</span><i class="fa fa-chevron-down"></i></summary><div class="customer-tag-options"><c:set var="untaggedSelected" value="false"/><c:forEach items="${customerFilter.tags}" var="selectedTag"><c:if test="${selectedTag eq '__UNTAGGED__'}"><c:set var="untaggedSelected" value="true"/></c:if></c:forEach><label class="customer-tag-option-special"><input type="checkbox" name="tag" value="__UNTAGGED__" data-untagged="true" data-tag-selected="${untaggedSelected}"${untaggedSelected ? ' checked' : ''}><span>无标签</span></label><c:forEach items="${customerFilter.tags}" var="selectedTag"><c:if test="${selectedTag ne '__UNTAGGED__'}"><label><input type="checkbox" name="tag" value="<c:out value='${selectedTag}'/>" data-tag-selected="true" checked><span><c:out value="${selectedTag}"/></span></label></c:if></c:forEach><span class="muted-text" data-no-customer-tags>正在加载标签…</span></div></details></div>
                    <label><span class="customer-range-heading"><span>行为类型</span><small class="customer-filter-hint">（邮件打开数据可能受邮箱隐私代理影响，仅作为筛选参考）</small></span><select name="activity"><option value="">不限</option><optgroup label="站内行为"><option value="VIEWED"${customerFilter.activity eq 'VIEWED' ? ' selected' : ''}>有浏览记录</option><option value="CARTED"${customerFilter.activity eq 'CARTED' ? ' selected' : ''}>有加入购物车记录</option><option value="ORDERED"${customerFilter.activity eq 'ORDERED' ? ' selected' : ''}>有订单记录</option></optgroup><optgroup label="邮件互动"><option value="EMAIL_DELIVERED"${customerFilter.activity eq 'EMAIL_DELIVERED' ? ' selected' : ''}>已送达邮件</option><option value="EMAIL_OPENED"${customerFilter.activity eq 'EMAIL_OPENED' ? ' selected' : ''}>已打开邮件</option><option value="EMAIL_CLICKED"${customerFilter.activity eq 'EMAIL_CLICKED' ? ' selected' : ''}>已点击链接</option><option value="EMAIL_FAILED"${customerFilter.activity eq 'EMAIL_FAILED' ? ' selected' : ''}>发送失败/退信</option><option value="EMAIL_DELIVERED_NOT_OPENED"${customerFilter.activity eq 'EMAIL_DELIVERED_NOT_OPENED' ? ' selected' : ''}>最近送达未打开</option><option value="EMAIL_OPENED_NOT_CLICKED"${customerFilter.activity eq 'EMAIL_OPENED_NOT_CLICKED' ? ' selected' : ''}>最近打开未点击</option></optgroup></select></label>
                    <label class="customer-range-field"><span class="customer-range-heading"><span data-customer-date-label>最近活动日期范围</span><small class="customer-filter-hint" data-customer-date-hint>（按最近活动时间筛选，无活动记录时按客户资料更新时间）</small></span><span class="customer-range-control"><input aria-label="开始日期" name="fromDate" type="date" value="<c:out value='${customerFilter.fromDate}'/>"><span class="range-separator">至</span><input aria-label="结束日期" name="toDate" type="date" value="<c:out value='${customerFilter.toDate}'/>"></span></label>
                </div>
                <div class="customer-filter-range-grid">
                    <label class="customer-range-field"><span>累计有效订单金额</span><span class="customer-range-control"><input aria-label="累计有效订单金额下限" name="minSpent" type="number" min="0" step="0.01" value="<c:out value='${customerFilter.minSpent}'/>"><span class="range-separator">至</span><input aria-label="累计有效订单金额上限" name="maxSpent" type="number" min="0" step="0.01" value="<c:out value='${customerFilter.maxSpent}'/>"></span><small class="customer-filter-hint">未取消且处于有效财务状态的订单总金额</small></label>
                </div>
                <div class="form-actions filter-actions"><span class="customer-bulk-actions" data-customer-bulk-actions hidden><c:if test="${canManageCustomers}"><button class="secondary-button customer-tag-add-action" type="button" data-customer-tag-add><i class="fa fa-tag"></i><span>添加标签</span></button><button class="secondary-button customer-tag-remove-action" type="button" data-customer-tag-remove><i class="fa fa-tag"></i><span>删除标签</span></button></c:if><c:if test="${canManageCampaigns}"><button class="secondary-button customer-segment-save-action" type="button" data-customer-segment-save><i class="fa fa-users"></i><span>保存为分群</span></button></c:if></span><button class="action-button" type="submit"><i class="fa fa-search"></i><span>查询</span></button><button class="secondary-button" type="button" data-customer-results-reset><i class="fa fa-eraser"></i><span>清空条件</span></button></div>
            </form>
            <div class="customer-tag-feedback" data-customer-tag-feedback aria-live="polite" hidden></div>
            <div id="customer-results" class="async-result-region" aria-live="polite">
                <div class="async-loading customer-results-loading"><i class="fa fa-spinner fa-spin"></i><strong>正在加载客户</strong></div>
            </div>
            <c:if test="${canManageCustomers}"><dialog id="customer-tag-add-dialog" class="campaign-send-dialog customer-tag-dialog" aria-labelledby="customer-tag-add-title"><div class="campaign-send-dialog-icon"><i class="fa fa-tag"></i></div><div><h2 id="customer-tag-add-title">为查询结果添加标签</h2><p>将为当前查询条件匹配的全部客户添加标签，包括未显示在当前页的客户。</p></div><form action="${ctx}/customers/tags/add" method="post" data-customer-tag-add-form><label><span>标签名称</span><input name="targetTag" maxlength="100" required autocomplete="off" placeholder="输入标签名称"></label><div class="campaign-send-dialog-actions"><button class="action-button" type="button" data-customer-tag-dialog-close>取消</button><button class="primary-button" type="submit"><i class="fa fa-check"></i>确认添加</button></div></form></dialog></c:if>
            <c:if test="${canManageCustomers}"><dialog id="customer-tag-remove-dialog" class="campaign-send-dialog customer-tag-dialog" aria-labelledby="customer-tag-remove-title"><div class="campaign-send-dialog-icon danger"><i class="fa fa-tag"></i></div><div><h2 id="customer-tag-remove-title">从查询结果删除标签</h2><p>只会从当前查询条件匹配且带有该标签的客户中移除，范围包括所有结果页。</p></div><form action="${ctx}/customers/tags/remove" method="post" data-customer-tag-remove-form><label><span>选择已有标签</span><select name="targetTag" required data-customer-tag-remove-select><option value="" disabled selected>请选择标签</option><c:forEach items="${customerTags}" var="tagOption"><option value="<c:out value='${tagOption}'/>"><c:out value="${tagOption}"/></option></c:forEach></select></label><div class="campaign-send-dialog-actions"><button class="action-button" type="button" data-customer-tag-dialog-close>取消</button><button class="primary-button danger-button" type="submit"><i class="fa fa-trash-o"></i>确认删除</button></div></form></dialog></c:if>
            <c:if test="${canManageCampaigns}"><dialog id="customer-segment-dialog" class="campaign-send-dialog customer-tag-dialog" aria-labelledby="customer-segment-title"><div class="campaign-send-dialog-icon segment"><i class="fa fa-users"></i></div><div><h2 id="customer-segment-title">保存查询条件为分群</h2><p>将保存最后一次成功查询的全部条件，不受当前页显示数量影响。</p></div><form action="${ctx}/segments/from-customer-filter" method="post" data-customer-segment-form><label><span>分群名称</span><input name="segmentName" maxlength="255" required autocomplete="off" placeholder="例如：近30天点击客户"></label><div class="customer-segment-summary"><strong>条件摘要</strong><span data-customer-segment-summary>全部客户</span></div><div class="campaign-send-dialog-actions"><button class="action-button" type="button" data-customer-segment-dialog-close>取消</button><button class="primary-button" type="submit"><i class="fa fa-save"></i>创建分群</button></div></form></dialog></c:if>
            <dialog id="customer-list-dialog" class="campaign-customer-dialog" aria-label="客户详情">
                <header class="campaign-customer-dialog-heading">
                    <div><p class="eyebrow">客户列表</p></div>
                    <button class="icon-button dialog-close-button" type="button" data-customer-list-dialog-close title="关闭客户详情" aria-label="关闭客户详情"><i class="fa fa-times" aria-hidden="true"></i></button>
                </header>
                <div id="customer-list-dialog-body" class="campaign-customer-dialog-body"></div>
            </dialog>
            <dialog id="customer-list-email-preview-dialog" class="template-preview-dialog customer-email-preview-dialog" aria-labelledby="customer-list-email-preview-title">
                <div class="template-preview-heading">
                    <div><p class="eyebrow">客户实际内容</p><h2 id="customer-list-email-preview-title">营销邮件预览</h2></div>
                    <button class="icon-button dialog-close-button" type="button" data-customer-list-preview-close title="关闭预览" aria-label="关闭预览"><i class="fa fa-times" aria-hidden="true"></i></button>
                </div>
                <div class="template-preview-body"><iframe id="customer-email-preview-frame" title="该客户收到的营销邮件" sandbox src="about:blank"></iframe></div>
            </dialog>
        </section>
        <script src="${ctx}/shopify/js/customer-timeline.js?v=20260925-p130"></script>
        <script>
            (function () {
                var form = document.querySelector('[data-customer-results-form]');
                var host = document.getElementById('customer-results');
                var reset = document.querySelector('[data-customer-results-reset]');
                var resultCount = document.querySelector('[data-customer-result-count]');
                var bulkActions = document.querySelector('[data-customer-bulk-actions]');
                var feedback = document.querySelector('[data-customer-tag-feedback]');
                var addDialog = document.getElementById('customer-tag-add-dialog');
                var removeDialog = document.getElementById('customer-tag-remove-dialog');
                var addForm = document.querySelector('[data-customer-tag-add-form]');
                var removeForm = document.querySelector('[data-customer-tag-remove-form]');
                var segmentButton = document.querySelector('[data-customer-segment-save]');
                var segmentDialog = document.getElementById('customer-segment-dialog');
                var segmentForm = document.querySelector('[data-customer-segment-form]');
                var segmentSummary = document.querySelector('[data-customer-segment-summary]');
                var activitySelect = form ? form.querySelector('select[name="activity"]') : null;
                var dateLabel = form ? form.querySelector('[data-customer-date-label]') : null;
                var dateHint = form ? form.querySelector('[data-customer-date-hint]') : null;
                var tagSummary = form ? form.querySelector('[data-customer-tag-summary]') : null;
                var customerListDialog = document.getElementById('customer-list-dialog');
                var customerListDialogBody = document.getElementById('customer-list-dialog-body');
                var customerListPreviewDialog = document.getElementById('customer-list-email-preview-dialog');
                var customerListPreviewFrame = document.getElementById('customer-email-preview-frame');
                var customerListRequest;
                var customerListDialogScrollY = 0;
                var customerListDialogScrollX = 0;
                var customerListDialogTrigger = null;
                if (document.documentElement.dataset.customerTagDismissBound !== 'true') {
                    document.documentElement.dataset.customerTagDismissBound = 'true';
                    document.addEventListener('click', function (event) {
                        if (event.target.closest('.customer-tag-select')) return;
                        document.querySelectorAll('.customer-tag-select[open]').forEach(function (details) {
                            details.open = false;
                        });
                    });
                    document.addEventListener('keydown', function (event) {
                        if (event.key !== 'Escape') return;
                        document.querySelectorAll('.customer-tag-select[open]').forEach(function (details) {
                            details.open = false;
                        });
                    });
                }
                if (!form || !host || form.dataset.resultsBound === 'true') return;
                form.dataset.resultsBound = 'true';
                var activeRequest;
                var lastSuccessfulQuery;
                form.querySelectorAll('input[name="tag"]').forEach(function (input) {
                    input.checked = input.dataset.tagSelected === 'true';
                });

                function updateTagSummary() {
                    if (!tagSummary) return;
                    var count = form.querySelectorAll('input[name="tag"]:checked').length;
                    tagSummary.textContent = count ? '已选 ' + count + ' 个' : '全部标签';
                }

                function updateDateDescription() {
                    if (!activitySelect || !dateLabel || !dateHint) return;
                    var descriptions = {
                        VIEWED: ['浏览日期范围', '（按客户浏览商品的发生时间筛选）'],
                        CARTED: ['加入购物车日期范围', '（按客户加入购物车的发生时间筛选）'],
                        ORDERED: ['订单日期范围', '（按有效订单的处理时间筛选）'],
                        EMAIL_DELIVERED: ['送达日期范围', '（按邮件送达时间筛选）'],
                        EMAIL_OPENED: ['打开日期范围', '（按邮件打开时间筛选，可能受邮件隐私代理影响）'],
                        EMAIL_CLICKED: ['点击日期范围', '（按链接点击时间筛选）'],
                        EMAIL_FAILED: ['失败日期范围', '（按发送失败、拒绝或退信时间筛选）'],
                        EMAIL_DELIVERED_NOT_OPENED: ['送达日期范围', '（最近送达邮件仍未打开）'],
                        EMAIL_OPENED_NOT_CLICKED: ['打开日期范围', '（最近打开邮件仍未点击）']
                    };
                    var selected = descriptions[activitySelect.value]
                        || ['最近活动日期范围', '（按最近活动时间筛选，无活动记录时按客户资料更新时间）'];
                    dateLabel.textContent = selected[0];
                    dateHint.textContent = selected[1];
                }

                function loading() {
                    if (bulkActions) bulkActions.hidden = true;
                    host.innerHTML = '<div class="async-loading customer-results-loading"><i class="fa fa-spinner fa-spin"></i><strong>正在加载客户</strong></div>';
                    host.setAttribute('aria-busy', 'true');
                }

                function showFeedback(message, failed) {
                    if (!feedback) return;
                    feedback.hidden = false;
                    feedback.className = 'customer-tag-feedback ' + (failed ? 'error' : 'success');
                    feedback.textContent = message;
                }

                function ensureTagChoice(tag) {
                    var options = form.querySelector('.customer-tag-options');
                    var existing = Array.from(options.querySelectorAll('input[name="tag"]'))
                        .some(function (input) { return input.value === tag; });
                    if (!existing) {
                        var label = document.createElement('label');
                        var input = document.createElement('input');
                        var text = document.createElement('span');
                        input.type = 'checkbox';
                        input.name = 'tag';
                        input.value = tag;
                        input.dataset.tagSelected = 'false';
                        text.textContent = tag;
                        label.appendChild(input);
                        label.appendChild(text);
                        options.appendChild(label);
                        var empty = options.querySelector('[data-no-customer-tags]');
                        if (empty) empty.remove();
                    }
                    var select = removeForm && removeForm.querySelector('[data-customer-tag-remove-select]');
                    if (select && !Array.from(select.options).some(function (option) { return option.value === tag; })) {
                        var option = document.createElement('option');
                        option.value = tag;
                        option.textContent = tag;
                        select.appendChild(option);
                    }
                }

                function loadCustomerTags() {
                    var shop = String(new FormData(form).get('shop') || '').trim();
                    var placeholder = form.querySelector('[data-no-customer-tags]');
                    if (!shop || !form.dataset.customerTagsUrl) {
                        if (placeholder) placeholder.textContent = '暂无其他标签';
                        return;
                    }
                    var params = new URLSearchParams();
                    params.set('shop', shop);
                    fetch(form.dataset.customerTagsUrl + '?' + params.toString(), {
                        credentials: 'same-origin', headers: { Accept: 'application/json' }
                    }).then(function (response) {
                        if (!response.ok) throw new Error('HTTP ' + response.status);
                        return response.json();
                    }).then(function (tags) {
                        tags.forEach(ensureTagChoice);
                        placeholder = form.querySelector('[data-no-customer-tags]');
                        if (placeholder) {
                            if (tags.length) placeholder.remove();
                            else placeholder.textContent = '暂无其他标签';
                        }
                    }).catch(function () {
                        if (placeholder) placeholder.textContent = '标签加载失败，可刷新重试';
                    });
                }

                function runTagMutation(commandForm, dialog, successVerb) {
                    var submit = commandForm.querySelector('button[type="submit"]');
                    var targetTag = String(new FormData(commandForm).get('targetTag') || '').trim();
                    if (!targetTag) return;
                    if (!lastSuccessfulQuery) return;
                    var payload = new URLSearchParams(lastSuccessfulQuery);
                    payload.set('targetTag', targetTag);
                    submit.disabled = true;
                    fetch(commandForm.action, {
                        method: 'POST', credentials: 'same-origin',
                        headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                        body: payload.toString()
                    }).then(function (response) {
                        if (!response.ok) throw new Error('HTTP ' + response.status);
                        return response.json();
                    }).then(function (result) {
                        if (successVerb === '添加') ensureTagChoice(targetTag);
                        dialog.close();
                        commandForm.reset();
                        showFeedback(result.message || ('标签' + successVerb + '完成'), false);
                        load(1);
                    }).catch(function () {
                        showFeedback('标签操作失败，请稍后重试', true);
                    }).finally(function () {
                        submit.disabled = false;
                    });
                }

                function describeSuccessfulQuery() {
                    if (!lastSuccessfulQuery) return '全部客户';
                    var parts = [];
                    var q = lastSuccessfulQuery.get('q');
                    if (q) parts.push('姓名或邮箱包含“' + q + '”');
                    var tags = lastSuccessfulQuery.getAll('tag');
                    if (tags.length) parts.push(tags[0] === '__UNTAGGED__'
                        ? '无标签' : '标签为 ' + tags.join('、'));
                    var activity = lastSuccessfulQuery.get('activity');
                    if (activity && activitySelect) {
                        var option = activitySelect.querySelector('option[value="' + activity + '"]');
                        if (option) parts.push(option.textContent.trim());
                    }
                    var min = lastSuccessfulQuery.get('minSpent');
                    var max = lastSuccessfulQuery.get('maxSpent');
                    if (min || max) parts.push('累计有效订单金额 ' + (min || '不限') + ' 至 ' + (max || '不限'));
                    var from = lastSuccessfulQuery.get('fromDate');
                    var to = lastSuccessfulQuery.get('toDate');
                    if (from || to) parts.push('日期 ' + (from || '不限') + ' 至 ' + (to || '不限'));
                    return parts.length ? parts.join('；') : '全部客户';
                }

                function runSegmentSave() {
                    if (!segmentForm || !segmentDialog || !lastSuccessfulQuery) return;
                    var submit = segmentForm.querySelector('button[type="submit"]');
                    var name = String(new FormData(segmentForm).get('segmentName') || '').trim();
                    if (!name) return;
                    var payload = new URLSearchParams(lastSuccessfulQuery);
                    payload.set('segmentName', name);
                    submit.disabled = true;
                    fetch(segmentForm.action, {
                        method: 'POST', credentials: 'same-origin',
                        headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                        body: payload.toString()
                    }).then(function (response) {
                        if (!response.ok) throw new Error('HTTP ' + response.status);
                        return response.json();
                    }).then(function (result) {
                        segmentDialog.close();
                        segmentForm.reset();
                        showFeedback(result.message || '客户分群已创建', false);
                        var link = document.createElement('a');
                        link.className = 'customer-segment-result-link';
                        link.href = '${ctx}' + result.editorUrl;
                        link.textContent = '查看并编辑分群';
                        feedback.appendChild(link);
                    }).catch(function () {
                        showFeedback('客户分群创建失败，请稍后重试', true);
                    }).finally(function () { submit.disabled = false; });
                }

                function initializeCustomerListTimeline() {
                    var timelineRoot = customerListDialogBody.querySelector('[data-customer-timeline]');
                    if (timelineRoot && window.ShopifyCustomerTimeline) {
                        window.ShopifyCustomerTimeline.init(timelineRoot);
                    }
                }

                function openCustomerListDetail(link) {
                    if (!customerListDialog || !customerListDialogBody) return;
                    if (customerListRequest) customerListRequest.abort();
                    customerListRequest = new AbortController();
                    customerListDialogScrollY = window.scrollY;
                    customerListDialogScrollX = window.scrollX;
                    customerListDialogTrigger = link;
                    customerListDialogBody.setAttribute('aria-busy', 'true');
                    customerListDialogBody.innerHTML = '<div class="async-loading campaign-customer-loading"><i class="fa fa-spinner fa-spin"></i><strong>正在加载客户详情</strong></div>';
                    if (!customerListDialog.open) {
                        customerListDialog.showModal();
                        window.scrollTo(customerListDialogScrollX, customerListDialogScrollY);
                    }
                    fetch(link.dataset.summaryUrl, {
                        credentials: 'same-origin', signal: customerListRequest.signal,
                        headers: { Accept: 'text/html' }
                    }).then(function (response) {
                        if (!response.ok) throw new Error('HTTP ' + response.status);
                        return response.text();
                    }).then(function (html) {
                        customerListDialogBody.innerHTML = html;
                        initializeCustomerListTimeline();
                    }).catch(function (error) {
                        if (error.name === 'AbortError') return;
                        customerListDialogBody.innerHTML = '<div class="empty-state"><i class="fa fa-exclamation-circle"></i><strong>客户详情加载失败</strong><span>请关闭后重新打开</span></div>';
                    }).finally(function () {
                        customerListDialogBody.removeAttribute('aria-busy');
                    });
                }

                function load(page) {
                    if (activeRequest) activeRequest.abort();
                    activeRequest = new AbortController();
                    var params = new URLSearchParams(new FormData(form));
                    params.set('page', page || '1');
                    loading();
                    fetch(form.action + '?' + params.toString(), {
                        credentials: 'same-origin', signal: activeRequest.signal,
                        headers: { Accept: 'text/html' }
                    }).then(function (response) {
                        if (!response.ok) throw new Error('HTTP ' + response.status);
                        return response.text();
                    }).then(function (html) {
                        host.innerHTML = html;
                        var total = host.querySelector('[data-customer-total]');
                        if (resultCount && total) {
                            resultCount.textContent = total.dataset.customerTotalExact === 'true'
                                ? '共 ' + total.dataset.customerTotal + ' 位' : '匹配结果';
                        }
                        lastSuccessfulQuery = new URLSearchParams(params);
                        lastSuccessfulQuery.delete('page');
                        if (bulkActions) bulkActions.hidden = false;
                    }).catch(function (error) {
                        if (error.name === 'AbortError') return;
                        host.innerHTML = '<div class="empty-state compact"><i class="fa fa-exclamation-circle"></i><strong>客户数据加载失败</strong><span>请稍后重新查询</span></div>';
                    }).finally(function () {
                        host.removeAttribute('aria-busy');
                    });
                }

                form.addEventListener('submit', function (event) {
                    event.preventDefault();
                    load(1);
                });
                form.addEventListener('input', function () {
                    lastSuccessfulQuery = null;
                    if (bulkActions) bulkActions.hidden = true;
                });
                form.addEventListener('change', function (event) {
                    lastSuccessfulQuery = null;
                    if (bulkActions) bulkActions.hidden = true;
                    if (event.target.name === 'activity') updateDateDescription();
                    if (event.target.name !== 'tag') return;
                    if (event.target.checked && event.target.dataset.untagged === 'true') {
                        form.querySelectorAll('input[name="tag"]:not([data-untagged])').forEach(function (input) { input.checked = false; });
                    } else if (event.target.checked) {
                        var untagged = form.querySelector('input[name="tag"][data-untagged]');
                        if (untagged) untagged.checked = false;
                    }
                    updateTagSummary();
                });
                host.addEventListener('click', function (event) {
                    var customerLink = event.target.closest('[data-customer-summary]');
                    if (customerLink) {
                        if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
                        event.preventDefault();
                        openCustomerListDetail(customerLink);
                        return;
                    }
                    var link = event.target.closest('[data-customer-results-page]');
                    if (!link) return;
                    event.preventDefault();
                    load(link.dataset.customerResultsPage);
                });
                if (customerListDialog) {
                    customerListDialogBody.addEventListener('click', function (event) {
                        var previewLink = event.target.closest('[data-customer-email-preview]');
                        if (!previewLink || !customerListPreviewDialog || !customerListPreviewFrame) return;
                        event.preventDefault();
                        customerListPreviewFrame.src = previewLink.href;
                        if (!customerListPreviewDialog.open) customerListPreviewDialog.showModal();
                    });
                    customerListDialog.querySelector('[data-customer-list-dialog-close]').addEventListener('click', function () {
                        customerListDialog.close();
                    });
                    customerListDialog.addEventListener('click', function (event) {
                        if (event.target === customerListDialog) customerListDialog.close();
                    });
                    customerListDialog.addEventListener('close', function () {
                        var returnFocus = customerListDialogTrigger;
                        var scrollX = customerListDialogScrollX;
                        var scrollY = customerListDialogScrollY;
                        if (customerListRequest) customerListRequest.abort();
                        if (customerListPreviewDialog && customerListPreviewDialog.open) customerListPreviewDialog.close();
                        customerListDialogBody.replaceChildren();
                        customerListDialogTrigger = null;
                        if (returnFocus && document.contains(returnFocus)) returnFocus.focus({ preventScroll: true });
                        window.scrollTo(scrollX, scrollY);
                    });
                }
                if (customerListPreviewDialog && customerListPreviewFrame) {
                    customerListPreviewDialog.querySelector('[data-customer-list-preview-close]').addEventListener('click', function () {
                        customerListPreviewDialog.close();
                    });
                    customerListPreviewDialog.addEventListener('click', function (event) {
                        if (event.target === customerListPreviewDialog) customerListPreviewDialog.close();
                    });
                    customerListPreviewDialog.addEventListener('close', function () {
                        customerListPreviewFrame.src = 'about:blank';
                    });
                }
                if (reset) reset.addEventListener('click', function () {
                    form.reset();
                    updateTagSummary();
                    if (activeRequest) activeRequest.abort();
                    host.innerHTML = '<div class="empty-state compact"><i class="fa fa-search"></i><strong>等待查询</strong><span>未加载客户数据</span></div>';
                    if (bulkActions) bulkActions.hidden = true;
                    lastSuccessfulQuery = null;
                    if (feedback) feedback.hidden = true;
                });
                document.querySelector('[data-customer-tag-add]').addEventListener('click', function () {
                    addDialog.showModal();
                    addForm.querySelector('input[name="targetTag"]').focus();
                });
                document.querySelector('[data-customer-tag-remove]').addEventListener('click', function () {
                    removeDialog.showModal();
                });
                document.querySelectorAll('[data-customer-tag-dialog-close]').forEach(function (button) {
                    button.addEventListener('click', function () { button.closest('dialog').close(); });
                });
                addForm.addEventListener('submit', function (event) {
                    event.preventDefault();
                    runTagMutation(addForm, addDialog, '添加');
                });
                removeForm.addEventListener('submit', function (event) {
                    event.preventDefault();
                    runTagMutation(removeForm, removeDialog, '删除');
                });
                if (segmentButton && segmentDialog && segmentForm) {
                    segmentButton.addEventListener('click', function () {
                        if (!lastSuccessfulQuery) return;
                        segmentSummary.textContent = describeSuccessfulQuery();
                        segmentDialog.showModal();
                        segmentForm.querySelector('input[name="segmentName"]').focus();
                    });
                    segmentForm.addEventListener('submit', function (event) {
                        event.preventDefault(); runSegmentSave();
                    });
                    document.querySelectorAll('[data-customer-segment-dialog-close]').forEach(function (button) {
                        button.addEventListener('click', function () { segmentDialog.close(); });
                    });
                }
                updateTagSummary();
                updateDateDescription();
                form.querySelectorAll('input[name="tag"]:not([data-untagged])').forEach(function (input) {
                    ensureTagChoice(input.value);
                });
                loadCustomerTags();
                load(form.dataset.initialPage || '1');
            }());
        </script>
    </main>
</div>
</body></html>
