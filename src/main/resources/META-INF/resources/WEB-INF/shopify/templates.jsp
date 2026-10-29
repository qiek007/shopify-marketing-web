<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ page language="java" pageEncoding="UTF-8" contentType="text/html; charset=UTF-8" %>
<!DOCTYPE html><html lang="zh-CN"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>邮件模板 - Shopify 邮件营销</title><c:set var="ctx" value="${pageContext.request.contextPath}"/>
<link rel="stylesheet" href="${ctx}/baseui/static/h-ui/css/H-ui.min.css"><link rel="stylesheet" href="${ctx}/baseui/static/h-ui.admin/css/H-ui.admin.css"><link rel="stylesheet" href="${ctx}/baseui/lib/font-awesome-4.7.0/css/font-awesome.min.css"><link rel="stylesheet" href="${ctx}${uiAssetBase}/css/dashboard.css?v=20261020-template-list-actions">
</head><body class="shopify-console"><%@ include file="fragments/header.jspf" %><div class="console-layout"><%@ include file="fragments/navigation.jspf" %>
<main class="console-main">
<link rel="stylesheet" href="${ctx}/shopify/css/template-versions.css?v=20261029-versions">
<style data-template-sync-dialog-styles>
    .template-sync-dialog.sync-detail-dialog { box-sizing: border-box; padding: 20px; }
    .template-sync-dialog > .sync-dialog-heading { display: flex; align-items: center; min-height: 32px; margin-bottom: 16px; padding-right: 44px; }
    .template-sync-dialog .sync-dialog-heading > .dialog-close-button { top: 0; right: 0; }
    .template-sync-dialog > [data-sync-dialog-body] { overflow-x: auto; }
</style>
<section class="page-heading"><div><p class="eyebrow">邮件模板</p></div></section>
<c:if test="${not empty successMessage}"><div class="flash-message success"><i class="fa fa-check-circle"></i><c:out value="${successMessage}"/></div></c:if><c:if test="${not empty errorMessage}"><div class="flash-message danger"><i class="fa fa-exclamation-circle"></i><c:out value="${errorMessage}"/></div></c:if>
<c:url var="platformCatalogUrl" value="/templates/platform/catalog"><c:param name="shop" value="${selectedShop}"/></c:url>
<section class="content-section" data-platform-template-catalog data-catalog-url="${platformCatalogUrl}"><details class="platform-template-details"><summary class="section-heading"><div><h2>平台通用模板</h2><p>复制后成为当前店铺的独立模板，可继续编辑并覆盖同步</p></div><div class="section-heading-actions"><span class="section-count" data-platform-template-count hidden></span><span class="platform-template-toggle" aria-hidden="true"><i class="fa fa-chevron-down"></i></span></div></summary><div data-platform-template-results><div class="async-loading"><i class="fa fa-spinner fa-spin"></i><strong>正在加载平台模板</strong></div></div></details></section>
<%@ include file="fragments/template-preview.jspf" %>
<section class="content-section spaced-section">
    <div class="section-heading"><div><h2>店铺模板</h2><p>使用可视化编辑器创建并管理当前店铺的邮件模板</p></div><div class="section-heading-actions"><span class="section-count"><c:out value="${templatePage.total}"/> 个</span><c:if test="${not empty selectedShop and canManageCampaigns}"><a class="primary-button" href="${ctx}/templates/editor?shop=${selectedShop}"><i class="fa fa-plus"></i><span>新建模板</span></a></c:if></div></div>
