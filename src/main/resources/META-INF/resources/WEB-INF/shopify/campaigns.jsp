<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ page language="java" pageEncoding="UTF-8" contentType="text/html; charset=UTF-8" %>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>营销活动 - Shopify 邮件营销</title>
    <c:set var="ctx" value="${pageContext.request.contextPath}"/>
    <link rel="stylesheet" href="${ctx}/baseui/static/h-ui/css/H-ui.min.css">
    <link rel="stylesheet" href="${ctx}/baseui/static/h-ui.admin/css/H-ui.admin.css">
    <link rel="stylesheet" href="${ctx}/baseui/lib/font-awesome-4.7.0/css/font-awesome.min.css">
    <link rel="stylesheet" href="${ctx}${uiAssetBase}/css/dashboard.css?v=20261020-scheduled-time">
</head>
<body class="shopify-console">
<%@ include file="fragments/header.jspf" %>
<div class="console-layout">
    <%@ include file="fragments/navigation.jspf" %>
    <main class="console-main">
    <style data-campaign-list-styles>
        .status-table .campaign-status { color: #475569; background: #f1f5f9; font-weight: 600; white-space: nowrap; }
        .status-table .campaign-status[data-campaign-status="DRAFT"] { color: #475569; background: #f1f5f9; }
        .status-table .campaign-status[data-campaign-status="PENDING_APPROVAL"] { color: #854d0e; background: #fef9c3; }
        .status-table .campaign-status[data-campaign-status="APPROVED"] { color: #6b21a8; background: #f3e8ff; }
        .status-table .campaign-status[data-campaign-status="PREPARING"] { color: #3730a3; background: #e0e7ff; }
        .status-table .campaign-status[data-campaign-status="SCHEDULED"] { color: #1e40af; background: #dbeafe; }
        .status-table .campaign-status[data-campaign-status="RUNNING"] { color: #115e59; background: #ccfbf1; }
        .status-table .campaign-status[data-campaign-status="QUEUED"] { color: #075985; background: #e0f2fe; }
        .status-table .campaign-status[data-campaign-status="PAUSED"] { color: #9a3412; background: #ffedd5; }
        .status-table .campaign-status[data-campaign-status="ARCHIVED"] { color: #5b21b6; background: #ede9fe; }
        .status-table .campaign-status[data-campaign-status="COMPLETED"] { color: #166534; background: #dcfce7; }
        .status-table .campaign-status[data-campaign-status="CANCELLED"] { color: #57534e; background: #e7e5e4; }
        .status-table .campaign-status[data-campaign-status="FAILED"] { color: #991b1b; background: #fee2e2; }
        .campaign-list-table-wrap { overflow-x: auto; }
        .campaign-list-table-wrap .status-table { min-width: 1160px; }
        .status-table .campaign-time-column { min-width: 154px; white-space: nowrap; }
    </style>
        <section class="page-heading">
            <div><p class="eyebrow">营销活动</p></div>
        </section>
        <c:if test="${not empty successMessage}"><div class="flash-message success"><i class="fa fa-check-circle"></i><c:out value="${successMessage}"/></div></c:if>
        <c:if test="${not empty errorMessage}"><div class="flash-message danger"><i class="fa fa-exclamation-circle"></i><c:out value="${errorMessage}"/></div></c:if>

        <section class="content-section">
            <div class="section-heading"><div><h2>活动列表</h2><p hidden>草稿和待审批活动可以继续编辑；发送后的活动保留不可变执行记录</p></div><div class="section-heading-actions"><span class="section-count">共 <c:out value="${campaignPage.total}"/> 个</span><c:if test="${not empty selectedShop and canManageCampaigns}"><a class="primary-button compact" href="${ctx}/campaigns/editor?shop=${selectedShop}"><i class="fa fa-plus"></i>创建活动</a></c:if></div></div>
            <c:if test="${not empty selectedShop}">
                <form class="workspace-form list-filter-form campaign-list-filter" method="get" action="${ctx}/campaigns">
                    <input type="hidden" name="shop" value="${selectedShop}">
                    <input type="hidden" name="page" value="1">
                    <input type="hidden" name="size" value="${campaignPage.pageSize}">
                    <label><span>活动名称</span><input name="q" value="<c:out value='${campaignSearch}'/>" placeholder="支持模糊查询"></label>
                    <label><span>活动状态</span><select name="status"><option value="">全部状态</option><c:forEach items="${campaignStatuses}" var="item"><option value="${item.name}" ${campaignStatus eq item.name ? 'selected' : ''}><c:out value="${item.displayName}"/></option></c:forEach></select></label>
                    <label><span>更新开始日期</span><input type="date" name="fromDate" value="${campaignFromDate}"></label>
                    <label><span>更新结束日期</span><input type="date" name="toDate" value="${campaignToDate}"></label>
                    <div class="form-actions filter-actions"><button class="action-button" type="submit"><i class="fa fa-search"></i><span>查询</span></button><a class="secondary-button clear-filter-button" href="${ctx}/campaigns?shop=${selectedShop}"><i class="fa fa-eraser"></i><span>清空条件</span></a></div>
                </form>
            </c:if>
            <c:choose>
                <c:when test="${empty selectedShop}"><div class="empty-state"><i class="fa fa-lock"></i><strong>没有可用店铺</strong><span>连接店铺或由店铺 Owner 授权后即可管理营销活动。</span></div></c:when>
                <c:when test="${empty campaigns}"><div class="empty-state"><i class="fa fa-paper-plane-o"></i><strong>还没有营销活动</strong><span>先创建邮件模板和客户分组，再建立活动。</span></div></c:when>
                <c:otherwise>
                    <c:set var="snapshotBuilding" value="false"/>
                    <div class="table-wrap campaign-list-table-wrap"><table class="status-table"><thead><tr><th>活动</th><th>状态</th><th>模板</th><th>用户数</th><th class="campaign-time-column">执行时间</th><th class="campaign-time-column">有效截止时间</th><th class="campaign-time-column">更新时间</th><th>操作</th></tr></thead><tbody>
                    <c:forEach items="${campaigns}" var="campaign"><tr>
                        <td><a class="table-primary-link" href="${ctx}/campaigns/detail?shop=${campaign.shopDomain}&amp;campaignId=${campaign.campaignId}"><strong><c:out value="${campaign.name}"/></strong></a></td>
                        <td>
                            <span class="status-pill campaign-status" data-campaign-status="<c:out value='${empty campaign.displayStatus ? campaign.status : campaign.displayStatus}'/>"><c:out value="${campaign.statusDisplayName}"/></span>
                            <c:if test="${campaign.status eq 'SCHEDULED' and not empty campaign.scheduledAt}">
                                <span class="cell-note campaign-scheduled-time">定时发送：<time data-browser-time="<c:out value='${campaign.scheduledAt}'/>" data-browser-time-format="date-time" datetime="<c:out value='${campaign.scheduledAt}'/>"><c:out value="${campaign.scheduledAt}"/></time></span>
                            </c:if>
                        </td>
                        <td><c:out value="${campaign.templateName}"/></td>
                        <td><c:choose>
                            <c:when test="${campaign.snapshotStatus eq 'BUILDING' or campaign.snapshotStatus eq 'PROCESSING'}"><c:set var="snapshotBuilding" value="true"/><span class="status-pill warning"><i class="fa fa-spinner fa-spin"></i>计算中</span></c:when>
                            <c:when test="${campaign.snapshotStatus eq 'FAILED'}"><span class="status-pill danger">计算失败</span></c:when>
                            <c:otherwise><strong><c:out value="${campaign.audienceCount}"/></strong></c:otherwise>
                        </c:choose></td>
                        <td class="campaign-time-column"><c:choose><c:when test="${not empty campaign.startedAt}"><time data-browser-time="<c:out value='${campaign.startedAt}'/>" data-browser-time-format="date-time" datetime="<c:out value='${campaign.startedAt}'/>"><c:out value="${campaign.startedAt}"/></time></c:when><c:otherwise><span class="cell-note">未执行</span></c:otherwise></c:choose></td>
                        <td class="campaign-time-column"><c:choose><c:when test="${not empty campaign.validUntil}"><time data-browser-time="<c:out value='${campaign.validUntil}'/>" data-browser-time-format="date-time" datetime="<c:out value='${campaign.validUntil}'/>"><c:out value="${campaign.validUntil}"/></time></c:when><c:otherwise><span class="cell-note">执行后确定</span></c:otherwise></c:choose></td>
                        <td class="campaign-time-column"><time data-browser-time="<c:out value='${campaign.updatedAt}'/>" data-browser-time-format="date-time" datetime="<c:out value='${campaign.updatedAt}'/>"><c:out value="${campaign.updatedAt}"/></time></td>
                        <td><div class="table-actions">
                            <a class="action-button" href="${ctx}/campaigns/detail?shop=${campaign.shopDomain}&amp;campaignId=${campaign.campaignId}"><i class="fa fa-eye"></i>${campaign.status eq 'PENDING_APPROVAL' ? '查看并审批' : '查看明细'}</a>
                            <c:if test="${canManageCampaigns and (campaign.status eq 'DRAFT' or campaign.status eq 'PENDING_APPROVAL')}"><a class="action-button" href="${ctx}/campaigns/editor?shop=${campaign.shopDomain}&amp;campaignId=${campaign.campaignId}"><i class="fa fa-pencil"></i>编辑</a></c:if>
                            <c:if test="${canManageCampaigns and campaign.status eq 'DRAFT'}"><form method="post" action="${ctx}/campaigns/action"><input type="hidden" name="shop" value="${campaign.shopDomain}"><input type="hidden" name="campaignId" value="${campaign.campaignId}"><input type="hidden" name="action" value="SUBMIT"><button class="action-button" type="submit"><i class="fa fa-check"></i>提交审批</button></form></c:if>
                            <c:if test="${canManageCampaigns and campaign.status eq 'PENDING_APPROVAL' and not empty campaign.createdBy and campaign.createdBy eq logineduser.id}"><form method="post" action="${ctx}/campaigns/action" data-merchant-action-form data-confirm-message="撤回后返回草稿，可修改后重新提交审批" data-pending-label="撤回中…"><input type="hidden" name="shop" value="${campaign.shopDomain}"><input type="hidden" name="campaignId" value="${campaign.campaignId}"><input type="hidden" name="action" value="WITHDRAW"><button class="action-button" type="submit"><i class="fa fa-undo"></i>撤回审批</button></form></c:if>
                            <c:if test="${canManageCampaigns}"><form method="post" action="${ctx}/campaigns/action" data-merchant-action-form data-pending-label="复制中…"><input type="hidden" name="shop" value="${campaign.shopDomain}"><input type="hidden" name="campaignId" value="${campaign.campaignId}"><input type="hidden" name="action" value="COPY"><button class="action-button" type="submit"><i class="fa fa-copy"></i>复制活动</button></form></c:if>
                        </div></td>
                    </tr></c:forEach>
                    </tbody></table></div>
                    <c:url var="campaignPreviousUrl" value="/campaigns"><c:param name="shop" value="${selectedShop}"/><c:param name="q" value="${campaignSearch}"/><c:param name="status" value="${campaignStatus}"/><c:param name="fromDate" value="${campaignFromDate}"/><c:param name="toDate" value="${campaignToDate}"/><c:param name="page" value="${campaignPage.page - 1}"/><c:param name="size" value="${campaignPage.pageSize}"/></c:url>
                    <c:url var="campaignNextUrl" value="/campaigns"><c:param name="shop" value="${selectedShop}"/><c:param name="q" value="${campaignSearch}"/><c:param name="status" value="${campaignStatus}"/><c:param name="fromDate" value="${campaignFromDate}"/><c:param name="toDate" value="${campaignToDate}"/><c:param name="page" value="${campaignPage.page + 1}"/><c:param name="size" value="${campaignPage.pageSize}"/></c:url>
                    <div class="pagination-bar"><c:if test="${campaignPage.hasPrevious}"><a class="action-button" href="${campaignPreviousUrl}">上一页</a></c:if><span>第 <c:out value="${campaignPage.page}"/> / <c:out value="${campaignPage.totalPages}"/> 页</span><c:if test="${campaignPage.hasNext}"><a class="action-button" href="${campaignNextUrl}">下一页</a></c:if></div>
                    <c:if test="${snapshotBuilding}"><script>setTimeout(function () { window.location.reload(); }, 2000);</script></c:if>
                </c:otherwise>
            </c:choose>
        </section>
    </main>
</div>
<script data-merchant-action-handler>
(function () {
    document.querySelectorAll('form[data-merchant-action-form]').forEach(function (form) {
        form.addEventListener('submit', function (event) {
            if (event.defaultPrevented) return;
            if (form.dataset.submitting === 'true') {
                event.preventDefault();
                return;
            }
            var message = form.getAttribute('data-confirm-message');
            if (message && !window.confirm(message)) {
                event.preventDefault();
                return;
            }
            form.dataset.submitting = 'true';
            var button = form.querySelector('button[type="submit"]');
            if (button) {
                button.disabled = true;
                button.innerHTML = '<i class="fa fa-spinner fa-spin"></i>' + form.getAttribute('data-pending-label');
            }
        });
    });
}());
</script>
</body>
</html>
