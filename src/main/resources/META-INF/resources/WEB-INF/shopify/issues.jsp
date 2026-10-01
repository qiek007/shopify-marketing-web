<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ page language="java" pageEncoding="UTF-8" contentType="text/html; charset=UTF-8" %>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
    <title>异常处理 - Shopify 邮件营销</title>
    <c:set var="ctx" value="${pageContext.request.contextPath}"/>
    <link rel="stylesheet" href="${ctx}/baseui/static/h-ui/css/H-ui.min.css">
    <link rel="stylesheet" href="${ctx}/baseui/static/h-ui.admin/css/H-ui.admin.css">
    <link rel="stylesheet" href="${ctx}/baseui/lib/font-awesome-4.7.0/css/font-awesome.min.css">
    <link rel="stylesheet" href="${ctx}${uiAssetBase}/css/dashboard.css?v=20260927-issues-v3">
</head>
<body class="shopify-console">
<%@ include file="fragments/header.jspf" %>
<div class="console-layout">
    <%@ include file="fragments/navigation.jspf" %>
    <main class="console-main">
        <section class="page-heading"><div><p class="eyebrow">运营总览</p><h1>异常处理</h1><p>Shopify Webhook 事件在多次重试后仍未成功处理的记录</p></div><a class="action-button" href="${ctx}/dashboard?shop=${selectedShop}"><i class="fa fa-arrow-left"></i>返回运营总览</a></section>
        <c:if test="${not empty successMessage}"><div class="flash-message success"><i class="fa fa-check-circle"></i><c:out value="${successMessage}"/></div></c:if>
        <c:if test="${not empty errorMessage}"><div class="flash-message danger"><i class="fa fa-exclamation-circle"></i><c:out value="${errorMessage}"/></div></c:if>
        <section id="issue-list" class="content-section">
            <div class="section-heading"><div><h2>待处理异常</h2><p>重新处理前请先根据失败原因修复配置或数据问题；确认忽略不会重放原始事件。</p></div><span class="section-count">共 <c:out value="${issuePage.total}"/> 条</span></div>
            <c:choose>
                <c:when test="${empty selectedShop}"><div class="empty-state"><i class="fa fa-lock"></i><strong>没有可用店铺</strong></div></c:when>
                <c:when test="${empty issuePage.items}"><div class="empty-state"><i class="fa fa-check-circle"></i><strong>当前没有待处理异常</strong></div></c:when>
                <c:otherwise>
                    <div class="table-wrap"><table class="status-table wide-table issue-table"><thead><tr><th>事件</th><th>失败代码</th><th class="issue-message-column">失败原因</th><th>失败时间</th><th>操作</th></tr></thead><tbody>
                    <c:forEach items="${issuePage.items}" var="issue"><tr>
                        <td><strong><c:out value="${issue.eventType}"/></strong><span class="cell-note"><c:out value="${issue.eventId}"/></span></td>
                        <td><span class="status-pill neutral"><c:out value="${issue.failureCode}" default="UNKNOWN"/></span></td>
                        <td class="issue-message-cell"><button class="issue-message-trigger" type="button" data-issue-message="<c:out value='${issue.failureMessage}' default='未记录详细错误'/>" title="点击查看完整失败原因"><c:out value="${issue.failureMessage}" default="未记录详细错误"/></button></td>
                        <td><time data-browser-time="<c:out value='${issue.failedAt}'/>" datetime="<c:out value='${issue.failedAt}'/>"><c:out value="${issue.failedAt}"/></time></td>
                        <td><c:choose><c:when test="${canManageIssues}"><div class="table-actions issue-actions">
                            <form method="post" action="${ctx}/issues/replay"><input type="hidden" name="shop" value="${selectedShop}"><input type="hidden" name="issueId" value="${issue.id}"><button class="primary-button compact issue-action-button issue-replay-button" type="submit"><i class="fa fa-refresh"></i>重新处理</button></form>
                            <form method="post" action="${ctx}/issues/ignore" onsubmit="return confirm('确认忽略该异常？原始事件不会重新处理。');"><input type="hidden" name="shop" value="${selectedShop}"><input type="hidden" name="issueId" value="${issue.id}"><button class="secondary-button compact issue-action-button issue-ignore-button" type="submit"><i class="fa fa-ban"></i>忽略</button></form>
                        </div></c:when><c:otherwise><span class="muted-text">需要 Owner 或 Admin 角色</span></c:otherwise></c:choose></td>
                    </tr></c:forEach>
                    </tbody></table></div>
                    <c:url var="issuePreviousUrl" value="/issues"><c:param name="shop" value="${selectedShop}"/><c:param name="page" value="${issuePage.page - 1}"/></c:url>
                    <c:url var="issueNextUrl" value="/issues"><c:param name="shop" value="${selectedShop}"/><c:param name="page" value="${issuePage.page + 1}"/></c:url>
                    <div class="pagination-bar"><c:if test="${issuePage.hasPrevious}"><a class="action-button" href="${issuePreviousUrl}">上一页</a></c:if><span>第 <c:out value="${issuePage.page}"/> / <c:out value="${issuePage.totalPages}"/> 页</span><c:if test="${issuePage.hasNext}"><a class="action-button" href="${issueNextUrl}">下一页</a></c:if></div>
                </c:otherwise>
            </c:choose>
        </section>
        <dialog id="issue-message-dialog" class="campaign-customer-dialog issue-message-dialog" aria-labelledby="issue-message-dialog-title"><header class="campaign-customer-dialog-heading"><h2 id="issue-message-dialog-title">失败原因详情</h2><button class="icon-button dialog-close-button" type="button" data-issue-message-close aria-label="关闭失败原因详情"><i class="fa fa-times"></i></button></header><div class="campaign-customer-dialog-body"><pre class="issue-message-detail" data-issue-message-detail></pre></div></dialog>
        <script>(function(){var dialog=document.getElementById('issue-message-dialog');var detail=dialog.querySelector('[data-issue-message-detail]');document.querySelectorAll('[data-issue-message]').forEach(function(button){button.addEventListener('click',function(){detail.textContent=button.dataset.issueMessage||'未记录详细错误';dialog.showModal();});});dialog.addEventListener('click',function(event){if(event.target===dialog||event.target.closest('[data-issue-message-close]'))dialog.close();});}());</script>
    </main>
</div>
</body>
</html>