<form class="filter-form list-filter-form" method="get" action="${ctx}/templates"><input type="hidden" name="shop" value="${selectedShop}"><input type="hidden" name="page" value="1"><label><span>模板名称</span><input type="text" name="name" value="<c:out value='${templateNameFilter}'/>" placeholder="支持模糊查询"></label><label><span>邮件主题</span><input type="text" name="subject" value="<c:out value='${templateSubjectFilter}'/>" placeholder="支持模糊查询"></label><label><span>更新时间从</span><input type="date" name="updatedFrom" value="<c:out value='${templateUpdatedFrom}'/>"></label><label><span>更新时间至</span><input type="date" name="updatedTo" value="<c:out value='${templateUpdatedTo}'/>"></label><div class="form-actions"><button class="action-button" type="submit"><i class="fa fa-search"></i>查询</button><a class="secondary-button clear-filter-button" href="${ctx}/templates?shop=${selectedShop}"><i class="fa fa-eraser"></i><span>清空条件</span></a></div></form>
    <c:choose>
        <c:when test="${empty selectedShop}"><div class="empty-state"><i class="fa fa-lock"></i><strong>没有可用店铺</strong><span>连接店铺或由店铺 Owner 授权后即可创建模板。</span></div></c:when>
        <c:when test="${empty templates}"><div class="empty-state"><i class="fa fa-file-text-o"></i><strong>还没有模板</strong><span>可先保存模板草稿，同步到通道后即可创建营销活动。</span></div></c:when>
        <c:otherwise><div class="table-wrap"><table class="status-table template-list-table template-version-list"><thead><tr><th>名称</th><th>主题</th><th>同步状态</th><th>编辑状态</th><th>发布状态</th><th>更新时间</th><th>操作</th></tr></thead><tbody>
        <c:forEach items="${templates}" var="template"><tr>
            <td><strong><c:out value="${template.name}"/></strong></td>
            <td class="template-subject-cell" title="<c:out value="${template.subject}"/>"><c:out value="${template.subject}"/></td>
            <c:url var="syncBindingsUrl" value="/templates/bindings"><c:param name="shop" value="${selectedShop}"/><c:param name="templateId" value="${template.templateId}"/></c:url>
            <td><button class="sync-summary-button" type="button" data-sync-dialog-open="template-sync-${template.templateId}" data-sync-bindings-url="${syncBindingsUrl}"><span class="status-pill neutral" data-sync-summary>同步详情</span><span class="cell-note" data-sync-count hidden style="display: none;">点击查看</span></button>
                <dialog class="sync-detail-dialog template-sync-dialog" id="template-sync-${template.templateId}">
                    <div class="sync-dialog-heading"><div><h2>同步详情</h2></div><button class="icon-button dialog-close-button" type="button" title="关闭" aria-label="关闭" data-sync-dialog-close><i class="fa fa-times"></i></button></div>
                    <div data-sync-dialog-body><div class="async-loading"><i class="fa fa-spinner fa-spin"></i><strong>打开后加载同步状态</strong></div></div>
                </dialog>
            </td>
            <td class="template-editing-state"><span class="status-pill neutral"><c:choose><c:when test="${template.hasDraft and template.publishedAvailable}">有未同步草稿</c:when><c:when test="${not template.publishedAvailable}">尚未发布</c:when><c:otherwise>与已发布一致</c:otherwise></c:choose></span></td>
            <td><span class="status-pill ${template.status eq 'DISABLED' ? 'blocked' : (template.status eq 'DRAFT' ? 'neutral' : '')}"><c:choose><c:when test="${template.status eq 'DISABLED'}"><i class="fa fa-ban"></i> 已禁用</c:when><c:otherwise><c:out value="${template.statusDisplayName}"/></c:otherwise></c:choose></span></td>
            <td><time data-browser-time="<c:out value='${template.updatedAt}'/>" data-browser-time-format="date-time" datetime="<c:out value='${template.updatedAt}'/>"><c:out value="${template.updatedAt}"/></time></td>
            <td><div class="table-actions template-list-actions"><button class="action-button" type="button" data-shop-template-preview data-shop-template-id="<c:out value='${template.templateId}'/>" data-shop-template-version="WORKING"><i class="fa fa-eye" aria-hidden="true"></i><span><c:choose><c:when test="${template.hasDraft}">预览草稿</c:when><c:otherwise>预览当前</c:otherwise></c:choose></span></button><c:if test="${template.hasDraft and template.publishedAvailable}"><button class="action-button" type="button" data-shop-template-preview data-shop-template-id="<c:out value='${template.templateId}'/>" data-shop-template-version="PUBLISHED"><i class="fa fa-check-circle-o" aria-hidden="true"></i><span>预览已发布</span></button></c:if><c:if test="${canManageCampaigns}"><a class="action-button" href="${ctx}/templates/editor?shop=${selectedShop}&amp;templateId=${template.templateId}"><i class="fa fa-pencil"></i><span>编辑模板</span></a><a class="action-button" href="${ctx}/templates/editor?shop=${selectedShop}&amp;copyFrom=${template.templateId}"><i class="fa fa-copy"></i><span>复制</span></a></c:if></div></td>
        </tr></c:forEach>
        </tbody></table></div></c:otherwise>
    </c:choose>
    <c:url var="templatePreviousUrl" value="/templates"><c:param name="shop" value="${selectedShop}"/><c:param name="page" value="${templatePage.page - 1}"/><c:param name="name" value="${templateNameFilter}"/><c:param name="subject" value="${templateSubjectFilter}"/><c:param name="updatedFrom" value="${templateUpdatedFrom}"/><c:param name="updatedTo" value="${templateUpdatedTo}"/></c:url><c:url var="templateNextUrl" value="/templates"><c:param name="shop" value="${selectedShop}"/><c:param name="page" value="${templatePage.page + 1}"/><c:param name="name" value="${templateNameFilter}"/><c:param name="subject" value="${templateSubjectFilter}"/><c:param name="updatedFrom" value="${templateUpdatedFrom}"/><c:param name="updatedTo" value="${templateUpdatedTo}"/></c:url><c:if test="${templatePage.totalPages gt 0}"><div class="pagination-bar"><c:if test="${templatePage.hasPrevious}"><a class="secondary-button" href="${templatePreviousUrl}"><i class="fa fa-angle-left"></i>上一页</a></c:if><span>共 <c:out value="${templatePage.total}"/> 个模板，每页 10 个，第 <c:out value="${templatePage.page}"/> / <c:out value="${templatePage.totalPages}"/> 页</span><c:if test="${templatePage.hasNext}"><a class="secondary-button" href="${templateNextUrl}">下一页<i class="fa fa-angle-right"></i></a></c:if></div></c:if>
