<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ page language="java" pageEncoding="UTF-8" contentType="text/html; charset=UTF-8" %>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>客户分组编辑 - Shopify 邮件营销</title>
    <c:set var="ctx" value="${pageContext.request.contextPath}"/>
    <link rel="stylesheet" href="${ctx}/baseui/static/h-ui/css/H-ui.min.css">
    <link rel="stylesheet" href="${ctx}/baseui/static/h-ui.admin/css/H-ui.admin.css">
    <link rel="stylesheet" href="${ctx}/baseui/lib/font-awesome-4.7.0/css/font-awesome.min.css">
    <link rel="stylesheet" href="${ctx}${uiAssetBase}/css/dashboard.css?v=20260924-segment-action-style">
</head>
<body class="shopify-console">
<%@ include file="fragments/header.jspf" %>
<div class="console-layout">
    <%@ include file="fragments/navigation.jspf" %>
    <main class="console-main">
        <a class="back-link" href="${ctx}/segments?shop=${selectedShop}"><i class="fa fa-arrow-left"></i> 返回分组列表</a>
        <section class="page-heading"><div><p class="eyebrow">客户分组</p><h1>${editorSegment.existing ? '编辑客户分组' : '新建客户分组'}</h1><p>组合客户画像规则，预览规则命中、可发送客户和资格排除原因</p></div></section>
        <c:if test="${not empty errorMessage}"><div class="flash-message danger"><i class="fa fa-exclamation-circle"></i><c:out value="${errorMessage}"/></div></c:if>

        <section class="content-section segment-builder-section">
            <form id="segment-form" class="workspace-form" method="post">
                <input type="hidden" name="shop" value="${selectedShop}">
                <input type="hidden" name="segmentId" value="${editorSegment.segmentId}">
                <div class="segment-meta-grid">
                    <label><span>分组名称</span><input name="name" value="${editorSegment.name}" required maxlength="255" placeholder="例如：近 30 天复购客户"></label>
                    <label><span>规则关系</span><select name="matchMode"><option value="ALL" ${editorSegment.matchMode eq 'ALL' ? 'selected' : ''}>满足全部规则（且）</option><option value="ANY" ${editorSegment.matchMode eq 'ANY' ? 'selected' : ''}>满足任一规则（或）</option></select></label>
                </div>
                <div class="segment-rule-heading"><div><strong>筛选条件组</strong><span>组内和组间均可选择“且/或”，最多 20 条条件</span></div><button class="primary-button compact" type="button" id="add-rule" <c:if test="${not canManageCampaigns}">disabled hidden</c:if>><i class="fa fa-plus"></i>添加条件组</button></div>
                <div id="segment-groups" class="segment-groups">
                    <c:choose><c:when test="${empty editorSegment.groups}"><section class="segment-rule-group" data-group-id="group-1"><header><div><strong>条件组 1</strong><span>组内关系</span></div><input type="hidden" name="groupIds" value="group-1"><button class="secondary-button add-group-rule" type="button" <c:if test="${not canManageCampaigns}">disabled hidden</c:if>><i class="fa fa-plus"></i>组内添加条件</button><select name="groupMatchModes" aria-label="组内关系"><option value="ALL" selected>全部满足（且）</option><option value="ANY">任一满足（或）</option></select><button class="icon-button remove-group" type="button" <c:if test="${not canManageCampaigns}">disabled hidden</c:if> title="删除条件组"><i class="fa fa-times"></i></button></header><div class="segment-group-rules"><div class="segment-rule-row"><input type="hidden" name="ruleGroupIds" value="group-1"><select name="fields" aria-label="筛选字段"><%@ include file="fragments/segment-field-options.jspf" %></select><select name="operators" aria-label="比较条件"><%@ include file="fragments/segment-operator-options.jspf" %></select><input name="values" required aria-label="筛选值" placeholder="输入条件值"><button class="icon-button remove-rule" type="button" <c:if test="${not canManageCampaigns}">disabled hidden</c:if> title="删除条件"><i class="fa fa-trash"></i></button></div></div></section></c:when><c:otherwise><c:forEach items="${editorSegment.groups}" var="group" varStatus="groupStatus"><section class="segment-rule-group" data-group-id="${group.groupId}"><header><div><strong>条件组 <c:out value="${groupStatus.index + 1}"/></strong><span>组内关系</span></div><input type="hidden" name="groupIds" value="${group.groupId}"><button class="secondary-button add-group-rule" type="button" <c:if test="${not canManageCampaigns}">disabled hidden</c:if>><i class="fa fa-plus"></i>组内添加条件</button><select name="groupMatchModes" aria-label="组内关系"><option value="ALL" ${group.matchMode eq 'ALL' ? 'selected' : ''}>全部满足（且）</option><option value="ANY" ${group.matchMode eq 'ANY' ? 'selected' : ''}>任一满足（或）</option></select><button class="icon-button remove-group" type="button" <c:if test="${not canManageCampaigns}">disabled hidden</c:if> title="删除条件组"><i class="fa fa-times"></i></button></header><div class="segment-group-rules"><c:forEach items="${group.rules}" var="rule"><div class="segment-rule-row"><input type="hidden" name="ruleGroupIds" value="${group.groupId}"><select name="fields" aria-label="筛选字段"><%@ include file="fragments/segment-field-options.jspf" %></select><select name="operators" aria-label="比较条件"><%@ include file="fragments/segment-operator-options.jspf" %></select><input name="values" value="<c:out value='${rule.value}'/>" required aria-label="筛选值"><button class="icon-button remove-rule" type="button" <c:if test="${not canManageCampaigns}">disabled hidden</c:if> title="删除条件"><i class="fa fa-trash"></i></button></div></c:forEach></div></section></c:forEach></c:otherwise></c:choose>
                </div>
                <p class="field-note">日期填写 YYYY-MM-DD；“存在”适用于全部客户、无标签及行为条件；邮件打开数据可能受邮箱隐私代理影响。</p>
                <div class="form-actions segment-actions"><button class="action-button" type="button" data-segment-preview><i class="fa fa-eye"></i>预览客户</button><button class="primary-button" type="submit" formaction="${ctx}/segments" <c:if test="${not canManageCampaigns}">disabled hidden</c:if>><i class="fa fa-save"></i>${editorSegment.existing ? '保存修改' : '创建分组'}</button></div>
            </form>
        </section>

        <section id="segment-preview-panel" class="content-section spaced-section" <c:if test="${empty segmentPreview}">hidden</c:if>>
            <div class="section-heading"><div><h2 class="segment-preview-title">分组预览 <button class="segment-policy-toggle" type="button" data-segment-policy-toggle aria-controls="segment-policy-notice" aria-expanded="false" title="显示发送资格说明" aria-label="显示发送资格说明"><i class="fa fa-info-circle"></i></button></h2><p>实际创建活动时还会重新计算并冻结受众</p></div></div>
            <div id="segment-policy-notice" class="system-notice" hidden><i class="fa fa-info-circle"></i><div><strong>Shopify 营销订阅与客户账号状态相互独立</strong><span>SUBSCRIBED 客户可直接发送；NOT_SUBSCRIBED 客户未明确订阅或退订，未进入抑制名单时可纳入受众，但活动发送前必须再次确认。UNSUBSCRIBED 与抑制名单客户仍不可发送。</span></div></div>
            <div id="segment-preview-loading" class="async-loading" hidden><i class="fa fa-spinner fa-spin"></i><strong>正在加载分组客户</strong></div>
            <div id="segment-preview-results" class="async-result-region" aria-live="polite"><c:if test="${not empty segmentPreview}"><%@ include file="fragments/segment-preview-results.jsp" %></c:if></div>
        </section>

        <dialog id="campaign-customer-dialog" class="campaign-customer-dialog" aria-labelledby="campaign-customer-dialog-title">
            <header class="campaign-customer-dialog-heading"><div><p class="eyebrow">分组客户明细</p><h2 id="campaign-customer-dialog-title">客户详情</h2></div><button class="icon-button dialog-close-button" type="button" data-campaign-customer-close title="关闭客户详情" aria-label="关闭客户详情"><i class="fa fa-times"></i></button></header>
            <div id="campaign-customer-dialog-body" class="campaign-customer-dialog-body"></div>
        </dialog>
        <dialog id="campaign-customer-email-preview-dialog" class="template-preview-dialog customer-email-preview-dialog" aria-labelledby="campaign-customer-email-preview-title">
            <div class="template-preview-heading"><div><p class="eyebrow">客户实际内容</p><h2 id="campaign-customer-email-preview-title">营销邮件预览</h2></div><button class="icon-button dialog-close-button" type="button" data-campaign-customer-preview-close title="关闭预览" aria-label="关闭预览"><i class="fa fa-times"></i></button></div>
            <div class="template-preview-body"><iframe id="campaign-customer-email-preview-frame" title="该客户收到的营销邮件" sandbox src="about:blank"></iframe></div>
        </dialog>
        <c:remove var="rule"/><template id="segment-rule-template"><div class="segment-rule-row"><input type="hidden" name="ruleGroupIds" value="__GROUP_ID__"><select name="fields" aria-label="筛选字段"><%@ include file="fragments/segment-field-options.jspf" %></select><select name="operators" aria-label="比较条件"><%@ include file="fragments/segment-operator-options.jspf" %></select><input name="values" required aria-label="筛选值" placeholder="输入条件值"><button class="icon-button remove-rule" type="button" <c:if test="${not canManageCampaigns}">disabled hidden</c:if> title="删除条件"><i class="fa fa-trash"></i></button></div></template>
        <template id="segment-group-template"><section class="segment-rule-group" data-group-id="__GROUP_ID__"><header><div><strong>条件组</strong><span>组内关系</span></div><input type="hidden" name="groupIds" value="__GROUP_ID__"><button class="secondary-button add-group-rule" type="button" <c:if test="${not canManageCampaigns}">disabled hidden</c:if>><i class="fa fa-plus"></i>组内添加条件</button><select name="groupMatchModes" aria-label="组内关系"><option value="ALL" selected>全部满足（且）</option><option value="ANY">任一满足（或）</option></select><button class="icon-button remove-group" type="button" <c:if test="${not canManageCampaigns}">disabled hidden</c:if> title="删除条件组"><i class="fa fa-times"></i></button></header><div class="segment-group-rules"></div></section></template>
