<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ page language="java" pageEncoding="UTF-8" contentType="text/html; charset=UTF-8" %>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Shopify 邮件营销</title>
    <c:set var="ctx" value="${pageContext.request.contextPath}"/>
    <link rel="stylesheet" href="${ctx}/baseui/static/h-ui/css/H-ui.min.css">
    <link rel="stylesheet" href="${ctx}/baseui/static/h-ui.admin/css/H-ui.admin.css">
    <link rel="stylesheet" href="${ctx}/baseui/lib/font-awesome-4.7.0/css/font-awesome.min.css">
    <link rel="stylesheet" href="${ctx}${uiAssetBase}/css/dashboard.css?v=20260927-dashboard-heading">
</head>
<body class="shopify-console">
<%@ include file="fragments/header.jspf" %>

<div class="console-layout">
    <%@ include file="fragments/navigation.jspf" %>

    <main class="console-main">
        <link rel="stylesheet" href="${ctx}${uiAssetBase}/css/dashboard-trend.css?v=20260927-trend-details">
        <section class="page-heading dashboard-page-heading">
            <p class="eyebrow">数据总览</p>
            <h1><c:if test="${not empty selectedShopDisplayName}"><c:out value="${selectedShopDisplayName}"/></c:if></h1>
            <p class="dashboard-page-subtitle"><c:choose><c:when test="${not empty selectedShop}"><c:out value="${selectedShop}"/></c:when><c:otherwise>请先连接店铺或获取店铺授权</c:otherwise></c:choose></p>
        </section>

        <c:choose>
            <c:when test="${!overview.available}">
                <section class="system-notice danger" role="alert">
                    <i class="fa fa-exclamation-circle" aria-hidden="true"></i>
                    <div><strong>数据暂不可用</strong><span>请检查数据库迁移和服务连接状态。</span></div>
                </section>

            </c:when>
            <c:otherwise>
                <section class="metric-grid" aria-label="关键指标">
                    <a class="metric-card metric-link accent-blue" href="${ctx}/products?shop=${selectedShop}">
                        <span class="metric-icon"><i class="fa fa-tags" aria-hidden="true"></i></span>
                        <div><span>商品数</span><strong><c:out value="${overview.products}"/></strong></div>
                    </a>
                    <a class="metric-card metric-link accent-teal" id="customers" href="${ctx}/customers?shop=${selectedShop}">
                        <span class="metric-icon"><i class="fa fa-users" aria-hidden="true"></i></span>
                        <div><span>总用户数</span><strong><c:out value="${overview.customers}"/></strong></div>
                    </a>
                    <a class="metric-card metric-link accent-amber" href="${ctx}/orders?shop=${selectedShop}">
                        <span class="metric-icon"><i class="fa fa-file-text-o" aria-hidden="true"></i></span>
                        <div><span>平台订单</span><strong><c:out value="${overview.orders}"/></strong></div>
                    </a>
                    <a class="metric-card metric-link accent-violet" href="${ctx}/discounts?shop=${selectedShop}">
                        <span class="metric-icon"><i class="fa fa-ticket" aria-hidden="true"></i></span>
                        <div><span>优惠活动</span><strong><c:out value="${overview.activeDiscounts}"/></strong></div>
                    </a>
                    <a class="metric-card metric-link accent-green" href="${ctx}/templates?shop=${selectedShop}">
                        <span class="metric-icon"><i class="fa fa-file-code-o" aria-hidden="true"></i></span>
                        <div><span>邮件模板</span><strong><c:out value="${overview.activeTemplates}"/></strong></div>
                    </a>
                    <a class="metric-card metric-link accent-cyan" id="campaigns" href="${ctx}/campaigns?shop=${selectedShop}">
                        <span class="metric-icon"><i class="fa fa-paper-plane-o" aria-hidden="true"></i></span>
                        <div><span>营销活动</span><strong><c:out value="${overview.activeCampaigns}"/></strong></div>
                    </a>
                    <a class="metric-card metric-link accent-amber" href="${ctx}/automations?shop=${selectedShop}">
                        <span class="metric-icon"><i class="fa fa-magic" aria-hidden="true"></i></span>
                        <div><span>自动营销</span><strong><c:out value="${overview.activeAutomations}"/></strong></div>
                    </a>
                    <a class="metric-card metric-link accent-red" href="${ctx}/issues?shop=${selectedShop}">
                        <span class="metric-icon"><i class="fa fa-warning" aria-hidden="true"></i></span>
                        <div><span>待处理异常</span><strong><c:out value="${overview.openDeadLetters}"/></strong></div>
                    </a>
                </section>

                <c:if test="${not empty selectedShop}">
                <c:url var="trendExportUrl" value="/dashboard/trends/export.xlsx"><c:param name="shop" value="${selectedShop}"/></c:url>
                <section id="daily-trend" class="content-section dashboard-trend"
                         data-dashboard-trend data-shop="<c:out value='${selectedShop}'/>"
                         data-trend-url="${ctx}/dashboard/trends">
                    <details class="dashboard-trend-details" open>
                    <summary class="section-heading trend-heading">
                        <div><h2>近 30 天趋势</h2><p>当前店铺每日邮件发送、Shopify 订单与 GA4 邮件购买表现</p></div>
                        <div class="trend-heading-actions"><span class="trend-updated" data-trend-updated>等待后台汇总</span><span class="trend-section-toggle" aria-hidden="true"><i class="fa fa-chevron-down"></i></span></div>
                    </summary>
                    <div class="trend-body">
                        <div class="trend-legend" aria-label="趋势图图例">
                            <span><i class="trend-key sent"></i>邮件发送数</span>
                            <span><i class="trend-key orders"></i>Shopify 订单数</span>
                            <span><i class="trend-key shopify-money"></i>Shopify 订单金额</span>
                            <span><i class="trend-key ga4-money"></i>GA4 邮件购买收入</span>
                        </div>
                        <div class="trend-state" data-trend-state role="status">正在读取每日汇总…</div>
                        <div class="trend-visual" data-trend-visual hidden>
                            <svg class="trend-svg" viewBox="0 0 1600 350" role="img"
                                 aria-label="近 30 天邮件发送、订单和购买收入折线图" data-trend-svg></svg>
                            <div class="trend-tooltip" data-trend-tooltip hidden></div>
                        </div>
                        <p class="trend-context" data-trend-context></p>
                        <div class="trend-detail-toolbar">
                        <details class="trend-details" data-trend-details data-trend-default-collapsed hidden>
                            <summary>查看每日明细 <i class="fa fa-chevron-down" aria-hidden="true"></i></summary>
                            <div class="table-wrap"><table class="status-table">
                                <thead><tr><th>日期</th><th>邮件发送数</th><th>Shopify 订单数</th><th>Shopify 订单金额</th><th>GA4 邮件购买收入</th></tr></thead>
                                <tbody data-trend-rows></tbody>
                            </table></div>
                        </details>
                        <a class="action-button trend-export-button" href="${trendExportUrl}"
                           data-trend-export hidden><i class="fa fa-file-excel-o" aria-hidden="true"></i>导出 Excel</a>
                        </div>
                    </div>
                    </details>
                </section>
                </c:if>

            </c:otherwise>
        </c:choose>
        <script src="${ctx}/shopify/js/dashboard-trend.js?v=20260927-trend-details"></script>
    </main>
</div>
</body>