</section>
<script id="template-catalog-page-script">
(function () {
    var platformCatalog = document.querySelector('[data-platform-template-catalog]');
    var platformCatalogResults = platformCatalog
            ? platformCatalog.querySelector('[data-platform-template-results]') : null;
    var platformCatalogCount = platformCatalog
            ? platformCatalog.querySelector('[data-platform-template-count]') : null;
    var platformCatalogDetails = platformCatalog
            ? platformCatalog.querySelector('.platform-template-details') : null;
    var platformCatalogLoaded = false;
    var platformCatalogLoading = false;
    function loadPlatformCatalog() {
        if (!platformCatalog || !platformCatalogResults || !platformCatalog.dataset.catalogUrl) return;
        if (platformCatalogLoaded || platformCatalogLoading) return;
        platformCatalogLoading = true;
        fetch(platformCatalog.dataset.catalogUrl, {
            credentials: 'same-origin', headers: { Accept: 'text/html' }
        }).then(function (response) {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.text();
        }).then(function (html) {
            platformCatalogResults.innerHTML = html;
            var total = platformCatalogResults.querySelector('[data-platform-template-total]');
            if (platformCatalogCount && total) {
                platformCatalogCount.textContent = total.dataset.platformTemplateTotal + ' 个';
                platformCatalogCount.hidden = false;
            }
            platformCatalogLoaded = true;
        }).catch(function () {
            if (platformCatalogCount) {
                platformCatalogCount.textContent = '加载失败';
                platformCatalogCount.hidden = false;
            }
            platformCatalogResults.innerHTML = '<div class="empty-state"><i class="fa fa-cloud-download"></i><strong>平台模板加载失败</strong><span>店铺模板不受影响，可稍后刷新重试。</span></div>';
        }).finally(function () {
            platformCatalogLoading = false;
        });
    }
    if (platformCatalog) platformCatalog.addEventListener('submit', function (event) {
            var form = event.target.closest('[data-platform-copy-form]');
            if (!form) return;
            var button = form.querySelector('button[type="submit"]');
            if (!button) return;
            button.disabled = true;
            button.setAttribute('aria-busy', 'true');
            var label = button.querySelector('span');
            if (label) label.textContent = '正在复制';
    });
    if (platformCatalogDetails) platformCatalogDetails.addEventListener('toggle', function () {
        if (platformCatalogDetails.open) loadPlatformCatalog();
    });
}());
</script>
<script src="${ctx}/shopify/js/template-version-preview.js?v=20261029-versions"></script><script src="${ctx}/shopify/js/template-sync-details.js?v=20261029-versions"></script>
</main></div>
</body></html>
