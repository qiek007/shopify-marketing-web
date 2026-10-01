<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ page language="java" pageEncoding="UTF-8" contentType="text/html; charset=UTF-8" %>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
    <title>我的店铺 - Shopify 邮件营销</title>
    <c:set var="ctx" value="${pageContext.request.contextPath}"/>
    <link rel="stylesheet" href="${ctx}/baseui/static/h-ui/css/H-ui.min.css">
    <link rel="stylesheet" href="${ctx}/baseui/static/h-ui.admin/css/H-ui.admin.css">
    <link rel="stylesheet" href="${ctx}/baseui/lib/font-awesome-4.7.0/css/font-awesome.min.css">
    <link rel="stylesheet" href="${ctx}${uiAssetBase}/css/dashboard.css?v=20260923-store-sync">
</head>
<body class="shopify-console">
<%@ include file="fragments/header.jspf" %>
<div class="console-layout">
    <%@ include file="fragments/navigation.jspf" %>
    <main class="console-main">
        <section class="page-heading">
            <div><p class="eyebrow">我的店铺</p><h1><c:out value="${selectedShopDisplayName}" default="店铺状态"/></h1></div>
        </section>
        <c:if test="${not empty successMessage}"><div class="flash-message success"><i class="fa fa-check-circle"></i><c:out value="${successMessage}"/></div></c:if>
        <c:if test="${not empty errorMessage}"><div class="flash-message danger"><i class="fa fa-exclamation-circle"></i><c:out value="${errorMessage}"/></div></c:if>
        <section class="content-section">
            <c:choose>
                <c:when test="${empty currentStore}">
                    <div class="empty-state"><i class="fa fa-chain-broken"></i><strong>尚未获得店铺授权</strong><span>请联系平台管理员完成店铺连接和成员授权。</span></div>
                </c:when>
                <c:otherwise>
                    <div class="table-wrap"><table class="status-table wide-table"><thead><tr><th>店铺</th><th>连接</th><th>商品</th><th>客户</th><th>订单</th><th>安装时间</th><th>最近同步</th></tr></thead><tbody><tr>
                        <td><strong><c:out value="${currentStore.shopDomain}"/></strong><span class="cell-note"><c:out value="${currentStore.grantedScopes}" default="未记录授权范围"/></span></td>
                        <td><span class="status-pill"><c:out value="${currentStore.status}"/></span></td>
                        <td><span class="sync-state"><c:out value="${currentStore.productsStatus}" default="未同步"/></span></td>
                        <td><span class="sync-state"><c:out value="${currentStore.customersStatus}" default="未同步"/></span></td>
                        <td><span class="sync-state"><c:out value="${currentStore.ordersStatus}" default="未同步"/></span></td>
                        <td><time data-browser-time="<c:out value='${currentStore.installedAt}'/>" datetime="<c:out value='${currentStore.installedAt}'/>"><c:out value="${currentStore.installedAt}" default="-"/></time></td>
                        <td><div class="store-sync-cell"><time data-browser-time="<c:out value='${currentStore.lastSyncedAt}'/>" datetime="<c:out value='${currentStore.lastSyncedAt}'/>"><c:out value="${currentStore.lastSyncedAt}" default="尚未同步"/></time><c:if test="${canConfigureSender && shopifyStore}"><form method="post" action="${ctx}/stores/sync" onsubmit="var b=this.querySelector('button');b.disabled=true;b.innerHTML='<i class=&quot;fa fa-spinner fa-spin&quot;></i><span>同步中</span>';"><input type="hidden" name="shop" value="${selectedShop}"><button class="action-button" type="submit"><i class="fa fa-refresh"></i><span>手动同步</span></button></form></c:if></div></td>
                    </tr></tbody></table></div>
                    <c:if test="${not empty currentStore.lastError}"><div class="system-notice danger" role="alert"><i class="fa fa-exclamation-circle"></i><div><strong>最近同步异常</strong><span><c:out value="${currentStore.lastError}"/></span></div></div></c:if>
                </c:otherwise>
            </c:choose>
        </section>
        <c:if test="${not empty selectedShop}">
            <c:if test="${shopifyStore}">
            <c:url var="pixelStatusUrl" value="/stores/web-pixel/status"><c:param name="shop" value="${selectedShop}"/></c:url>
            <c:url var="reauthorizeUrl" value="/shopify/install"><c:param name="shop" value="${selectedShop}"/></c:url>
            <section class="content-section spaced-section" data-store-pixel-status
                     data-status-url="${pixelStatusUrl}" data-can-configure="${canConfigureSender}"
                     data-can-reauthorize="${canManageStoreLifecycle}">
                <div class="section-heading"><div><h2>客户行为采集</h2><p>通过 Shopify Web Pixel 采集浏览、商品查看、搜索、加购与结账事件</p></div><div class="section-heading-actions"><span class="status-pill neutral" data-pixel-state>加载中</span><div class="pixel-heading-actions" data-pixel-actions hidden><a class="primary-button" href="${reauthorizeUrl}" data-pixel-reauthorize hidden><i class="fa fa-refresh"></i><span>重新授权 Shopify</span></a><form method="post" action="${ctx}/stores/web-pixel/enable" data-pixel-enable hidden><input type="hidden" name="shop" value="${selectedShop}"><button class="primary-button" type="submit"><i class="fa fa-plug"></i><span data-pixel-submit-label>启用客户行为采集</span></button></form></div></div></div>
                <div class="system-notice" data-pixel-notice><i class="fa fa-spinner fa-spin" data-pixel-icon></i><div><strong data-pixel-message>正在读取客户行为采集状态</strong><span data-pixel-id hidden></span></div></div>
            </section>
            </c:if>
            <c:if test="${canConfigureStore}">
                <%@ include file="fragments/store-ga4-connection.jspf" %>
            </c:if>
            <section class="content-section spaced-section">
                <details class="store-sender-details">
                <summary class="section-heading"><div><h2>店铺发件设置</h2><p>每个邮件通道独立使用当前店铺自己的发件域、发件邮箱和回复邮箱</p></div><div class="section-heading-actions"><span class="section-count">已启用 <c:out value="${emailProviders.size()}"/> 个通道</span><span class="store-sender-toggle" aria-hidden="true"><i class="fa fa-chevron-down"></i></span></div></summary>
                <div class="sender-profile-grid">
                    <c:if test="${empty emailProviders}"><div class="empty-state compact sender-profile-empty"><i class="fa fa-envelope-o"></i><strong>当前店铺尚未启用邮件通道</strong><span>请联系平台管理员为该店铺授权邮件通道后再配置发件信息。</span></div></c:if>
                    <c:forEach items="${emailProviders}" var="providerOption"><c:set var="provider" value="${providerOption.provider}"/>
                        <c:remove var="channelSetting"/>
                        <c:forEach items="${senderSettings}" var="setting"><c:if test="${setting.provider eq provider}"><c:set var="channelSetting" value="${setting}"/></c:if></c:forEach>
                        <article class="sender-profile" data-sender-provider="${provider}">
                            <div class="sender-profile-heading"><div><span>邮件通道</span><strong><c:out value="${providerOption.displayAlias}"/></strong></div><span class="status-pill ${empty channelSetting ? 'neutral' : ''}">${empty channelSetting ? '待配置' : '已配置'}</span></div>
                            <c:choose><c:when test="${canConfigureSender}">
                                <form class="workspace-form" method="post" action="${ctx}/stores/sender-settings">
                                    <input type="hidden" name="shop" value="${selectedShop}"><input type="hidden" name="provider" value="${provider}">
                                    <div class="form-grid"><label><span>发件域（由平台管理员配置）</span><input value="<c:out value='${channelSetting.sendingDomain}'/>" placeholder="尚未配置" readonly></label><label><span>发件名称</span><input name="fromName" value="<c:out value='${channelSetting.fromName}'/>" placeholder="品牌名称" required></label></div>
                                    <div class="form-grid"><label><span>发件邮箱</span><input name="fromEmail" type="email" value="<c:out value='${channelSetting.fromEmail}'/>" placeholder="marketing@example.com" required></label><label><span>回复邮箱</span><input name="replyToEmail" type="email" value="<c:out value='${channelSetting.replyToEmail}'/>" placeholder="support@example.com" required></label></div>
                                    <div class="form-actions"><button class="primary-button" type="submit"><i class="fa fa-save"></i><span>保存 <c:out value="${providerOption.displayAlias}"/> 设置</span></button></div>
                                </form>
                            </c:when><c:when test="${not empty channelSetting}">
                                <div class="detail-grid"><div><span>发件域</span><strong><c:out value="${channelSetting.sendingDomain}"/></strong></div><div><span>发件身份</span><strong><c:out value="${channelSetting.fromHeader}"/></strong></div><div><span>回复邮箱</span><strong><c:out value="${channelSetting.replyToEmail}"/></strong></div></div>
                            </c:when><c:otherwise><div class="empty-state compact"><i class="fa fa-envelope-o"></i><strong>尚未配置</strong><span>请联系店铺 Owner 或 Admin 完成该通道设置。</span></div></c:otherwise></c:choose>
                        </article>
                    </c:forEach>
                </div>
                </details>
            </section>
            <section class="content-section spaced-section">
                <details class="store-member-details" data-management-department-bound="${managementDepartmentBound}">
                <summary class="section-heading"><div><h2>店铺成员</h2><p><c:out value="${selectedShop}"/> · 管理机构 <c:out value="${managementDepartmentName}" default="未绑定"/> · 我的角色 <span class="shop-role"><c:out value="${currentShopRole}"/></span></p></div><div class="section-heading-actions"><span class="section-count"><c:out value="${shopUsers.size()}"/> 人</span><span class="store-member-toggle" aria-hidden="true"><i class="fa fa-chevron-down"></i></span></div></summary>
                <c:if test="${canManageAccess}">
                    <c:choose><c:when test="${not managementDepartmentBound}"><div class="system-notice"><i class="fa fa-sitemap"></i><div><strong>尚未绑定管理机构</strong><p>请联系平台管理员绑定管理机构后再添加成员。</p></div></div></c:when><c:otherwise>
                    <form class="workspace-form store-member-grant-form" method="post" action="${ctx}/stores/members/grant" data-store-member-grant>
                        <input type="hidden" name="shop" value="${selectedShop}">
                        <input type="hidden" name="targetUserId" data-center-user-id required>
                        <input type="hidden" name="targetUserName" data-center-user-name>
                        <div class="form-grid store-member-grant-grid">
                            <div class="store-member-picker-field"><span>中心组织成员</span><button class="secondary-button" type="button" data-center-user-picker><i class="fa fa-sitemap"></i><span>从组织机构选择</span></button><small data-center-user-selection>尚未选择成员</small></div>
                            <label><span>店铺角色</span><select name="role" required><c:if test="${canManageOwners}"><option value="OWNER">OWNER</option></c:if><option value="ADMIN">ADMIN</option><option value="MARKETER" selected>MARKETER</option><option value="ANALYST">ANALYST</option></select></label>
                            <div class="form-actions"><button class="primary-button" type="submit"><i class="fa fa-user-plus"></i><span>添加成员</span></button></div>
                        </div>
                    </form>
                    </c:otherwise></c:choose>
                </c:if>
                <c:choose><c:when test="${empty shopUsers}"><div class="empty-state"><i class="fa fa-users"></i><strong>暂无成员信息</strong><span>请由 Owner 或 Admin 添加店铺成员。</span></div></c:when><c:otherwise>
                    <div class="table-wrap"><table class="status-table"><thead><tr><th>用户</th><th>中心用户 ID</th><th>角色</th><th>授权时间</th><c:if test="${canManageAccess}"><th>操作</th></c:if></tr></thead><tbody>
                    <c:forEach items="${shopUsers}" var="member"><tr><td><strong><c:out value="${member.platformUserName}" default="未设置名称"/></strong></td><td><c:out value="${member.platformUserId}"/></td><td><span class="status-pill neutral"><c:out value="${member.role}"/></span></td><td><time data-browser-time="<c:out value='${member.grantedAt}'/>" datetime="<c:out value='${member.grantedAt}'/>"><c:out value="${member.grantedAt}"/></time></td><c:if test="${canManageAccess}"><td><c:choose><c:when test="${member.platformUserId eq logineduser.id}"><span class="cell-note">当前用户</span></c:when><c:when test="${member.role eq 'OWNER' and not canManageOwners}"><span class="cell-note">仅 OWNER 可管理</span></c:when><c:otherwise><div class="table-actions"><button class="action-button" type="button" data-member-role-open data-user-id="<c:out value='${member.platformUserId}'/>" data-user-name="<c:out value='${member.platformUserName}'/>" data-role="<c:out value='${member.role}'/>"><i class="fa fa-pencil"></i><span>修改角色</span></button><form method="post" action="${ctx}/stores/members/revoke" onsubmit="return confirm('确认移除该店铺成员？')"><input type="hidden" name="shop" value="${selectedShop}"><input type="hidden" name="targetUserId" value="${member.platformUserId}"><button class="action-button danger-action" type="submit"><i class="fa fa-user-times"></i><span>移除成员</span></button></form></div></c:otherwise></c:choose></td></c:if></tr></c:forEach>
                    </tbody></table></div>
                </c:otherwise></c:choose>
                </details>
            </section>
            <c:url var="centerUserPickerUrl" value="/org/selectorgs"><c:param name="type" value="s"/><c:param name="appid" value="${logineduser.applicationid}"/><c:param name="department" value="${managementDepartmentId}"/><c:param name="sysgroup" value="0"/><c:param name="aclgroup" value="0"/></c:url>
            <span hidden data-center-user-picker-config data-url="<c:out value='${centerUserPickerUrl}'/>"></span>
            <dialog id="store-member-role-dialog" class="campaign-send-dialog store-member-role-dialog" aria-labelledby="store-member-role-title">
                <div class="campaign-send-dialog-icon"><i class="fa fa-user"></i></div>
                <div><h2 id="store-member-role-title">修改成员角色</h2><p>为 <strong data-member-role-user-name></strong> 选择新的店铺角色。</p></div>
                <form method="post" action="${ctx}/stores/members/grant" data-member-role-form>
                    <input type="hidden" name="shop" value="${selectedShop}">
                    <input type="hidden" name="targetUserId" data-member-role-user-id>
                    <input type="hidden" name="targetUserName" data-member-role-user-name-input>
                    <label><span>店铺角色</span><select name="role" required data-member-role-select><c:if test="${canManageOwners}"><option value="OWNER">OWNER</option></c:if><option value="ADMIN">ADMIN</option><option value="MARKETER">MARKETER</option><option value="ANALYST">ANALYST</option></select></label>
                    <div class="campaign-send-dialog-actions"><button class="action-button" type="button" data-member-role-close>取消</button><button class="primary-button" type="submit" data-member-role-confirm><i class="fa fa-check"></i><span>确定</span></button></div>
                </form>
            </dialog>
        </c:if>
