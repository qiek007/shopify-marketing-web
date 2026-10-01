<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ page language="java" pageEncoding="UTF-8" contentType="text/html; charset=UTF-8" %>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>客户详情 - Shopify 邮件营销</title>
    <c:set var="ctx" value="${pageContext.request.contextPath}"/>
    <link rel="stylesheet" href="${ctx}/baseui/static/h-ui/css/H-ui.min.css">
    <link rel="stylesheet" href="${ctx}/baseui/static/h-ui.admin/css/H-ui.admin.css">
    <link rel="stylesheet" href="${ctx}/baseui/lib/font-awesome-4.7.0/css/font-awesome.min.css">
    <link rel="stylesheet" href="${ctx}${uiAssetBase}/css/dashboard.css?v=20260924-p118">
    <script src="${ctx}/shopify/js/customer-timeline.js?v=20260925-p126" defer></script>
</head>
<body class="shopify-console">
<c:url var="customerListUrl" value="/customers">
    <c:param name="shop" value="${selectedShop}"/>
    <c:param name="q" value="${param.q}"/>
    <c:param name="activity" value="${param.activity}"/>
    <c:param name="minSpent" value="${param.minSpent}"/>
    <c:param name="maxSpent" value="${param.maxSpent}"/>
    <c:param name="fromDate" value="${param.fromDate}"/>
    <c:param name="toDate" value="${param.toDate}"/>
    <c:param name="page" value="${param.page}"/>
