<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ page language="java" pageEncoding="UTF-8" contentType="text/html; charset=UTF-8" %>
<!DOCTYPE html><html lang="zh-CN"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>邮件模板 - Shopify 邮件营销</title><c:set var="ctx" value="${pageContext.request.contextPath}"/>
<link rel="stylesheet" href="${ctx}/baseui/static/h-ui/css/H-ui.min.css"><link rel="stylesheet" href="${ctx}/baseui/static/h-ui.admin/css/H-ui.admin.css"><link rel="stylesheet" href="${ctx}/baseui/lib/font-awesome-4.7.0/css/font-awesome.min.css"><link rel="stylesheet" href="${ctx}${uiAssetBase}/css/dashboard.css?v=20260918-template-collapse">
</head><body class="shopify-console"><%@ include file="fragments/header.jspf" %><div class="console-layout"><%@ include file="fragments/navigation.jspf" %>
<main class="console-main"><section class="page-heading"><div><p class="eyebrow">邮件模板</p></div></section>
<c:if test="${not empty successMessage}"><div class="flash-message success"><i class="fa fa-check-circle"></i><c:out value="${successMessage}"/></div></c:if><c:if test="${not empty errorMessage}"><div class="flash-message danger"><i class="fa fa-exclamation-circle"></i><c:out value="${errorMessage}"/></div></c:if>
<c:url var="platformCatalogUrl" value="/templates/platform/catalog"><c:param name="shop" value="${selectedShop}"/></c:url>
<section class="content-section" data-platform-template-catalog data-catalog-url="${platformCatalogUrl}"><details class="platform-template-details"><summary class="section-heading"><div><h2>平台通用模板</h2><p>复制后成为当前店铺的独立模板，可继续编辑并覆盖同步</p></div><div class="section-heading-actions"><span class="section-count" data-platform-template-count hidden></span><span class="platform-template-toggle" aria-hidden="true"><i class="fa fa-chevron-down"></i></span></div></summary><div data-platform-template-results><div class="async-loading"><i class="fa fa-spinner fa-spin"></i><strong>正在加载平台模板</strong></div></div></details></section>
<dialog id="platform-template-preview-dialog" class="template-preview-dialog" aria-labelledby="platform-template-preview-title">
    <div class="template-preview-heading"><div><p class="eyebrow">平台通用模板</p><h2 id="platform-template-preview-title">模板预览</h2><p id="platform-template-preview-meta" class="cell-note"></p></div><button class="icon-button dialog-close-button" type="button" title="关闭" aria-label="关闭" data-platform-preview-close><i class="fa fa-times"></i></button></div>
    <div class="template-preview-body"><div class="template-preview-summary"><strong id="platform-template-preview-subject"></strong><div id="platform-template-preview-variables" class="template-preview-variables"></div></div><div id="platform-template-preview-error" class="template-preview-error" role="alert" hidden><span id="platform-template-preview-error-text"></span><button class="action-button" type="button" data-platform-preview-retry hidden><i class="fa fa-refresh"></i><span>重试</span></button></div><iframe id="platform-template-preview-frame" title="邮件 HTML 预览" sandbox="" referrerpolicy="no-referrer"></iframe><details class="template-preview-text"><summary>查看纯文本内容</summary><pre id="platform-template-preview-text"></pre></details></div>
