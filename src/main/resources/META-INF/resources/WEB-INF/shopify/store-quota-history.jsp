<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ page language="java" pageEncoding="UTF-8" contentType="text/html; charset=UTF-8" %>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
    <title>邮件额度变更记录 - Shopify 邮件营销</title>
    <c:set var="ctx" value="${pageContext.request.contextPath}"/>
    <link rel="stylesheet" href="${ctx}/baseui/static/h-ui/css/H-ui.min.css">
    <link rel="stylesheet" href="${ctx}/baseui/static/h-ui.admin/css/H-ui.admin.css">
    <link rel="stylesheet" href="${ctx}/baseui/lib/font-awesome-4.7.0/css/font-awesome.min.css">
    <link rel="stylesheet" href="${ctx}${uiAssetBase}/css/dashboard.css?v=20261004-store-quota">
</head>
<body class="shopify-console">
<%@ include file="fragments/header.jspf" %>
<div class="console-layout">
    <%@ include file="fragments/navigation.jspf" %>
    <main class="console-main">
        <c:url var="storesUrl" value="/stores"><c:param name="shop" value="${selectedShop}"/></c:url>
        <section class="page-heading">
            <div><p class="eyebrow">邮件发送额度</p><h1>变更记录</h1><p>查看额度调整、发送预留、释放与送达核销的完整变化。</p></div>
            <a class="secondary-button" href="${storesUrl}"><i class="fa fa-arrow-left"></i><span>返回店铺管理</span></a>
        </section>
        <section class="content-section">
            <div class="section-heading"><div><h2><c:out value="${selectedShopDisplayName}" default="${selectedShop}"/></h2><p><c:out value="${selectedShop}"/> · 所有记录均为只读</p></div><c:if test="${quotaLedgerAvailable}"><span class="section-count">共 <c:out value="${quotaLedger.totalElements}"/> 条</span></c:if></div>
            <c:choose><c:when test="${!quotaLedgerAvailable}"><div class="empty-state"><i class="fa fa-clock-o"></i><strong>暂时无法读取额度变更记录</strong><span>请稍后刷新页面。</span></div></c:when><c:otherwise>
                <div class="table-wrap"><table class="status-table store-quota-ledger-table"><thead><tr><th>操作时间</th><th>类型</th><th>额度变更</th><th>变更后总量</th><th>变更后预留</th><th>变更后可用</th><th>操作人</th><th>备注</th></tr></thead><tbody>
                <c:forEach items="${quotaLedger.entries}" var="entry"><tr>
                    <td><time data-browser-time="<c:out value='${entry.operatedAt}'/>" datetime="<c:out value='${entry.operatedAt}'/>"><c:out value="${entry.operatedAt}"/></time></td>
                    <td><span class="store-quota-type"><c:choose><c:when test="${entry.operationType eq 'ADMIN_ADJUST'}">平台调整</c:when><c:when test="${entry.operationType eq 'CAMPAIGN_RESERVE'}">活动预留</c:when><c:when test="${entry.operationType eq 'CAMPAIGN_RELEASE'}">未发送释放</c:when><c:when test="${entry.operationType eq 'CAMPAIGN_SETTLE'}">活动送达核销</c:when><c:when test="${entry.operationType eq 'CAMPAIGN_TEST_RESERVE'}">测试邮件预留</c:when><c:when test="${entry.operationType eq 'CAMPAIGN_TEST_SETTLE'}">测试邮件核销</c:when><c:when test="${entry.operationType eq 'AUTOMATION_RESERVE'}">自动营销预留</c:when><c:when test="${entry.operationType eq 'AUTOMATION_SETTLE'}">自动营销核销</c:when><c:otherwise><c:out value="${entry.operationType}"/></c:otherwise></c:choose></span></td>
                    <td><span class="store-quota-delta ${entry.balanceDelta lt 0 ? 'negative' : (entry.balanceDelta gt 0 ? 'positive' : '')}"><c:if test="${entry.balanceDelta gt 0}">+</c:if><c:out value="${entry.balanceDelta}"/></span></td>
                    <td><c:out value="${entry.balanceAfter}"/></td><td><c:out value="${entry.reservedAfter}"/></td><td><strong><c:out value="${entry.availableAfter}"/></strong></td>
                    <td><strong><c:out value="${entry.operatorName}" default="系统"/></strong><small class="cell-note"><c:out value="${entry.operatorId}"/></small></td>
                    <td><c:out value="${entry.note}" default="-"/></td>
                </tr></c:forEach>
                <c:if test="${empty quotaLedger.entries}"><tr><td colspan="8"><div class="empty-state compact"><i class="fa fa-list-alt"></i><strong>暂无额度变更记录</strong><span>后续额度变化会显示在这里。</span></div></td></tr></c:if>
                </tbody></table></div>
                <div class="pagination-bar"><span>第 <c:out value="${quotaLedger.pageNumber}"/> 页</span><div class="pagination-actions">
                    <c:if test="${quotaLedger.pageNumber gt 1}"><c:url var="previousUrl" value="/stores/quota/history"><c:param name="shop" value="${selectedShop}"/><c:param name="page" value="${quotaLedger.pageNumber - 1}"/></c:url><a class="action-button" href="${previousUrl}">上一页</a></c:if>
                    <c:if test="${quotaLedger.pageNumber * quotaLedger.pageSize lt quotaLedger.totalElements}"><c:url var="nextUrl" value="/stores/quota/history"><c:param name="shop" value="${selectedShop}"/><c:param name="page" value="${quotaLedger.pageNumber + 1}"/></c:url><a class="action-button" href="${nextUrl}">下一页</a></c:if>
                </div></div>
            </c:otherwise></c:choose>
        </section>
    </main>
</div>
</body></html>