</c:url>
<%@ include file="fragments/header.jspf" %>
<div class="console-layout">
    <%@ include file="fragments/navigation.jspf" %>
    <main class="console-main">
        <section class="page-heading">
            <div>
                <p class="eyebrow"><a href="${customerListUrl}"><i class="fa fa-arrow-left"></i> 返回客户列表</a></p>
                <h1><c:out value="${customerDetail.customer.displayName}"/></h1>
                <p><c:out value="${customerDetail.customer.email}"/> · <c:out value="${customerDetail.customer.sourceId}"/></p>
            </div>
            <span class="status-pill"><c:out value="${customerDetail.customer.consentState}"/></span>
        </section>

        <section class="detail-grid">
            <div class="detail-stat"><span>成交订单</span><strong><c:out value="${customerDetail.customer.orderCount}"/></strong></div>
            <div class="detail-stat"><span>累计消费</span><strong><c:out value="${customerDetail.customer.currency}"/> <c:out value="${customerDetail.customer.totalSpent}"/></strong></div>
            <div class="detail-stat"><span>最近成交</span><strong><time data-browser-time="<c:out value='${customerDetail.customer.lastOrderAt}'/>" datetime="<c:out value='${customerDetail.customer.lastOrderAt}'/>"><c:out value="${customerDetail.customer.lastOrderAt}" default="-"/></time></strong></div>
            <div class="detail-stat"><span>最近活跃</span><strong><time data-browser-time="<c:out value='${customerDetail.lastActivityAt}'/>" datetime="<c:out value='${customerDetail.lastActivityAt}'/>"><c:out value="${customerDetail.lastActivityAt}" default="-"/></time></strong></div>
        </section>

        <section class="content-section spaced-section">
            <div class="section-heading"><div><h2>客户信息</h2><p>订阅状态、客户 360 与店铺内身份信息</p></div></div>
            <div class="detail-grid">
                <div class="detail-stat"><span>地区语言</span><strong><c:out value="${customerDetail.locale}" default="-"/></strong></div>
                <div class="detail-stat"><span>客户来源</span><c:choose><c:when test="${customerDetail.customer.sourceType eq 'IMPORTED'}"><strong>文件导入</strong><small>可参与营销活动并记录邮件与行为时间线</small></c:when><c:otherwise><strong>Shopify · <c:out value="${customerDetail.stateLabel}"/></strong><small>账号状态与营销订阅、发件抑制状态相互独立</small></c:otherwise></c:choose></div>
                <div class="detail-stat"><span>购买频次</span><strong><c:out value="${customerDetail.frequency}" default="0"/></strong></div>
                <div class="detail-stat"><span>RFM 消费额</span><strong><c:out value="${customerDetail.monetary}"/></strong></div>
            </div>
        </section>

        <details class="content-section spaced-section customer-orders-section">
            <summary class="section-heading customer-orders-heading">
                <h2>成交订单</h2>
                <span class="customer-orders-count"><c:out value="${customerDetail.orders.size()}"/> 笔 <i class="fa fa-angle-down" aria-hidden="true"></i></span>
            </summary>
            <div class="table-wrap">
                <table class="status-table">
                    <thead><tr><th>订单</th><th>财务状态</th><th>履约状态</th><th>商品数量</th><th>优惠</th><th>金额</th><th>成交时间</th></tr></thead>
                    <tbody>
                    <c:forEach items="${customerDetail.orders}" var="order">
                        <tr>
                            <td><strong><c:out value="${order.orderName}"/></strong></td>
                            <td><c:out value="${order.financialStatus}"/></td>
                            <td><c:out value="${order.fulfillmentStatus}"/></td>
                            <td><c:out value="${order.totalQuantity}"/></td>
                            <td><c:out value="${order.totalDiscounts}"/></td>
                            <td><c:out value="${order.currency}"/> <c:out value="${order.totalPrice}"/></td>
                            <td><time data-browser-time="<c:out value='${order.processedAt}'/>" datetime="<c:out value='${order.processedAt}'/>"><c:out value="${order.processedAt}"/></time></td>
                        </tr>
                    </c:forEach>
                    </tbody>
                </table>
            </div>
        </details>

        <section class="content-section spaced-section customer-timeline-section"
                 data-customer-timeline
                 data-timeline-url="${ctx}/customers/detail/timeline"
                 data-timeline-group-url="${ctx}/customers/detail/timeline/group"
                 data-shop="<c:out value='${selectedShop}'/>"
                 data-customer-id="<c:out value='${customerDetail.customer.sourceId}'/>">
            <div class="section-heading customer-timeline-heading">
                <div><h2>客户行为时间线</h2><p>按时间分段加载，重点行为直接展示，高频浏览点击按组折叠</p></div>
                <div class="timeline-presets" aria-label="常用时间范围">
                    <button type="button" class="timeline-preset is-active" data-timeline-preset="30">近 30 天</button>
                    <button type="button" class="timeline-preset" data-timeline-preset="90">近 90 天</button>
                    <button type="button" class="timeline-preset" data-timeline-preset="365">近 1 年</button>
                </div>
            </div>
            <form class="timeline-date-form" data-timeline-date-form>
                <label><span>开始日期</span><input type="date" name="timelineFromDate" value="<c:out value='${timelineWindow.fromDate}'/>" required></label>
                <span class="timeline-date-separator">至</span>
                <label><span>结束日期</span><input type="date" name="timelineToDate" value="<c:out value='${timelineWindow.toDate}'/>" required></label>
                <button class="action-button" type="submit"><i class="fa fa-search"></i><span>查看时间段</span></button>
            </form>
            <c:if test="${not customerDetail.behaviorDataAvailable}">
                <div class="flash-message"><i class="fa fa-info-circle"></i><span>Web Pixel 浏览、点击和加购行为数据源尚未接入；当前显示订单与邮件营销行为。</span></div>
            </c:if>
            <c:set var="customerId" value="${customerDetail.customer.sourceId}"/>
            <div class="timeline-window-list" data-timeline-window-list>
                <%@ include file="fragments/customer-timeline-window.jsp" %>
            </div>
            <div class="timeline-load-status" aria-live="polite" data-timeline-status>
                已加载 <strong><c:out value="${timelineWindow.fromDate}"/> 至 <c:out value="${timelineWindow.toDate}"/></strong>，共 <strong><c:out value="${timelineWindow.totalCount}"/></strong> 项行为
            </div>
            <div class="timeline-load-actions">
                <button type="button" class="action-button timeline-load-earlier"
                        data-timeline-load-earlier ${timelineWindow.hasEarlier ? '' : 'hidden'}>
                    <i class="fa fa-history"></i><span>加载更早 30 天</span>
                </button>
                <span class="timeline-history-end" data-timeline-history-end ${timelineWindow.hasEarlier ? 'hidden' : ''}>已到达最早可查询记录</span>
            </div>
            <div class="timeline-load-error" data-timeline-error hidden></div>
        </section>
    <dialog id="customer-email-preview-dialog" class="template-preview-dialog customer-email-preview-dialog"
            aria-labelledby="customer-email-preview-title">
        <div class="template-preview-heading">
            <div><p class="eyebrow">客户实际内容</p><h2 id="customer-email-preview-title">营销邮件预览</h2></div>
            <button class="icon-button dialog-close-button" type="button"
                    data-customer-preview-close title="关闭预览" aria-label="关闭预览">
                <i class="fa fa-times" aria-hidden="true"></i>
            </button>
        </div>
        <div class="template-preview-body">
            <iframe id="customer-email-preview-frame" title="该客户收到的营销邮件"
                    sandbox src="about:blank"></iframe>
        </div>
    </dialog>
    <script>
    (function () {
        var previewDialog = document.getElementById('customer-email-preview-dialog');
        var previewFrame = document.getElementById('customer-email-preview-frame');
        var previewRoot = previewDialog ? previewDialog.closest('main') : null;
        if (!previewDialog || !previewFrame || !previewRoot) return;

        previewRoot.addEventListener('click', function (event) {
            var previewLink = event.target.closest('[data-customer-email-preview]');
            if (!previewLink) return;
            event.preventDefault();
            previewFrame.src = previewLink.href;
            if (!previewDialog.open) previewDialog.showModal();
        });
        previewDialog.querySelector('[data-customer-preview-close]').addEventListener('click', function () {
            previewDialog.close();
        });
        previewDialog.addEventListener('click', function (event) {
            if (event.target === previewDialog) previewDialog.close();
        });
        previewDialog.addEventListener('close', function () {
            previewFrame.src = 'about:blank';
        });
    }());
    </script>
    </main>
</div>
</body>
</html>
