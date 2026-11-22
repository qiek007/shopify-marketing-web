<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ page language="java" pageEncoding="UTF-8" contentType="text/html; charset=UTF-8" %>
<!DOCTYPE html><html lang="zh-CN"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>事务邮件模板 - 店铺管理</title><c:set var="ctx" value="${pageContext.request.contextPath}"/>
<link rel="stylesheet" href="${ctx}/baseui/static/h-ui/css/H-ui.min.css"><link rel="stylesheet" href="${ctx}/baseui/static/h-ui.admin/css/H-ui.admin.css">
<link rel="stylesheet" href="${ctx}${uiAssetBase}/css/dashboard.css"><link rel="stylesheet" href="${ctx}/shopify/css/transactional-templates.css">
<script src="${ctx}/shopify/js/transactional-templates.js" defer></script>
</head><body class="shopify-console"><%@ include file="fragments/header.jspf" %>
<div class="console-layout"><%@ include file="fragments/navigation.jspf" %><main class="console-main">
<c:set var="workspace" value="${transactionalTemplateWorkspace}"/><c:set var="draft" value="${workspace.draft}"/>
<c:url var="settingsUrl" value="/stores/transactional-email"><c:param name="shop" value="${selectedShop}"/></c:url>
<c:url var="templateUrl" value="/stores/transactional-email/templates"/>
<section class="page-heading template-page-heading"><div><p class="eyebrow">店铺通信 / 模板工作台</p><h1>让每封验证邮件，带上你的品牌</h1><p>分别管理验证码与验证链接的多语言内容。草稿保存后，发布才会生效。</p></div><a class="secondary-button template-back-button" href="<c:out value='${settingsUrl}'/>"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 19l-7-7 7-7M5 12h14"/></svg>返回事务邮件</a></section>
<c:choose><c:when test="${!workspace.available}"><section class="content-section"><div class="empty-state">当前服务暂不支持模板管理，请稍后再试。</div></section></c:when><c:otherwise>
<div class="template-workspace" data-template-workspace data-endpoint="<c:out value='${templateUrl}'/>" data-can-configure="<c:out value='${transactionalCanConfigure}'/>" data-revision="<c:out value='${draft.revision}'/>" data-exists="<c:out value='${draft.exists}'/>">
<section class="content-section template-toolbar" aria-label="用途与语言">
<div class="template-toolbar-main">
<form method="get" action="<c:out value='${templateUrl}'/>" data-template-selection><input type="hidden" name="shop" value="<c:out value='${selectedShop}'/>">
<div class="template-field"><label for="template-purpose">邮件用途</label><select id="template-purpose" name="purpose"><option value="CODE" ${workspace.purpose eq 'CODE' ? 'selected' : ''}>邮箱验证码</option><option value="LINK" ${workspace.purpose eq 'LINK' ? 'selected' : ''}>邮箱验证链接</option></select></div>
<div class="template-field"><label for="template-locale">已有语言</label><select id="template-locale" name="locale" required><c:forEach items="${workspace.locales}" var="locale"><option value="<c:out value='${locale}'/>" ${workspace.locale eq locale ? 'selected' : ''}><c:out value="${locale}"/></option></c:forEach></select></div>
<button class="secondary-button" type="submit">打开模板</button></form>
<c:if test="${transactionalCanConfigure}"><form method="get" action="<c:out value='${templateUrl}'/>" class="template-language-create" data-template-selection data-template-new-language><input type="hidden" name="shop" value="<c:out value='${selectedShop}'/>"><input type="hidden" name="purpose" value="<c:out value='${workspace.purpose}'/>"><div class="template-field"><label for="template-new-locale">新增语言</label><input id="template-new-locale" name="locale" required maxlength="35" spellcheck="false" placeholder="例如 ja、en-US" autocomplete="off"></div><button class="secondary-button" type="submit">新建语言模板</button></form></c:if>
<p class="template-current-context">当前编辑：<strong data-template-current-locale><c:out value="${workspace.locale}"/></strong> · <c:choose><c:when test="${workspace.purpose eq 'LINK'}">邮箱验证链接</c:when><c:otherwise>邮箱验证码</c:otherwise></c:choose></p>
<div class="template-variable-note"><strong>可用变量</strong><c:choose><c:when test="${workspace.purpose eq 'LINK'}"><code>{{verificationUrl}}</code><span>验证链接</span></c:when><c:otherwise><code>{{code}}</code><span>验证码</span><code>{{validityText}}</code><span>有效期文案（可选）</span><code>{{recipientName}}</code><span>接收人姓名（可选）</span><code>{{projectName}}</code><span>项目名称（可选）</span><code>{{description}}</code><span>描述（可选）</span></c:otherwise></c:choose><code>{{brandName}}</code><span>品牌名称（可选）</span><p>请保留本用途的验证变量；变量使用双大括号。</p><c:if test="${workspace.purpose ne 'LINK'}"><p>主题还可使用接收人姓名和项目名称；有效期文案、描述仅用于正文。新增变量由自建站提供，未提供时为空；有效期文案不改变实际过期时间。</p></c:if></div>
</div>
<div class="template-default"><span>店铺默认语言</span><strong data-default-locale><c:out value="${workspace.defaultLocale}"/></strong><c:if test="${transactionalCanConfigure}"><button class="template-text-button" type="button" data-template-default>将当前语言设为默认</button></c:if><p>请求语言无可用版本时，先使用默认语言，再使用内置模板。</p></div>
</section>
<div class="template-draft-bar"><div class="template-message" role="status" aria-live="polite" data-template-message hidden></div><c:if test="${transactionalCanConfigure}"><div class="template-draft-buttons"><button class="primary-button" type="submit" form="transactional-template-editor" data-template-save>保存草稿</button><button class="secondary-button" type="button" data-template-publish disabled>发布此草稿</button></div></c:if></div>
<c:if test="${!transactionalCanConfigure}"><p class="template-readonly">当前为只读模式，请联系店铺管理员修改模板。</p></c:if>
<div class="template-columns">
<section class="content-section template-editor-panel"><div class="section-heading"><div><h2>编辑内容</h2><p>用于本店铺的当前用途与语言。</p></div><div class="template-editor-heading-actions"><span class="template-state" data-template-state>${draft.exists ? '已保存草稿' : '新语言草稿'}</span><c:if test="${transactionalCanConfigure}"><button class="secondary-button" type="button" data-template-preview-button>预览当前内容</button></c:if></div></div>
<form id="transactional-template-editor" data-template-editor><input type="hidden" name="shop" value="<c:out value='${selectedShop}'/>"><input type="hidden" name="purpose" value="<c:out value='${workspace.purpose}'/>"><input type="hidden" name="locale" value="<c:out value='${workspace.locale}'/>"><input type="hidden" name="_transactionalTemplateCsrf" value="<c:out value='${transactionalTemplateCsrf}'/>">
<fieldset ${!transactionalCanConfigure ? 'disabled' : ''}><div class="template-editor-fields">