</dialog>
<section class="content-section spaced-section">
    <div class="section-heading"><div><h2>店铺模板</h2><p>使用可视化编辑器创建并管理当前店铺的邮件模板</p></div><div class="section-heading-actions"><span class="section-count"><c:out value="${templatePage.total}"/> 个</span><c:if test="${not empty selectedShop and canManageCampaigns}"><a class="primary-button" href="${ctx}/templates/editor?shop=${selectedShop}"><i class="fa fa-plus"></i><span>新建模板</span></a></c:if></div></div>
    <c:choose>
        <c:when test="${empty selectedShop}"><div class="empty-state"><i class="fa fa-lock"></i><strong>没有可用店铺</strong><span>连接店铺或由店铺 Owner 授权后即可创建模板。</span></div></c:when>
        <c:when test="${empty templates}"><div class="empty-state"><i class="fa fa-file-text-o"></i><strong>还没有模板</strong><span>发布第一个模板后即可创建营销活动。</span></div></c:when>
        <c:otherwise><div class="table-wrap"><table class="status-table"><thead><tr><th>名称</th><th>主题</th><th>同步</th><th>状态</th><th>更新时间</th><th>操作</th></tr></thead><tbody>
        <c:forEach items="${templates}" var="template"><tr>
            <td><strong><c:out value="${template.name}"/></strong></td>
            <td><c:out value="${template.subject}"/></td>
            <c:url var="syncBindingsUrl" value="/templates/bindings"><c:param name="shop" value="${selectedShop}"/><c:param name="templateId" value="${template.templateId}"/></c:url>
            <td><button class="sync-summary-button" type="button" data-sync-dialog-open="template-sync-${template.templateId}" data-sync-bindings-url="${syncBindingsUrl}"><span class="status-pill neutral" data-sync-summary>同步详情</span><span class="cell-note" data-sync-count hidden style="display: none;">点击查看</span></button>
                <dialog class="sync-detail-dialog" id="template-sync-${template.templateId}">
                    <div class="sync-dialog-heading"><div><h2>同步详情</h2><p><c:out value="${template.name}"/></p></div><button class="icon-button dialog-close-button" type="button" title="关闭" aria-label="关闭" data-sync-dialog-close><i class="fa fa-times"></i></button></div>
                    <div data-sync-dialog-body><div class="async-loading"><i class="fa fa-spinner fa-spin"></i><strong>打开后加载同步状态</strong></div></div>
                </dialog>
            </td>
            <td><span class="status-pill"><c:out value="${template.statusDisplayName}"/></span></td>
            <td><time data-browser-time="<c:out value='${template.updatedAt}'/>" data-browser-time-format="date-time" datetime="<c:out value='${template.updatedAt}'/>"><c:out value="${template.updatedAt}"/></time></td>
            <td><div class="table-actions"><button class="action-button" type="button" data-shop-template-preview data-shop-template-id="${template.templateId}"><i class="fa fa-eye"></i><span>预览</span></button><c:if test="${canManageCampaigns}"><a class="action-button" href="${ctx}/templates/editor?shop=${selectedShop}&amp;templateId=${template.templateId}"><i class="fa fa-pencil"></i><span>编辑模板</span></a><c:if test="${template.status eq 'PUBLISHED'}"><form method="post" action="${ctx}/templates/action" onsubmit="return confirm('禁用后将从全部邮件通道删除该动态模板，确认继续？')"><input type="hidden" name="shop" value="${selectedShop}"><input type="hidden" name="templateId" value="${template.templateId}"><input type="hidden" name="action" value="disable"><button class="action-button" type="submit"><i class="fa fa-ban"></i><span>禁用</span></button></form></c:if><form method="post" action="${ctx}/templates/action" onsubmit="return confirm('删除后将从全部邮件通道清理，且不可恢复，确认继续？')"><input type="hidden" name="shop" value="${selectedShop}"><input type="hidden" name="templateId" value="${template.templateId}"><input type="hidden" name="action" value="delete"><button class="action-button danger-action" type="submit"><i class="fa fa-trash-o"></i><span>删除</span></button></form></c:if></div></td>
        </tr></c:forEach>
        </tbody></table></div></c:otherwise>
    </c:choose>
    <c:if test="${templatePage.totalPages gt 0}"><div class="pagination-bar"><c:if test="${templatePage.hasPrevious}"><a class="secondary-button" href="${ctx}/templates?shop=${selectedShop}&amp;page=${templatePage.page - 1}"><i class="fa fa-angle-left"></i>上一页</a></c:if><span>共 <c:out value="${templatePage.total}"/> 个模板，每页 10 个，第 <c:out value="${templatePage.page}"/> / <c:out value="${templatePage.totalPages}"/> 页</span><c:if test="${templatePage.hasNext}"><a class="secondary-button" href="${ctx}/templates?shop=${selectedShop}&amp;page=${templatePage.page + 1}">下一页<i class="fa fa-angle-right"></i></a></c:if></div></c:if>
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
    document.querySelectorAll('[data-sync-dialog-open]').forEach(function (button) {
        button.addEventListener('click', function () {
            var dialog = document.getElementById(button.dataset.syncDialogOpen);
            if (dialog && typeof dialog.showModal === 'function') dialog.showModal();
            var syncDialogLoaded = button.dataset.syncLoaded === 'true';
            if (syncDialogLoaded || button.dataset.syncLoading === 'true' || !dialog) return;
            var body = dialog.querySelector('[data-sync-dialog-body]');
            if (!body) return;
            button.dataset.syncLoading = 'true';
            body.innerHTML = '<div class="async-loading"><i class="fa fa-spinner fa-spin"></i><strong>正在加载同步状态</strong></div>';
            fetch(button.dataset.syncBindingsUrl, {
                credentials: 'same-origin', headers: { Accept: 'text/html' }
            }).then(function (response) {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.text();
            }).then(function (html) {
                body.innerHTML = html;
                var metadata = body.querySelector('[data-template-sync-summary]');
                if (metadata) {
                    var summary = button.querySelector('[data-sync-summary]');
                    var count = button.querySelector('[data-sync-count]');
                    if (summary) {
                        summary.className = 'status-pill ' + metadata.dataset.templateSyncClass;
                        summary.textContent = metadata.dataset.templateSyncSummary;
                    }
                    if (count) count.textContent = metadata.dataset.templateSyncCount + ' 个通道';
                }
                button.dataset.syncLoaded = 'true';
            }).catch(function () {
                body.innerHTML = '<div class="empty-state compact"><strong>同步状态加载失败</strong><span>关闭后可重新打开重试。</span></div>';
            }).finally(function () {
                button.dataset.syncLoading = 'false';
            });
        });
    });
    document.querySelectorAll('[data-sync-dialog-close]').forEach(function (button) {
        button.addEventListener('click', function () { button.closest('dialog').close(); });
    });
    var previewDialog = document.getElementById('platform-template-preview-dialog');
    var previewFrame = document.getElementById('platform-template-preview-frame');
    var previewSubject = document.getElementById('platform-template-preview-subject');
    var previewText = document.getElementById('platform-template-preview-text');
    var previewMeta = document.getElementById('platform-template-preview-meta');
    var previewVariables = document.getElementById('platform-template-preview-variables');
    var previewError = document.getElementById('platform-template-preview-error');
    var previewErrorText = document.getElementById('platform-template-preview-error-text');
    var previewRetry = document.querySelector('[data-platform-preview-retry]');
    var activePreviewButton;
    function loadPreview(button) {
        activePreviewButton = button;
        var isShopTemplate = button.hasAttribute('data-shop-template-preview');
        var query = new URLSearchParams({ shop: '${fn:escapeXml(selectedShop)}' });
        var endpoint = '${ctx}/templates/platform/preview';
        if (isShopTemplate) {
            endpoint = '${ctx}/templates/preview';
            query.set('templateId', button.dataset.shopTemplateId);
        } else {
            query.set('platformTemplateId', button.dataset.platformTemplateId);
            query.set('version', button.dataset.platformTemplateVersion);
        }
        previewSubject.textContent = '正在加载模板...';
        previewMeta.textContent = '';
        previewVariables.textContent = '';
        previewText.textContent = '';
        previewError.hidden = true;
        previewErrorText.textContent = '';
        previewRetry.hidden = true;
        if (previewDialog && typeof previewDialog.showModal === 'function' && !previewDialog.open) previewDialog.showModal();
        previewFrame.srcdoc = '<p style="font:14px sans-serif;color:#68757d;padding:24px">正在加载...</p>';
        var controller = new AbortController();
        var timeoutId = window.setTimeout(function () { controller.abort(); }, 12000);
        fetch(endpoint + '?' + query.toString(), {
            credentials: 'same-origin',
            cache: 'no-store',
            redirect: 'manual',
            signal: controller.signal,
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
        })
            .then(function (response) {
                var contentType = response.headers.get('content-type') || '';
                if (response.type === 'opaqueredirect' || response.status === 401 || response.status === 403
                        || response.status === 302) {
                    throw new Error('登录状态已失效，请重新登录后重试');
                }
                return response.text().then(function (body) {
                    var payload = null;
                    try { payload = body ? JSON.parse(body) : null; } catch (ignored) { }
                    if (!response.ok) {
                        throw new Error((payload && (payload.message || payload.error))
                                || '模板加载失败（HTTP ' + response.status + '）');
                    }
                    if (contentType.indexOf('application/json') === -1 || !payload) {
                        throw new Error('模板服务返回了无法识别的内容');
                    }
                    return payload;
                });
            })
            .then(function (template) {
                previewError.hidden = true;
                previewRetry.hidden = true;
                previewSubject.textContent = template.subjectTemplate || template.subject || '无主题';
                previewMeta.textContent = isShopTemplate
                        ? '店铺模板 · ' + (template.name || '')
                        : (template.category || '通用') + ' · v' + template.version + ' · ' + template.name;
                previewText.textContent = template.textTemplate || template.text || '暂无纯文本版本';
                previewVariables.textContent = '';
                (template.variables || []).forEach(function (variable) {
                    var item = document.createElement('span');
                    item.className = 'variable-chip';
                    item.textContent = '{{' + variable + '}}';
                    previewVariables.appendChild(item);
                });
                previewFrame.srcdoc = template.htmlTemplate || template.html || '<p style="font:14px sans-serif;color:#68757d;padding:24px">暂无 HTML 内容</p>';
            })
            .catch(function (error) {
                previewSubject.textContent = '模板加载失败';
                previewErrorText.textContent = error.name === 'AbortError'
                        ? '模板加载超时，请稍后重试。'
                        : (error.message || '暂时无法加载模板，请稍后重试。');
                previewError.hidden = false;
                previewRetry.hidden = false;
                previewFrame.srcdoc = '<p style="font:14px sans-serif;color:#b42318;padding:24px">暂时无法加载模板，请稍后重试。</p>';
            })
            .finally(function () {
                window.clearTimeout(timeoutId);
            });
    }
    if (platformCatalog) platformCatalog.addEventListener('click', function (event) {
        var button = event.target.closest('[data-platform-preview]');
        if (button) loadPreview(button);
    });
    document.querySelectorAll('[data-shop-template-preview]').forEach(function (button) {
        button.addEventListener('click', function () { loadPreview(button); });
    });
    if (previewRetry) previewRetry.addEventListener('click', function () {
        if (activePreviewButton) loadPreview(activePreviewButton);
    });
    document.querySelectorAll('[data-platform-preview-close]').forEach(function (button) {
        button.addEventListener('click', function () { button.closest('dialog').close(); });
    });
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
</main></div>
</body></html>
