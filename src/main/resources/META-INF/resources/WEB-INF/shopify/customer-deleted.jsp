<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html><html lang="zh-CN"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>已删除客户 - 滴答营销</title><c:set var="ctx" value="${pageContext.request.contextPath}"/>
<link rel="stylesheet" href="${ctx}/baseui/static/h-ui/css/H-ui.min.css">
<link rel="stylesheet" href="${ctx}/baseui/static/h-ui.admin/css/H-ui.admin.css">
<link rel="stylesheet" href="${ctx}/baseui/lib/font-awesome-4.7.0/css/font-awesome.min.css">
<link rel="stylesheet" href="${ctx}${uiAssetBase}/css/dashboard.css?v=20260925-p124">
</head><body><%@ include file="fragments/header.jspf" %>
<div class="console-layout"><%@ include file="fragments/navigation.jspf" %><main class="console-main">
<section class="page-heading"><div><p class="eyebrow">客户管理 / 已删除客户</p></div></section>
<section class="content-section" data-deleted-customers data-embedded-workspace="${sharedEmbeddedWorkspace}">
 <div class="section-heading"><div><h2>已删除客户</h2><p>恢复后接续原有档案和历史，退订、投诉和退信抑制保持不变。</p></div><div class="section-heading-actions"><span class="section-count">共 <span data-deleted-count><c:out value="${deletedCustomerPage.totalElements}"/></span> 位</span><c:url var="activeCustomers" value="/customers"><c:param name="shop" value="${selectedShop}"/></c:url><a class="secondary-button compact" href="<c:out value='${activeCustomers}'/>">返回客户列表</a></div></div>
 <form class="workspace-form" method="get" action="${ctx}/customers/deleted"><input type="hidden" name="shop" value="<c:out value='${selectedShop}'/>"><label><span>姓名、邮箱或客户 ID</span><input name="q" maxlength="255" value="<c:out value='${search}'/>" placeholder="搜索已删除客户"></label><div class="form-actions"><button class="secondary-button" type="submit">查询 / 刷新</button></div></form>
 <div class="customer-tag-feedback" data-restore-feedback role="status" hidden></div>
 <div class="table-wrap"><table class="status-table"><thead><tr><th>客户</th><th>邮箱</th><th>来源</th><th>删除时间</th><th>操作</th></tr></thead><tbody>
 <c:forEach items="${deletedCustomerPage.rows}" var="row"><tr data-deleted-row><td><strong><c:out value="${row.name}" default="未命名客户"/></strong><span class="row-subtitle"><c:out value="${row.customerId}"/></span></td><td><c:out value="${row.email}"/></td><td><c:choose><c:when test="${row.sourceType eq 'SHOPIFY'}">店铺同步</c:when><c:otherwise>导入</c:otherwise></c:choose></td><td><time data-browser-time="<c:out value='${row.deletedAt}'/>"><c:out value="${row.deletedAt}"/></time></td><td>
  <form method="post" action="${ctx}/customers/restore" data-customer-restore><input type="hidden" name="shop" value="<c:out value='${selectedShop}'/>"><input type="hidden" name="sourceType" value="<c:out value='${row.sourceType}'/>"><input type="hidden" name="customerId" value="<c:out value='${row.customerId}'/>"><input type="hidden" name="deletionToken" value="<c:out value='${row.deletionToken}'/>"><input type="hidden" name="confirm" value="RESTORE_CUSTOMER"><button type="submit" class="secondary-button compact">恢复客户</button></form>
 </td></tr></c:forEach>
 </tbody></table></div>
 <div class="empty-state" data-deleted-empty <c:if test="${not empty deletedCustomerPage.rows}">hidden</c:if>>当前页没有已删除客户。</div>
 <nav class="pagination" aria-label="已删除客户分页"><span>第 <c:out value="${deletedCustomerPage.pageNumber}"/> / <c:out value="${deletedCustomerPage.totalPages}"/> 页</span>
 <c:if test="${deletedCustomerPage.pageNumber gt 1}"><c:url var="deletedPrevious" value="/customers/deleted"><c:param name="shop" value="${selectedShop}"/><c:param name="q" value="${search}"/><c:param name="page" value="${deletedCustomerPage.pageNumber-1}"/></c:url><a class="secondary-button compact" href="<c:out value='${deletedPrevious}'/>">上一页</a></c:if>
 <c:if test="${deletedCustomerPage.pageNumber lt deletedCustomerPage.totalPages}"><c:url var="deletedNext" value="/customers/deleted"><c:param name="shop" value="${selectedShop}"/><c:param name="q" value="${search}"/><c:param name="page" value="${deletedCustomerPage.pageNumber+1}"/></c:url><a class="secondary-button compact" href="<c:out value='${deletedNext}'/>">下一页</a></c:if></nav>
</section></main></div>
<script src="${ctx}/shopify/js/customer-restore.js?v=20261123-soft-delete"></script>
</body></html>