<script src="${ctx}/shopify/js/customer-timeline.js?v=20260925-p130"></script>
<script>
(function () {
    var groups = document.getElementById('segment-groups');
    var ruleTemplate = document.getElementById('segment-rule-template');
    var groupTemplate = document.getElementById('segment-group-template');
    var nextGroup = Date.now();
    function ruleCount() { return groups.querySelectorAll('.segment-rule-row').length; }
    function refreshGroupTitles() {
        groups.querySelectorAll('.segment-rule-group').forEach(function (group, index) {
            group.querySelector('header strong').textContent = '条件组 ' + (index + 1);
        });
    }
    function addRule(group) {
        if (ruleCount() >= 20) return;
        var id = group.dataset.groupId;
        var holder = document.createElement('template');
        holder.innerHTML = ruleTemplate.innerHTML.replaceAll('__GROUP_ID__', id);
        var row = holder.content.firstElementChild;
        group.querySelector('.segment-group-rules').appendChild(row);
        syncExistsValue(row);
    }
    function syncExistsValue(row) {
        var field = row.querySelector('select[name="fields"]');
        var operator = row.querySelector('select[name="operators"]');
        var value = row.querySelector('input[name="values"]');
        var timeOperators = ['EXISTS','BEFORE','AFTER','ON_OR_AFTER'];
        var allowed = {
            ALL_CUSTOMERS:['EXISTS'], SEARCH_TEXT:['CONTAINS'],
            CONSENT_STATE:['EQ','NE'], ORDER_COUNT:['EQ','GTE','LTE'],
            TOTAL_SPENT:['EQ','GTE','LTE'], TAG:['EQ','CONTAINS'], NO_TAG:['EXISTS'],
            LAST_ORDER_AT:timeOperators, RECENCY_DAYS:['EQ','GTE','LTE'],
            LAST_ACTIVITY_AT:timeOperators, CUSTOMER_CREATED_AT:['BEFORE','AFTER','ON_OR_AFTER'],
            EMAIL:['EQ','NE','CONTAINS'], CUSTOMER_NAME:['CONTAINS'],
            LOCALE:['EQ','NE'], ACCOUNT_STATE:['EQ','NE'],
            WEB_VIEWED_AT:timeOperators, WEB_CARTED_AT:timeOperators,
            EMAIL_DELIVERED_AT:timeOperators, EMAIL_OPENED_AT:timeOperators,
            EMAIL_CLICKED_AT:timeOperators, EMAIL_FAILED_AT:timeOperators,
            EMAIL_DELIVERED_NOT_OPENED_AT:timeOperators,
            EMAIL_OPENED_NOT_CLICKED_AT:timeOperators
        }[field.value] || ['EQ'];
        operator.querySelectorAll('option').forEach(function (option) {
            option.disabled = allowed.indexOf(option.value) < 0;
        });
        if (allowed.indexOf(operator.value) < 0) operator.value = allowed[0];
        var numeric = ['ORDER_COUNT','TOTAL_SPENT','RECENCY_DAYS'].indexOf(field.value) >= 0;
        var dated = field.value.endsWith('_AT') || field.value === 'CUSTOMER_CREATED_AT';
        var behaviorDate = field.value.indexOf('WEB_') === 0 || field.value.indexOf('EMAIL_') === 0;
        if (dated && timeOperators.indexOf(operator.value) < 0) {
            operator.value = behaviorDate ? 'EXISTS' : 'ON_OR_AFTER';
        }
        var fixed = operator.value === 'EXISTS';
        value.type = fixed ? 'text' : numeric ? 'number' : dated ? 'date' : 'text';
        if (numeric) { value.min = '0'; value.step = field.value === 'TOTAL_SPENT' ? '0.01' : '1'; }
        else { value.removeAttribute('min'); value.removeAttribute('step'); }
        if (fixed) value.value = 'true';
        value.readOnly = fixed;
        value.classList.toggle('fixed-rule-value', fixed);
    }
    document.getElementById('add-rule').addEventListener('click', function () {
        if (ruleCount() >= 20) return;
        var id = 'group-' + (++nextGroup);
        var holder = document.createElement('template');
        holder.innerHTML = groupTemplate.innerHTML.replaceAll('__GROUP_ID__', id);
        var group = holder.content.firstElementChild;
        groups.appendChild(group);
        addRule(group);
        refreshGroupTitles();
    });
    groups.addEventListener('click', function (event) {
        var add = event.target.closest('.add-group-rule');
        if (add) { addRule(add.closest('.segment-rule-group')); return; }
        var removeRule = event.target.closest('.remove-rule');
        if (removeRule) {
            var groupRules = removeRule.closest('.segment-group-rules');
            if (groupRules.children.length > 1) removeRule.closest('.segment-rule-row').remove();
            return;
        }
        var removeGroup = event.target.closest('.remove-group');
        if (removeGroup && groups.children.length > 1) {
            removeGroup.closest('.segment-rule-group').remove(); refreshGroupTitles();
        }
    });
    groups.addEventListener('change', function (event) {
        if (event.target.name === 'operators' || event.target.name === 'fields') {
            syncExistsValue(event.target.closest('.segment-rule-row'));
        }
    });
    groups.querySelectorAll('.segment-rule-row').forEach(syncExistsValue);
    refreshGroupTitles();

    var form = document.getElementById('segment-form');
    var previewButton = document.querySelector('[data-segment-preview]');
    var previewPanel = document.getElementById('segment-preview-panel');
    var previewLoading = document.getElementById('segment-preview-loading');
    var previewResults = document.getElementById('segment-preview-results');
    var policyToggle = document.querySelector('[data-segment-policy-toggle]');
    var policyNotice = document.getElementById('segment-policy-notice');
    policyToggle.addEventListener('click', function () {
        policyNotice.hidden = !policyNotice.hidden;
        policyToggle.setAttribute('aria-expanded', String(!policyNotice.hidden));
        policyToggle.setAttribute('aria-label', policyNotice.hidden ? '显示发送资格说明' : '隐藏发送资格说明');
        policyToggle.title = policyToggle.getAttribute('aria-label');
    });
    var previewRequest;
    function loadPreview(page) {
        if (!form.reportValidity()) return;
        if (previewRequest) previewRequest.abort();
        previewRequest = new AbortController();
        var data = new FormData(form);
        data.set('previewPage', page || '1');
        previewPanel.hidden = false;
        previewLoading.hidden = false;
        previewResults.setAttribute('aria-busy', 'true');
        fetch('${ctx}/segments/preview/results', {
            method: 'POST', body: data, credentials: 'same-origin', signal: previewRequest.signal,
            headers: { Accept: 'text/html', 'X-Requested-With': 'XMLHttpRequest' }
        }).then(function (response) {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.text();
        }).then(function (html) {
            previewResults.innerHTML = html;
        }).catch(function (error) {
            if (error.name === 'AbortError') return;
            previewResults.innerHTML = '<div class="empty-state compact"><i class="fa fa-exclamation-circle"></i><strong>分组预览加载失败</strong><span>请稍后重新查询</span></div>';
        }).finally(function () {
            previewLoading.hidden = true;
            previewResults.removeAttribute('aria-busy');
        });
    }
    previewButton.addEventListener('click', function () { loadPreview(1); });
    previewResults.addEventListener('click', function (event) {
        var pageButton = event.target.closest('[data-segment-preview-page]');
        if (pageButton) { loadPreview(pageButton.dataset.segmentPreviewPage); return; }
        var customerButton = event.target.closest('[data-segment-customer-detail]');
        if (customerButton) openCustomerDetail(customerButton);
    });

    var customerDialog = document.getElementById('campaign-customer-dialog');
    var customerDialogBody = document.getElementById('campaign-customer-dialog-body');
    var customerDialogTitle = document.getElementById('campaign-customer-dialog-title');
    var emailDialog = document.getElementById('campaign-customer-email-preview-dialog');
    var emailFrame = document.getElementById('campaign-customer-email-preview-frame');
    var customerRequest;
    function openCustomerDetail(button) {
        if (customerRequest) customerRequest.abort();
        customerRequest = new AbortController();
        customerDialogTitle.textContent = button.textContent.trim() || '客户详情';
        customerDialogBody.innerHTML = '<div class="async-loading campaign-customer-loading"><i class="fa fa-spinner fa-spin"></i><strong>正在加载客户详情</strong></div>';
        if (!customerDialog.open) customerDialog.showModal();
        fetch(button.dataset.detailUrl, { credentials: 'same-origin', signal: customerRequest.signal, headers: { Accept: 'text/html' } })
            .then(function (response) { if (!response.ok) throw new Error('HTTP ' + response.status); return response.text(); })
            .then(function (html) {
                customerDialogBody.innerHTML = html;
                var timelineRoot = customerDialogBody.querySelector('[data-customer-timeline]');
                if (timelineRoot && window.ShopifyCustomerTimeline) {
                    window.ShopifyCustomerTimeline.init(timelineRoot);
                }
            })
            .catch(function (error) { if (error.name !== 'AbortError') customerDialogBody.innerHTML = '<div class="empty-state"><strong>客户详情加载失败</strong><span>请关闭后重新打开</span></div>'; });
    }
    customerDialogBody.addEventListener('click', function (event) {
        var link = event.target.closest('[data-customer-email-preview]');
        if (!link) return;
        event.preventDefault();
        emailFrame.src = link.href;
        if (!emailDialog.open) emailDialog.showModal();
    });
    customerDialog.querySelector('[data-campaign-customer-close]').addEventListener('click', function () { customerDialog.close(); });
    customerDialog.addEventListener('close', function () { if (customerRequest) customerRequest.abort(); customerDialogBody.replaceChildren(); if (emailDialog.open) emailDialog.close(); });
    emailDialog.querySelector('[data-campaign-customer-preview-close]').addEventListener('click', function () { emailDialog.close(); });
    emailDialog.addEventListener('close', function () { emailFrame.src = 'about:blank'; });
}());
</script>
    </main>
</div>
</body>
</html>