<div class="template-field"><label for="template-subject">邮件主题</label><input id="template-subject" name="subject" required maxlength="200" value="<c:out value='${draft.subject}'/>" placeholder="例如 {{brandName}} 邮箱验证"></div>
<div class="template-field"><label for="template-html">HTML 正文</label><textarea id="template-html" name="html" rows="13" required spellcheck="false" aria-describedby="template-html-help"><c:out value="${draft.html}"/></textarea><p id="template-html-help" class="template-hint">支持安全的邮件 HTML 与受限 HTTPS 静态资源；脚本和表单会被拒绝。安全预览不加载网络资源。</p></div>
<div class="template-field"><label for="template-text">纯文本正文</label><textarea id="template-text" name="text" rows="5" required><c:out value="${draft.text}"/></textarea><p class="template-hint">供纯文本邮件客户端使用，也请保留验证变量。</p></div>
</div></fieldset></form>
</section>
<section class="content-section template-preview-panel"><div class="section-heading"><div><h2>邮件预览</h2><p>使用示例验证码 123456 或 example.invalid 验证链接。</p></div><span class="template-preview-label">安全预览</span></div>
<div class="template-preview-subject"><span>主题</span><strong data-preview-subject>等待预览</strong></div>
<iframe title="事务邮件 HTML 预览" sandbox tabindex="0" referrerpolicy="no-referrer" data-template-preview></iframe>
<details class="template-text-preview" open><summary>纯文本版本</summary><pre data-preview-text>点击“预览当前内容”查看效果。</pre></details>
</section></div>
<section class="content-section spaced-section"><div class="section-heading"><div><h2>版本历史</h2><p>仅显示当前用途与语言。回滚会重新发布所选内容，并保留历史。</p></div><span class="template-history-count" data-history-count><c:out value="${workspace.locale}"/></span></div>
<div class="template-history-wrap"><table class="template-history"><thead><tr><th>版本</th><th>发布状态</th><th>发布人</th><th>发布时间</th><th>操作</th></tr></thead><tbody data-template-history><c:forEach items="${workspace.versions}" var="version"><tr><td>v<c:out value="${version.versionNumber}"/></td><td><c:choose><c:when test="${version.status eq 'PUBLISHED' or version.status eq 'ACTIVE'}">已发布</c:when><c:when test="${version.status eq 'FAILED'}">发布失败</c:when><c:when test="${version.status eq 'STALE'}">草稿已有更新</c:when><c:otherwise>历史版本</c:otherwise></c:choose><c:if test="${version.active}"> · 当前生效</c:if><c:if test="${not empty version.channelBindings}"><div class="template-hint"><c:out value="${version.channelBindings.size()}"/> 个发送通道已同步</div></c:if></td><td><c:out value="${version.publishedBy}"/></td><td><c:out value="${version.publishedAt}"/></td><td><c:if test="${transactionalCanConfigure and !version.active and version.status eq 'PUBLISHED'}"><button class="template-text-button" type="button" data-template-rollback="<c:out value='${version.versionId}'/>" disabled>回滚到此版本</button></c:if></td></tr></c:forEach><c:if test="${empty workspace.versions}"><tr><td colspan="5">尚无发布版本。保存并发布第一个草稿后，历史将显示在这里。</td></tr></c:if></tbody></table></div></section>
</div></c:otherwise></c:choose></main></div></body></html>
