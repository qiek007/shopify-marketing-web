<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ page language="java" pageEncoding="UTF-8" contentType="text/html; charset=UTF-8" %>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
    <title>邮件额度期限批次 - Shopify 邮件营销</title>
    <c:set var="ctx" value="${pageContext.request.contextPath}"/>
    <link rel="stylesheet" href="${ctx}/baseui/static/h-ui/css/H-ui.min.css">
    <link rel="stylesheet" href="${ctx}/baseui/static/h-ui.admin/css/H-ui.admin.css">
    <link rel="stylesheet" href="${ctx}/baseui/lib/font-awesome-4.7.0/css/font-awesome.min.css">
    <link rel="stylesheet" href="${ctx}${uiAssetBase}/css/dashboard.css?v=20261004-store-quota">
<style>.quota-lot-list{display:grid;gap:14px;padding:16px}.quota-lot-card{padding:18px;border:1px solid #dce5e9;border-radius:8px;background:#fff}.quota-lot-card header{display:flex;gap:12px;align-items:flex-start;justify-content:space-between}.quota-lot-card .cell-note{display:block;max-width:none;overflow-wrap:anywhere}.quota-lot-expiry{display:flex;gap:8px;flex-wrap:wrap;align-items:center;color:#326250;margin:14px 0}.quota-lot-expiry>span{font-size:12px;color:#70818a}.quota-lot-counts{display:grid;grid-template-columns:repeat(auto-fit,minmax(112px,1fr));gap:14px;margin:0;padding:14px 0;border-top:1px solid #edf1f3}.quota-lot-counts dt{font-size:12px;color:#667b86}.quota-lot-counts dd{margin:5px 0 0;font-size:20px;font-weight:700;color:#17313c}.quota-lot-pagination{display:flex;justify-content:center;gap:18px;align-items:center;padding:14px;flex-wrap:wrap}.quota-lot-pagination .pagination-actions{display:flex;gap:8px}.quota-lot-reduce{display:flex;align-items:flex-end;gap:10px;flex-wrap:wrap;border-top:1px solid #edf1f3;padding-top:14px}.quota-lot-reduce label{display:grid;gap:5px;min-width:160px}.quota-lot-reduce input{max-width:260px;padding:8px;border:1px solid #cbd9df;border-radius:4px}</style>
</head>
<body class="shopify-console">
<%@ include file="fragments/header.jspf" %>
<div class="console-layout">
    <%@ include file="fragments/navigation.jspf" %>
    <main class="console-main">
        <c:url var="storesUrl" value="/stores"><c:param name="shop" value="${selectedShop}"/></c:url>
        <c:url var="quotaHistoryUrl" value="/stores/quota/history"><c:param name="shop" value="${selectedShop}"/></c:url>
        <section class="page-heading">
            <div><p class="eyebrow">邮件发送额度</p><h1>期限批次</h1><p>分别查看各批额度的有效期、占用、核销和到期回收；待回收额度已不可使用，后台将逐笔记账。</p></div>
            <a class="secondary-button" href="<c:out value='${storesUrl}'/>"><i class="fa fa-arrow-left"></i><span>返回店铺管理</span></a>
        </section>
<section class="content-section"><div class="section-heading"><div><h2>分期限额度</h2><p>按最早到期批次优先预扣；过期释放计入回收，不重新变为可用。</p></div><a class="action-button" href="<c:out value='${quotaHistoryUrl}'/>">查看变更记录</a></div><c:choose><c:when test="${!quotaLotsAvailable}"><div class="empty-state">暂时无法读取额度批次，请稍后重试。</div></c:when><c:otherwise>
<div class="quota-lot-list"><c:forEach items="${quotaLots.entries}" var="lot" varStatus="lotRow"><article class="quota-lot-card">
 <header><div><strong>额度批次 <c:out value="${lot.batchNo}" default="${lot.lotId}"/></strong><small class="cell-note">批次 ID：<c:out value="${lot.lotId}"/></small></div><span class="status-pill ${lot.status eq 'EXPIRED' ? 'blocked' : ''}"><c:choose><c:when test="${lot.status eq 'EXPIRED'}">已过期</c:when><c:when test="${lot.status eq 'ACTIVE'}">有效</c:when><c:when test="${lot.status eq 'DEPLETED'}">已用尽</c:when><c:otherwise><c:out value="${lot.status}"/></c:otherwise></c:choose></span></header>
 <p class="quota-lot-expiry"><i class="fa fa-calendar" aria-hidden="true"></i> 有效截止：<strong><c:out value="${lot.expiryDisplay}"/></strong><span>北京时间</span><c:if test="${lot.expiringSoon}"><span class="status-pill">7天内到期</span></c:if></p>
 <dl class="quota-lot-counts"><div><dt>发放额度</dt><dd><c:out value="${lot.grantedCount}"/></dd></div><div><dt>当前可用</dt><dd><c:out value="${lot.availableCount}"/></dd></div><div><dt>未提交预扣</dt><dd><c:out value="${lot.reservedCount}"/></dd></div><div><dt>已提交待核销</dt><dd><c:out value="${lot.pendingCount}"/></dd></div><div><dt>已核销</dt><dd><c:out value="${lot.consumedCount}"/></dd></div><div><dt>到期回收</dt><dd><c:out value="${lot.expiredCount}"/></dd></div><div><dt>已过期待回收</dt><dd><c:out value="${lot.pendingExpiryCount}"/></dd></div><div><dt>人工扣减</dt><dd><c:out value="${lot.revokedCount}"/></dd></div></dl>
 <p class="cell-note"><c:out value="${lot.note}" default="-"/></p>

</article></c:forEach></div>
<c:if test="${empty quotaLots.entries}"><div class="empty-state">暂无额度批次。</div></c:if>
<div class="pagination-bar quota-lot-pagination"><span>第 <c:out value="${quotaLots.pageNumber}"/> 页，共 <c:out value="${quotaLots.totalElements}"/> 个批次</span><div class="pagination-actions">
<c:if test="${quotaLots.pageNumber gt 1}"><c:url var="previousLots" value="/stores/quota/lots"><c:param name="shop" value="${selectedShop}"/><c:param name="page" value="${quotaLots.pageNumber - 1}"/></c:url><a class="secondary-button" href="<c:out value='${previousLots}'/>">上一页</a></c:if>
<c:if test="${quotaLots.pageNumber * quotaLots.pageSize lt quotaLots.totalElements}"><c:url var="nextLots" value="/stores/quota/lots"><c:param name="shop" value="${selectedShop}"/><c:param name="page" value="${quotaLots.pageNumber + 1}"/></c:url><a class="secondary-button" href="<c:out value='${nextLots}'/>">下一页</a></c:if>
</div></div></c:otherwise></c:choose></section>
    </main>
</div>
</body></html>
