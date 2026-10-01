<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ page language="java" pageEncoding="UTF-8" contentType="text/html; charset=UTF-8" %>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>客户分组 - Shopify 邮件营销</title>
    <c:set var="ctx" value="${pageContext.request.contextPath}"/>
    <link rel="stylesheet" href="${ctx}/baseui/static/h-ui/css/H-ui.min.css">
    <link rel="stylesheet" href="${ctx}/baseui/static/h-ui.admin/css/H-ui.admin.css">
    <link rel="stylesheet" href="${ctx}/baseui/lib/font-awesome-4.7.0/css/font-awesome.min.css">
    <link rel="stylesheet" href="${ctx}${uiAssetBase}/css/dashboard.css">
</head>
<body class="shopify-console">
<%@ include file="fragments/header.jspf" %>
<div class="console-layout">
    <%@ include file="fragments/navigation.jspf" %>
    <main class="console-main">
        <section class="page-heading"><div><p class="eyebrow">客户分组</p></div></section>
        <c:if test="${not empty successMessage}"><div class="flash-message success"><i class="fa fa-check-circle"></i><c:out value="${successMessage}"/></div></c:if>
        <c:if test="${not empty errorMessage}"><div class="flash-message danger"><i class="fa fa-exclamation-circle"></i><c:out value="${errorMessage}"/></div></c:if>
        <section class="content-section">
            <div class="section-heading"><div><h2>动态分组</h2><p>根据筛选条件进行实时动态更新</p></div><div class="section-heading-actions"><span class="section-count">共 <c:out value="${segmentPage.total}"/> 个</span><c:if test="${not empty selectedShop and canManageCampaigns}"><a class="primary-button compact" href="${ctx}/segments/editor?shop=${selectedShop}"><i class="fa fa-plus"></i>新建分组</a></c:if></div></div>
              <c:if test="${not empty selectedShop}"><form class="workspace-form list-filter-form segment-list-filter" method="get" action="${ctx}/segments"><input type="hidden" name="shop" value="${selectedShop}"><input type="hidden" name="page" value="1"><input type="hidden" name="size" value="${segmentPage.pageSize}"><label><span>分组名称</span><input name="q" value="<c:out value='${segmentSearch}'/>" placeholder="输入分组名称，支持模糊查询"></label><div class="form-actions filter-actions"><button class="action-button" type="submit"><i class="fa fa-search"></i><span>查询</span></button><a class="action-button" href="${ctx}/segments?shop=${selectedShop}"><i class="fa fa-undo"></i><span>清空条件</span></a></div></form></c:if>
            <c:choose>
                <c:when test="${empty selectedShop}"><div class="empty-state"><i class="fa fa-lock"></i><strong>没有可用店铺</strong><span>获得店铺授权后即可管理客户分组。</span></div></c:when>
                <c:when test="${empty segments}"><div class="empty-state"><i class="fa fa-filter"></i><strong>还没有客户分组</strong><span>建立规则并预览命中客户后，可用于营销活动。</span></div></c:when>
                <c:otherwise><div class="table-wrap"><table class="status-table"><thead><tr><th>名称</th><th>规则</th><th>状态</th><th>更新时间</th><th>操作</th></tr></thead><tbody>
                    <c:forEach items="${segments}" var="segment"><tr><td><strong><c:out value="${segment.name}"/></strong><span class="cell-note"><c:out value="${segment.segmentId}"/></span></td><td class="segment-rule-summary"><c:out value="${segment.ruleSummary}"/></td><td><span class="status-pill"><c:out value="${segment.status}"/></span></td><td><time data-browser-time="<c:out value='${segment.updatedAt}'/>" data-browser-time-format="date-time" datetime="<c:out value='${segment.updatedAt}'/>"><c:out value="${segment.updatedAt}"/></time></td><td><a class="action-button" href="${ctx}/segments/editor?shop=${segment.shopDomain}&amp;segmentId=${segment.segmentId}"><i class="fa ${canManageCampaigns ? 'fa-pencil' : 'fa-eye'}"></i>${canManageCampaigns ? '查看 / 编辑' : '查看'}</a></td></tr></c:forEach>
                </tbody></table></div>
                    <c:url var="segmentPreviousUrl" value="/segments"><c:param name="shop" value="${selectedShop}"/><c:param name="q" value="${segmentSearch}"/><c:param name="page" value="${segmentPage.page - 1}"/><c:param name="size" value="${segmentPage.pageSize}"/></c:url>
                    <c:url var="segmentNextUrl" value="/segments"><c:param name="shop" value="${selectedShop}"/><c:param name="q" value="${segmentSearch}"/><c:param name="page" value="${segmentPage.page + 1}"/><c:param name="size" value="${segmentPage.pageSize}"/></c:url>
                    <div class="pagination-bar"><c:if test="${segmentPage.hasPrevious}"><a class="action-button" href="${segmentPreviousUrl}">上一页</a></c:if><span>第 <c:out value="${segmentPage.page}"/> / <c:out value="${segmentPage.totalPages}"/> 页</span><c:if test="${segmentPage.hasNext}"><a class="action-button" href="${segmentNextUrl}">下一页</a></c:if></div>
                </c:otherwise>
            </c:choose>
        </section>
    </main>
</div>
</body>
</html>
