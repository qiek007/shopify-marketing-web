<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ page language="java" pageEncoding="UTF-8" contentType="text/html; charset=UTF-8" %>
<c:set var="ctx" value="${pageContext.request.contextPath}"/><c:set var="mobilePage" value="dashboard"/>
<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>数据总览 · 滴答营销</title><link rel="stylesheet" href="${ctx}/shopify/mobile/mobile.css"></head><body>
<%@ include file="fragments/header.jspf" %>
<main class="mobile-main">
    <section class="mobile-page-title"><p class="mobile-eyebrow">OVERVIEW / 数据总览</p><h1><c:out value="${selectedShopDisplayName}" default="店铺总览"/></h1><p><c:out value="${selectedShop}" default="请选择有权限的店铺"/></p></section>
    <c:choose><c:when test="${empty selectedShop}"><section class="mobile-empty"><strong>暂无可用店铺</strong><p>请先连接店铺或联系店铺管理员授权。</p></section></c:when>
    <c:when test="${not overview.available}"><section class="mobile-notice" role="alert"><strong>数据暂不可用</strong><p>请稍后刷新重试。</p></section></c:when>
    <c:otherwise><section class="mobile-section"><div class="mobile-section-head"><h2>经营概览</h2><span>当前店铺</span></div><div class="mobile-metrics">
        <article class="mobile-metric"><span>总客户</span><strong><c:out value="${overview.customers}" default="—"/></strong></article>
        <article class="mobile-metric"><span>平台订单</span><strong><c:out value="${overview.orders}" default="—"/></strong></article>
        <article class="mobile-metric"><span>商品数</span><strong><c:out value="${overview.products}" default="—"/></strong></article>
        <article class="mobile-metric"><span>营销活动</span><strong><c:out value="${overview.activeCampaigns}" default="—"/></strong></article>
    </div></section><section class="mobile-quick"><div><p class="mobile-eyebrow">CAMPAIGNS</p><h2>营销活动</h2><p>查看进度，处理待审批活动。</p></div><a href="<c:out value='${mobileCampaignUrl}'/>">查看活动 <span aria-hidden="true">→</span></a></section><%@ include file="fragments/trends.jspf" %></c:otherwise></c:choose>
</main><%@ include file="fragments/footer.jspf" %></body></html>
