<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ page language="java" pageEncoding="UTF-8" contentType="text/html; charset=UTF-8" %>
<c:set var="ctx" value="${pageContext.request.contextPath}"/>
<section class="campaign-customer-summary">
    <div>
        <h3><c:out value="${customerDetail.customer.displayName}"/></h3>
        <p><c:out value="${customerDetail.customer.email}"/> · <c:out value="${customerDetail.customer.sourceId}"/></p>
    </div>
    <span class="status-pill"><c:out value="${customerDetail.customer.consentState}"/></span>
</section>

<section class="detail-grid campaign-customer-stats">
    <div class="detail-stat"><span>成交订单</span><strong><c:out value="${customerDetail.customer.orderCount}"/></strong></div>
    <div class="detail-stat"><span>累计消费</span><strong><c:out value="${customerDetail.customer.currency}"/> <c:out value="${customerDetail.customer.totalSpent}"/></strong></div>
    <div class="detail-stat"><span>最近成交</span><strong><time data-browser-time="<c:out value='${customerDetail.customer.lastOrderAt}'/>" datetime="<c:out value='${customerDetail.customer.lastOrderAt}'/>"><c:out value="${customerDetail.customer.lastOrderAt}" default="-"/></time></strong></div>
    <div class="detail-stat"><span>最近活跃</span><strong><time data-browser-time="<c:out value='${customerDetail.lastActivityAt}'/>" datetime="<c:out value='${customerDetail.lastActivityAt}'/>"><c:out value="${customerDetail.lastActivityAt}" default="-"/></time></strong></div>
</section>

<section class="campaign-customer-section">
    <div class="section-heading"><div><h3>客户信息</h3><p>当前店铺中的身份、营销资格和价值信息</p></div></div>
    <dl class="campaign-customer-facts">
        <div><dt>账号状态</dt><dd><c:out value="${customerDetail.stateLabel}" default="-"/></dd></div>
        <div><dt>订阅状态</dt><dd><c:out value="${customerDetail.customer.consentState}"/></dd></div>
        <div><dt>抑制名单</dt><dd><c:choose><c:when test="${customerDetail.customer.suppressed}">是</c:when><c:otherwise>否</c:otherwise></c:choose></dd></div>
        <div><dt>地区语言</dt><dd><c:out value="${customerDetail.locale}" default="-"/></dd></div>
        <div><dt>客户来源</dt><dd><c:choose><c:when test="${customerDetail.customer.sourceType eq 'IMPORTED'}">文件导入</c:when><c:otherwise>Shopify</c:otherwise></c:choose></dd></div>
        <div><dt>购买频次</dt><dd><c:out value="${customerDetail.frequency}" default="0"/></dd></div>
    </dl>
</section>

<section class="campaign-customer-section">
    <div class="section-heading"><div><h3>成交订单</h3><p>该客户最近的订单明细</p></div></div>
    <c:choose><c:when test="${empty customerDetail.orders}"><div class="empty-state compact"><strong>暂无成交订单</strong></div></c:when><c:otherwise>
        <div class="table-wrap"><table class="status-table"><thead><tr><th>订单</th><th>财务状态</th><th>履约状态</th><th>商品数量</th><th>金额</th><th>成交时间</th></tr></thead><tbody>
        <c:forEach items="${customerDetail.orders}" var="order"><tr><td><strong><c:out value="${order.orderName}"/></strong></td><td><c:out value="${order.financialStatus}"/></td><td><c:out value="${order.fulfillmentStatus}"/></td><td><c:out value="${order.totalQuantity}"/></td><td><c:out value="${order.currency}"/> <c:out value="${order.totalPrice}"/></td><td><time data-browser-time="<c:out value='${order.processedAt}'/>" datetime="<c:out value='${order.processedAt}'/>"><c:out value="${order.processedAt}"/></time></td></tr></c:forEach>
        </tbody></table></div>
    </c:otherwise></c:choose>
</section>

<section class="campaign-customer-section customer-timeline-section"
         data-customer-timeline
         data-timeline-url="${ctx}/customers/detail/timeline"
         data-timeline-group-url="${ctx}/customers/detail/timeline/group"
         data-shop="<c:out value='${selectedShop}'/>"
         data-customer-id="<c:out value='${customerDetail.customer.sourceId}'/>">
    <div class="section-heading customer-timeline-heading">
        <div><h3>客户行为时间线</h3><p>按时间分段加载，重点行为直接展示，高频浏览点击按组折叠</p></div>
        <div class="timeline-presets" aria-label="常用时间范围">
            <button type="button" class="timeline-preset is-active" data-timeline-preset="30">近 30 天</button>
            <button type="button" class="timeline-preset" data-timeline-preset="90">近 90 天</button>
            <button type="button" class="timeline-preset" data-timeline-preset="365">近 1 年</button>
        </div>
    </div>
    <form class="timeline-date-form" data-timeline-date-form>
        <label><span>开始日期</span><input type="date" name="timelineFromDate" required></label>
        <span class="timeline-date-separator">至</span>
        <label><span>结束日期</span><input type="date" name="timelineToDate" required></label>
        <button class="action-button" type="submit"><i class="fa fa-search"></i><span>查看时间段</span></button>
    </form>
    <c:if test="${not customerDetail.behaviorDataAvailable}">
        <div class="flash-message"><i class="fa fa-info-circle"></i><span>Web Pixel 浏览、点击和加购行为数据源尚未接入；当前显示订单与邮件营销行为。</span></div>
    </c:if>
    <div class="timeline-window-list" data-timeline-window-list>
        <div class="async-loading campaign-customer-timeline-loading"><i class="fa fa-spinner fa-spin"></i><strong>正在加载客户时间线</strong></div>
    </div>
    <div class="timeline-load-status" aria-live="polite" data-timeline-status>正在加载最近 30 天客户行为…</div>
    <div class="timeline-load-actions">
        <button type="button" class="action-button timeline-load-earlier" data-timeline-load-earlier hidden>
            <i class="fa fa-history"></i><span>加载更早 30 天</span>
        </button>
        <span class="timeline-history-end" data-timeline-history-end hidden>已到达最早可查询记录</span>
    </div>
    <div class="timeline-load-error" data-timeline-error hidden></div>
</section>
