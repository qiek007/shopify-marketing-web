<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ page language="java" pageEncoding="UTF-8" contentType="text/html; charset=UTF-8" %>
<c:set var="ctx" value="${pageContext.request.contextPath}"/>
<div class="segment-preview-summary">
    <article><span>规则命中</span><strong><c:out value="${segmentPreview.matchedCount}"/></strong></article>
    <article><span>可发送</span><strong><c:out value="${segmentPreview.eligibleCount}"/></strong></article>
    <article><span>发送前需确认</span><strong><c:out value="${segmentPreview.confirmationRequiredCount}"/></strong></article>
    <article><span>资格排除</span><strong><c:out value="${segmentPreview.excludedCount}"/></strong></article>
</div>
<c:choose>
    <c:when test="${empty segmentPreview.customers}">
        <div class="empty-state compact"><i class="fa fa-filter"></i><strong>规则没有命中客户</strong><span>请放宽条件或检查客户同步状态。</span></div>
    </c:when>
    <c:otherwise>
        <div class="table-wrap segment-preview-table"><table class="status-table">
            <thead><tr><th>客户</th><th>邮箱</th><th>订单</th><th>累计消费</th><th>营销订阅</th></tr></thead>
            <tbody><c:forEach items="${segmentPreview.customers}" var="customer"><tr>
                <td><button class="customer-detail-link" type="button" data-segment-customer-detail
                        data-detail-url="${ctx}/segments/customer/detail?shop=${selectedShop}&amp;customerId=${customer.customerSourceId}">
                    <strong><c:out value="${customer.customerName}"/></strong>
                </button></td>
                <td><c:out value="${customer.email}" default="-"/></td>
                <td><c:out value="${customer.orderCount}"/></td>
                <td><c:out value="${customer.totalSpent}"/> <c:out value="${customer.currency}"/></td>
                <td><c:out value="${customer.consentState}"/></td>
            </tr></c:forEach></tbody>
        </table></div>
    </c:otherwise>
</c:choose>
<c:if test="${segmentPreview.totalPages gt 0}">
    <div class="pagination-bar segment-preview-pagination"><c:if test="${segmentPreview.hasPrevious}"><button class="secondary-button" type="button" data-segment-preview-page="${segmentPreview.page - 1}"><i class="fa fa-angle-left"></i>上一页</button></c:if><span>共 <c:out value="${segmentPreview.matchedCount}"/> 位客户，每页 10 条，第 <c:out value="${segmentPreview.page}"/> / <c:out value="${segmentPreview.totalPages}"/> 页</span><c:if test="${segmentPreview.hasNext}"><button class="secondary-button" type="button" data-segment-preview-page="${segmentPreview.page + 1}">下一页<i class="fa fa-angle-right"></i></button></c:if></div>
</c:if>