<script src="${ctx}/baseui/lib/jquery/3.6.1/jquery.min.js"></script>
<script src="${ctx}/baseui/lib/layer/2.4/layer.js"></script>
<script src="${ctx}/shopify/js/store-members.js?v=20261001-role-dialog"></script>
<script>
    (function () {
        var panel = document.querySelector('[data-store-pixel-status]');
        if (!panel) return;
        var state = panel.querySelector('[data-pixel-state]');
        var notice = panel.querySelector('[data-pixel-notice]');
        var icon = panel.querySelector('[data-pixel-icon]');
        var message = panel.querySelector('[data-pixel-message]');
        var pixelId = panel.querySelector('[data-pixel-id]');
        var actions = panel.querySelector('[data-pixel-actions]');
        var reauthorize = panel.querySelector('[data-pixel-reauthorize]');
        var enable = panel.querySelector('[data-pixel-enable]');
        var submitLabel = panel.querySelector('[data-pixel-submit-label]');
        var canReauthorize = panel.dataset.canReauthorize === 'true';
        var pixelStatusCacheTtlMs = 60 * 60 * 1000;
        var pixelStatusCacheKey = 'shopify-web-pixel-status:' + panel.dataset.statusUrl;

        function readPixelStatusCache() {
            try {
                var raw = window.localStorage.getItem(pixelStatusCacheKey);
                if (!raw) return null;
                var entry = JSON.parse(raw);
                if (!entry || typeof entry.savedAt !== 'number'
                        || Date.now() - entry.savedAt > pixelStatusCacheTtlMs
                        || !entry.status) {
                    window.localStorage.removeItem(pixelStatusCacheKey);
                    return null;
                }
                return entry.status;
            } catch (ignored) {
                return null;
            }
        }

        function writePixelStatusCache(result) {
            if (!result || !result.state || result.state === 'UNAVAILABLE') return;
            try {
                window.localStorage.setItem(pixelStatusCacheKey, JSON.stringify({
                    savedAt: Date.now(),
                    status: {
                        state: result.state,
                        message: result.message || '',
                        pixelId: result.pixelId || ''
                    }
                }));
            } catch (ignored) {
                // Storage can be unavailable in private or restricted browser contexts.
            }
        }

        function clearPixelStatusCache() {
            try {
                window.localStorage.removeItem(pixelStatusCacheKey);
            } catch (ignored) {
                // A storage failure must not block enabling or reauthorizing the pixel.
            }
        }

        function renderPixelStatus(result) {
            var current = result.state || 'UNAVAILABLE';
            state.textContent = current;
            state.classList.toggle('neutral', current !== 'ENABLED');
            notice.classList.toggle('danger', current === 'UNAVAILABLE');
            icon.className = current === 'ENABLED' ? 'fa fa-line-chart' : 'fa fa-info-circle';
            message.textContent = result.message || '客户行为采集状态暂不可用';
            pixelId.textContent = result.pixelId || '';
            pixelId.hidden = !result.pixelId;
            if (panel.dataset.canConfigure === 'true') {
                actions.hidden = false;
                reauthorize.hidden = !canReauthorize || current !== 'REAUTHORIZATION_REQUIRED';
                enable.hidden = current === 'REAUTHORIZATION_REQUIRED';
                if (submitLabel) submitLabel.textContent = current === 'ENABLED'
                        ? '更新采集配置' : '启用客户行为采集';
            }
        }

        function renderPixelStatusUnavailable() {
            state.textContent = 'UNAVAILABLE';
            message.textContent = '客户行为采集状态读取失败，请稍后刷新';
            notice.classList.add('danger');
            icon.className = 'fa fa-exclamation-circle';
        }

        var cachedStatus = readPixelStatusCache();
        if (cachedStatus) renderPixelStatus(cachedStatus);
        if (enable) enable.addEventListener('submit', clearPixelStatusCache);
        if (reauthorize) reauthorize.addEventListener('click', clearPixelStatusCache);

        fetch(panel.dataset.statusUrl, {
            credentials: 'same-origin', cache: 'no-store',
            headers: { Accept: 'application/json' }
        }).then(function (response) {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.json();
        }).then(function (result) {
            writePixelStatusCache(result);
            renderPixelStatus(result);
        }).catch(function () {
            if (!cachedStatus) renderPixelStatusUnavailable();
        });
    }());
</script>
    </main>
</div>
</body></html>
