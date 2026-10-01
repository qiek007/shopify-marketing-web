<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ page language="java" pageEncoding="UTF-8" contentType="text/html; charset=UTF-8" %>
<span hidden data-customer-total="${customerPage.total}" data-customer-total-exact="${customerPage.totalExact}"></span>
<c:if test="${not behaviorFilterAvailable}">
    <div class="flash-message danger"><i class="fa fa-exclamation-circle"></i><span>客户行为数据源暂时不可用，请稍后重试浏览或加购筛选。<c:out value="${behaviorFilterMessage}"/></span></div>
</c:if>
<c:choose>
    <c:when test="${empty customers}">
        <div class="empty-state"><i class="fa fa-users"></i><strong>没有找到客户</strong><span>当前查询条件没有匹配数据。</span></div>
    </c:when>
    <c:otherwise>
        <div class="table-wrap"><table class="status-table wide-table"><thead><tr><th>客户</th><th>邮箱</th><th>营销同意</th><th>抑制</th><th>订单</th><th>累计消费</th><th>最近购买</th></tr></thead><tbody>
        <c:forEach items="${customers}" var="customer">
            <c:url var="customerDetailUrl" value="/customers/detail"><c:param name="shop" value="${selectedShop}"/><c:param name="customerId" value="${customer.sourceId}"/><c:param name="q" value="${customerFilter.search}"/><c:param name="activity" value="${customerFilter.activity}"/><c:forEach items="${customerFilter.tags}" var="selectedTag"><c:param name="tag" value="${selectedTag}"/></c:forEach><c:param name="minSpent" value="${customerFilter.minSpent}"/><c:param name="maxSpent" value="${customerFilter.maxSpent}"/><c:param name="fromDate" value="${customerFilter.fromDate}"/><c:param name="toDate" value="${customerFilter.toDate}"/><c:param name="page" value="${customerPage.page}"/></c:url>
            <c:url var="customerSummaryUrl" value="/campaigns/detail/customer"><c:param name="shop" value="${selectedShop}"/><c:param name="customerId" value="${customer.sourceId}"/></c:url>
            <tr><td><a class="table-link" href="${customerDetailUrl}" data-customer-summary data-summary-url="${customerSummaryUrl}"><strong><c:out value="${customer.displayName}"/></strong></a><c:forEach items="${customer.tags}" var="tag"> <span class="status-pill neutral"><c:out value="${tag}"/></span></c:forEach><span class="cell-note"><c:out value="${customer.sourceId}"/></span></td><td><c:out value="${customer.email}" default="-"/></td><td><span class="status-pill neutral"><c:out value="${customer.consentState}"/></span></td><td><c:choose><c:when test="${customer.suppressed}"><span class="status-pill blocked">已抑制</span></c:when><c:otherwise><span class="muted-text">否</span></c:otherwise></c:choose></td><td><c:out value="${customer.orderCount}"/></td><td><c:out value="${customer.totalSpent}"/> <c:out value="${customer.currency}"/></td><td><c:choose><c:when test="${not empty customer.recencyDays}"><c:out value="${customer.recencyDays}"/> 天前</c:when><c:otherwise>-</c:otherwise></c:choose></td></tr>
        </c:forEach>
        </tbody></table></div>
        <c:if test="${customerPage.totalPages gt 1 or customerPage.hasPrevious}"><div class="pagination-bar"><c:if test="${customerPage.hasPrevious}"><a class="secondary-button" href="#" data-customer-results-page="${customerPage.page - 1}"><i class="fa fa-angle-left"></i>上一页</a></c:if><span><c:choose><c:when test="${customerPage.totalExact}">第 <c:out value="${customerPage.page}"/> / <c:out value="${customerPage.totalPages}"/> 页</c:when><c:otherwise>第 <c:out value="${customerPage.page}"/> 页</c:otherwise></c:choose></span><c:if test="${customerPage.hasNext}"><a class="secondary-button" href="#" data-customer-results-page="${customerPage.page + 1}">下一页<i class="fa fa-angle-right"></i></a></c:if></div></c:if>
    </c:otherwise>
</c:choose>
