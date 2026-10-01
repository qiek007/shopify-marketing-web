<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ page language="java" pageEncoding="UTF-8" contentType="text/html; charset=UTF-8" %>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
    <title>发件抑制名单 - Shopify 邮件营销</title>
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
        <section class="page-heading">
            <div><p class="eyebrow">抑制名单</p></div>
        </section>
        <section class="content-section">
            <div class="section-heading"><div><h2>名单列表</h2><p>名单按店铺隔离，默认显示当前仍然有效的抑制记录</p></div><span class="section-count">共 <c:out value="${suppressions.total}"/> 条</span></div>
            <form class="workspace-form" method="get" action="${ctx}/suppressions">
                <input type="hidden" name="shop" value="${selectedShop}">
                <input type="hidden" name="page" value="1">
                <input type="hidden" name="size" value="${suppressions.pageSize}">
                <div class="form-grid three">
                    <label><span>邮件地址或客户 ID</span><input name="q" value="<c:out value='${suppressionFilter.search}'/>" placeholder="支持模糊查询"></label>
                    <label><span>进入原因</span><select name="reason">
                        <option value="">全部原因</option>
                        <option value="UNSUBSCRIBE"${suppressionFilter.reason eq 'UNSUBSCRIBE' ? ' selected' : ''}>客户退订</option>
                        <option value="COMPLAINT"${suppressionFilter.reason eq 'COMPLAINT' ? ' selected' : ''}>垃圾邮件投诉</option>
                        <option value="HARD_BOUNCE"${suppressionFilter.reason eq 'HARD_BOUNCE' ? ' selected' : ''}>永久退信</option>
                        <option value="MANUAL"${suppressionFilter.reason eq 'MANUAL' ? ' selected' : ''}>人工抑制</option>
                        <option value="PROVIDER"${suppressionFilter.reason eq 'PROVIDER' ? ' selected' : ''}>邮件通道抑制</option>
                    </select></label>
                    <label><span>名单状态</span><select name="status">
                        <option value="ACTIVE"${suppressionFilter.status eq 'ACTIVE' ? ' selected' : ''}>有效</option>
                        <option value="INACTIVE"${suppressionFilter.status eq 'INACTIVE' ? ' selected' : ''}>已解除</option>
                        <option value="ALL"${suppressionFilter.status eq 'ALL' ? ' selected' : ''}>全部</option>
                    </select></label>
                </div>
                <div class="form-grid">
                    <label><span>进入开始日期</span><input name="fromDate" type="date" value="<c:out value='${suppressionFilter.fromDate}'/>"></label>
                    <label><span>进入结束日期</span><input name="toDate" type="date" value="<c:out value='${suppressionFilter.toDate}'/>"></label>
                </div>
                <div class="form-actions filter-actions"><button class="action-button" type="submit"><i class="fa fa-search"></i><span>查询</span></button><a class="action-button" href="${ctx}/suppressions?shop=${selectedShop}"><i class="fa fa-undo"></i><span>清空条件</span></a></div>
            </form>
            <c:choose>
                <c:when test="${empty suppressions.items}"><div class="empty-state"><i class="fa fa-ban"></i><strong>没有找到抑制记录</strong><span>当前店铺没有符合条件的邮件地址。</span></div></c:when>
                <c:otherwise>
                    <div class="table-wrap"><table class="status-table wide-table"><thead><tr><th>客户名称</th><th>邮件地址</th><th>进入原因</th><th>进入时间</th><th>来源</th><th>状态</th><th>失效时间</th></tr></thead><tbody>
                    <c:forEach items="${suppressions.items}" var="suppression"><tr>
                        <td><c:out value="${suppression.customerName}" default="-"/></td>
                        <td><c:choose><c:when test="${not empty suppression.customerSourceId}">
                            <c:url var="suppressionCustomerUrl" value="/customers/detail"><c:param name="shop" value="${selectedShop}"/><c:param name="customerId" value="${suppression.customerSourceId}"/></c:url>
                            <c:url var="suppressionCustomerFragmentUrl" value="/campaigns/detail/customer"><c:param name="shop" value="${selectedShop}"/><c:param name="customerId" value="${suppression.customerSourceId}"/></c:url>
                            <a class="table-link" href="<c:out value='${suppressionCustomerUrl}'/>" data-suppression-customer-detail data-detail-url="<c:out value='${suppressionCustomerFragmentUrl}'/>"><strong><c:out value="${suppression.email}" default="-"/></strong></a>
                        </c:when><c:otherwise><strong><c:out value="${suppression.email}" default="-"/></strong></c:otherwise></c:choose></td>
                        <td><span class="status-pill blocked"><c:out value="${suppression.reasonLabel}"/></span><span class="cell-note"><c:out value="${suppression.reason}"/></span></td>
                        <td><time data-browser-time="<c:out value='${suppression.enteredAt}'/>" datetime="<c:out value='${suppression.enteredAt}'/>"><c:out value="${suppression.enteredAt}"/></time></td>
                        <td><c:out value="${suppression.source}" default="-"/></td>
                        <td><c:choose><c:when test="${suppression.active}"><span class="status-pill blocked">有效</span></c:when><c:otherwise><span class="status-pill neutral">已解除</span></c:otherwise></c:choose></td>
                        <td><time data-browser-time="<c:out value='${suppression.expiresAt}'/>" datetime="<c:out value='${suppression.expiresAt}'/>"><c:out value="${suppression.expiresAt}" default="长期有效"/></time></td>
                    </tr></c:forEach></tbody></table></div>
                    <c:url var="previousPageUrl" value="/suppressions"><c:param name="shop" value="${selectedShop}"/><c:param name="q" value="${suppressionFilter.search}"/><c:param name="reason" value="${suppressionFilter.reason}"/><c:param name="status" value="${suppressionFilter.status}"/><c:param name="fromDate" value="${suppressionFilter.fromDate}"/><c:param name="toDate" value="${suppressionFilter.toDate}"/><c:param name="page" value="${suppressions.page - 1}"/><c:param name="size" value="${suppressions.pageSize}"/></c:url>
                    <c:url var="nextPageUrl" value="/suppressions"><c:param name="shop" value="${selectedShop}"/><c:param name="q" value="${suppressionFilter.search}"/><c:param name="reason" value="${suppressionFilter.reason}"/><c:param name="status" value="${suppressionFilter.status}"/><c:param name="fromDate" value="${suppressionFilter.fromDate}"/><c:param name="toDate" value="${suppressionFilter.toDate}"/><c:param name="page" value="${suppressions.page + 1}"/><c:param name="size" value="${suppressions.pageSize}"/></c:url>
                    <div class="pagination-bar"><c:if test="${suppressions.hasPrevious}"><a class="action-button" href="${previousPageUrl}">上一页</a></c:if><span>第 <c:out value="${suppressions.page}"/> / <c:out value="${suppressions.totalPages}"/> 页</span><c:if test="${suppressions.hasNext}"><a class="action-button" href="${nextPageUrl}">下一页</a></c:if></div>
                </c:otherwise>
            </c:choose>
        </section>
        <dialog id="suppression-customer-dialog" class="campaign-customer-dialog" aria-labelledby="suppression-customer-dialog-title">
            <header class="campaign-customer-dialog-heading"><div><p class="eyebrow">客户明细</p><h2 id="suppression-customer-dialog-title">客户详情</h2></div><button class="icon-button dialog-close-button" type="button" data-suppression-customer-close title="关闭客户详情" aria-label="关闭客户详情"><i class="fa fa-times" aria-hidden="true"></i></button></header>
            <div id="suppression-customer-dialog-body" class="campaign-customer-dialog-body"></div>
        </dialog>
        <dialog id="suppression-customer-email-dialog" class="template-preview-dialog customer-email-preview-dialog" aria-labelledby="suppression-customer-email-title">
            <div class="template-preview-heading"><div><p class="eyebrow">客户实际内容</p><h2 id="suppression-customer-email-title">营销邮件预览</h2></div><button class="icon-button dialog-close-button" type="button" data-suppression-email-close title="关闭预览" aria-label="关闭预览"><i class="fa fa-times" aria-hidden="true"></i></button></div>
            <div class="template-preview-body"><iframe id="suppression-customer-email-frame" title="该客户收到的营销邮件" sandbox src="about:blank"></iframe></div>
        </dialog>
        <script src="${ctx}/shopify/js/customer-timeline.js?v=20260925-p130"></script>
        <script>
        (function () {
            var dialog = document.getElementById('suppression-customer-dialog');
            var body = document.getElementById('suppression-customer-dialog-body');
            var title = document.getElementById('suppression-customer-dialog-title');
            var emailDialog = document.getElementById('suppression-customer-email-dialog');
            var emailFrame = document.getElementById('suppression-customer-email-frame');
            var request;

            document.querySelector('.content-section').addEventListener('click', function (event) {
                var link = event.target.closest('[data-suppression-customer-detail]');
                if (!link || typeof dialog.showModal !== 'function') return;
                event.preventDefault();
                if (request) request.abort();
                request = new AbortController();
                title.textContent = link.textContent.trim() || '客户详情';
                body.innerHTML = '<div class="async-loading"><i class="fa fa-spinner fa-spin"></i><strong>正在加载客户详情</strong></div>';
                if (!dialog.open) dialog.showModal();
                fetch(link.dataset.detailUrl, {
                    credentials: 'same-origin', signal: request.signal,
                    headers: { Accept: 'text/html' }
                }).then(function (response) {
                    if (!response.ok || response.redirected) throw new Error('HTTP ' + response.status);
                    return response.text();
                }).then(function (html) {
                    body.innerHTML = html;
                    var timelineRoot = body.querySelector('[data-customer-timeline]');
                    if (timelineRoot && window.ShopifyCustomerTimeline) {
                        window.ShopifyCustomerTimeline.init(timelineRoot);
                    }
                }).catch(function (error) {
                    if (error.name === 'AbortError') return;
                    body.innerHTML = '<div class="empty-state"><strong>客户详情加载失败</strong><span>请关闭后重试，或在客户管理中查看。</span></div>';
                });
            });
            body.addEventListener('click', function (event) {
                var link = event.target.closest('[data-customer-email-preview]');
                if (!link) return;
                event.preventDefault();
                emailFrame.src = link.href;
                if (!emailDialog.open) emailDialog.showModal();
            });
            dialog.querySelector('[data-suppression-customer-close]').addEventListener('click', function () { dialog.close(); });
            dialog.addEventListener('close', function () {
                if (request) request.abort();
                body.replaceChildren();
                if (emailDialog.open) emailDialog.close();
            });
            emailDialog.querySelector('[data-suppression-email-close]').addEventListener('click', function () { emailDialog.close(); });
            emailDialog.addEventListener('close', function () { emailFrame.src = 'about:blank'; });
        }());
        </script>
    </main>
</div>
</body>
</html>
