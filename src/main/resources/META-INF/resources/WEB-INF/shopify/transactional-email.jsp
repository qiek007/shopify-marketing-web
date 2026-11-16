<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ page language="java" pageEncoding="UTF-8" contentType="text/html; charset=UTF-8" %>
<!DOCTYPE html><html lang="zh-CN"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>事务邮件 - 店铺管理</title><c:set var="ctx" value="${pageContext.request.contextPath}"/>
<link rel="stylesheet" href="${ctx}/baseui/static/h-ui/css/H-ui.min.css">
<link rel="stylesheet" href="${ctx}/baseui/static/h-ui.admin/css/H-ui.admin.css">
<link rel="stylesheet" href="${ctx}/baseui/lib/font-awesome-4.7.0/css/font-awesome.min.css">
<link rel="stylesheet" href="${ctx}${uiAssetBase}/css/dashboard.css">
<style>
.transaction-settings-fieldset{min-width:0;margin:0;padding:0;border:0}
.transaction-settings-body{padding:0 24px}
.transaction-setting-group{display:grid;grid-template-columns:200px minmax(0,1fr);gap:32px;padding:22px 0;border-bottom:1px solid #edf1f3}
.transaction-setting-group:last-child{border-bottom:0;padding-bottom:26px}
.transaction-group-intro{padding-top:3px}
.transaction-group-intro h3{margin:0;font-size:15px;font-weight:600;line-height:1.5;color:#243a46}
.transaction-group-intro p{margin:7px 0 0;font-size:12px;line-height:1.75;color:#788791}
.transaction-fields{display:grid;gap:22px;align-items:start}
.transaction-delivery-fields{grid-template-columns:repeat(2,minmax(0,1fr))}
.transaction-limit-fields{grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
.transaction-field{min-width:0}
.transaction-field>label{display:block;margin:0 0 8px;color:#435563;font-size:13px;font-weight:600;line-height:1.5}
.transaction-field select,.transaction-field textarea,.transaction-field input[type=number]{box-sizing:border-box;width:100%;min-height:42px;margin:0;padding:10px 12px;border:1px solid #ced9e0;border-radius:6px;background:#fff;color:#233b48;font-family:inherit;font-size:14px;font-weight:400;line-height:1.5;outline:none;transition:border-color .15s,box-shadow .15s}
.transaction-field select{height:42px;padding-top:0;padding-bottom:0}
.transaction-field textarea{display:block;min-height:86px;resize:vertical}
.transaction-field select:focus,.transaction-field textarea:focus,.transaction-field input[type=number]:focus{border-color:#16845b;box-shadow:0 0 0 3px rgba(22,132,91,.1)}
.transaction-hint{margin:8px 0 0;font-size:12px;font-weight:400;line-height:1.65;color:#7b8993}
.transaction-number{display:flex;align-items:center;overflow:hidden;min-height:42px;border:1px solid #ced9e0;border-radius:6px;background:#fff}
.transaction-number:focus-within{border-color:#16845b;box-shadow:0 0 0 3px rgba(22,132,91,.1)}
.transaction-number input[type=number]{min-width:0;border:0;border-radius:0;background:transparent;font-variant-numeric:tabular-nums}
.transaction-number input[type=number]:focus{box-shadow:none}
.transaction-number>span{flex:0 0 auto;padding:0 12px;color:#7b8993;font-size:12px;white-space:nowrap}
.transaction-settings-fieldset:disabled select,.transaction-settings-fieldset:disabled textarea,.transaction-settings-fieldset:disabled .transaction-number{background:#f6f8fa;color:#7b8993}
.transaction-actions{display:flex;align-items:center;justify-content:space-between;gap:24px;margin:0;padding:18px 24px;border-top:1px solid #e7edef;background:#fafcfb}
.transaction-save-note{display:flex;align-items:flex-start;gap:8px;max-width:800px;margin:0;color:#71828c;font-size:12px;line-height:1.75}
.transaction-save-note>i{padding-top:4px;color:#719e8b}
.transaction-actions .primary-button{flex:0 0 auto;min-height:40px;padding:0 23px;white-space:nowrap}
.transaction-totals{display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:16px;margin:0;padding:20px 24px}
.transaction-totals>div{min-width:0;padding:15px 18px;border:1px solid #e5ece8;border-radius:7px;background:#f7faf8}
.transaction-totals span{color:#71828c;font-size:12px;line-height:1.5}
.transaction-totals strong{display:block;margin-top:7px;color:#173e36;font-size:25px;line-height:1.2;font-variant-numeric:tabular-nums}
.transaction-table-wrap{overflow:auto;padding:0 24px 22px}
.transaction-table{width:100%;border-collapse:collapse}
.transaction-table th,.transaction-table td{padding:13px 12px;text-align:left;border-bottom:1px solid #e8edf0;overflow-wrap:anywhere}
.transaction-table th{background:#f8fafb;color:#71828c;font-size:12px;font-weight:500}
.transaction-table tbody td[colspan]{padding:28px 12px;text-align:center;color:#8a979f;font-size:13px}
.transaction-message{font-family:monospace;font-size:12px}
@media(max-width:1080px){.transaction-setting-group{grid-template-columns:160px minmax(0,1fr);gap:24px}.transaction-limit-fields{gap:12px}}
@media(max-width:800px){.transaction-setting-group{grid-template-columns:1fr;gap:16px}.transaction-group-intro p{margin-top:4px}.transaction-actions{align-items:flex-start}.transaction-save-note{max-width:70%}}
@media(max-width:600px){.transaction-settings-body{padding:0 18px}.transaction-delivery-fields,.transaction-limit-fields{grid-template-columns:1fr;gap:18px}.transaction-setting-group{padding:20px 0}.transaction-actions{flex-direction:column;gap:16px;padding:16px 18px}.transaction-save-note{max-width:none}.transaction-actions .primary-button{width:100%;justify-content:center}.transaction-totals{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:18px}.transaction-totals>div{padding:13px}.transaction-table-wrap{padding:0 18px 18px}.transaction-table{min-width:650px}}
</style>
</head><body class="shopify-console"><%@ include file="fragments/header.jspf" %>
<div class="console-layout"><%@ include file="fragments/navigation.jspf" %><main class="console-main">
<c:url var="storesUrl" value="/stores"><c:param name="shop" value="${selectedShop}"/></c:url>
<section class="page-heading"><div><p class="eyebrow">店铺通信</p><h1>事务邮件</h1><p>发送验证码和邮箱验证链接，与营销邮件共用店铺额度，用量单独记录。</p></div><a class="secondary-button" href="<c:out value='${storesUrl}'/>">返回店铺管理</a></section>
<c:if test="${not empty successMessage}"><p role="status"><c:out value="${successMessage}"/></p></c:if>
<c:choose><c:when test="${!transactionalSettings.featureEnabled}"><section class="content-section"><div class="empty-state">平台尚未启用事务邮件服务，请联系平台管理员。</div></section></c:when><c:otherwise>
<section class="content-section"><div class="section-heading"><div><h2>发送设置</h2><p>自建站负责生成和校验凭证；平台负责邮件投递及用量结算。</p></div><span class="status-pill"><c:choose><c:when test="${transactionalSettings.enabled}">已启用</c:when><c:otherwise>未启用</c:otherwise></c:choose></span></div>
<c:url var="saveUrl" value="/stores/transactional-email"/>
<form method="post" action="<c:out value='${saveUrl}'/>" data-transactional-email-settings>
<input type="hidden" name="shop" value="<c:out value='${selectedShop}'/>"><input type="hidden" name="_transactionalCsrf" value="<c:out value='${transactionalEmailCsrf}'/>">
<fieldset class="transaction-settings-fieldset" ${!transactionalCanConfigure ? 'disabled' : ''}>
    <div class="transaction-settings-body">
        <section class="transaction-setting-group" aria-labelledby="transaction-delivery-heading">
            <div class="transaction-group-intro">
                <h3 id="transaction-delivery-heading">服务与通道</h3>
                <p>管理本店验证邮件的发送方式。</p>
            </div>
            <div class="transaction-fields transaction-delivery-fields">
                <div class="transaction-field">
                    <label for="transaction-enabled">事务邮件服务</label>
                    <select id="transaction-enabled" name="enabled" aria-describedby="transaction-enabled-help"><option value="false" ${!transactionalSettings.enabled ? 'selected' : ''}>关闭</option><option value="true" ${transactionalSettings.enabled ? 'selected' : ''}>启用</option></select>
                    <p class="transaction-hint" id="transaction-enabled-help">同时控制验证码和邮箱验证链接邮件。</p>
                </div>
                <div class="transaction-field">
                    <label for="transaction-provider">默认发送通道</label>
                    <select id="transaction-provider" name="defaultProvider" aria-describedby="transaction-provider-help"><c:forEach items="${transactionalChannels}" var="channel"><option value="<c:out value='${channel.provider}'/>" ${channel.provider eq transactionalSettings.defaultProvider ? 'selected' : ''}><c:out value="${providerAliases[channel.provider]}" default="${channel.provider}"/> · <c:out value="${channel.sender}"/></option></c:forEach></select>
                    <p class="transaction-hint" id="transaction-provider-help">请求未指定通道时使用此项，也可通过 API 指定其他已授权通道。</p>
                </div>
            </div>
        </section>
        <section class="transaction-setting-group" aria-labelledby="transaction-domain-heading">
            <div class="transaction-group-intro">
                <h3 id="transaction-domain-heading">验证域名</h3>
                <p>限制验证链接可以指向的网站。</p>
            </div>
            <div class="transaction-field">
                <label for="transaction-domains">允许使用的域名</label>
                <textarea id="transaction-domains" name="linkDomains" rows="3" placeholder="shop.example.com" aria-describedby="transaction-domains-help"><c:forEach items="${transactionalSettings.linkDomains}" var="domain"><c:out value="${domain}"/>&#10;</c:forEach></textarea>
                <p class="transaction-hint" id="transaction-domains-help">每行一个完整域名，仅接受这些域名的 HTTPS 链接；不填写路径或通配符。</p>
            </div>
        </section>
        <section class="transaction-setting-group" aria-labelledby="transaction-limits-heading">
            <div class="transaction-group-intro">
                <h3 id="transaction-limits-heading">发送限额</h3>
                <p>按店铺控制用量和发送频率。</p>
            </div>
            <div class="transaction-fields transaction-limit-fields">
                <div class="transaction-field">
                    <label for="transaction-daily">每日最多发送</label>
                    <div class="transaction-number"><input id="transaction-daily" type="number" name="dailyLimit" min="1" max="100000" required value="<c:out value='${transactionalSettings.dailyLimit}'/>"><span aria-hidden="true">封 / 天</span></div>
                </div>
                <div class="transaction-field">
                    <label for="transaction-minute">每分钟最多发送</label>
                    <div class="transaction-number"><input id="transaction-minute" type="number" name="minuteLimit" min="1" max="1000" required value="<c:out value='${transactionalSettings.minuteLimit}'/>"><span aria-hidden="true">封 / 分钟</span></div>
                </div>
                <div class="transaction-field">
                    <label for="transaction-interval">同一邮箱最短发送间隔</label>
                    <div class="transaction-number"><input id="transaction-interval" type="number" name="recipientIntervalSeconds" aria-label="同一邮箱最短发送间隔（秒）" min="30" max="3600" required value="<c:out value='${transactionalSettings.recipientIntervalSeconds}'/>"><span aria-hidden="true">秒</span></div>
                </div>
            </div>
        </section>
    </div>
    <div class="transaction-actions">
        <p class="transaction-save-note"><i class="fa fa-info-circle" aria-hidden="true"></i><span>使用当前店铺的发件身份。调整发件身份或新增通道后，请重新保存设置。</span></p>
        <c:if test="${transactionalCanConfigure}"><button class="primary-button" type="submit"><i class="fa fa-check" aria-hidden="true"></i>保存设置</button></c:if>
    </div>
</fieldset></form></section>
<section class="content-section spaced-section"><div class="section-heading"><div><h2>用量与发送状态</h2><p>提交发送前预留额度；结果未知时等待回执核对，不自动重发。</p></div></div>
<div class="transaction-totals"><div><span>店铺可用额度</span><strong><c:out value="${transactionalQuota.availableCount}"/></strong></div><div><span>共用额度中的全部占用</span><strong><c:out value="${transactionalQuota.reservedCount}"/></strong></div><c:forEach items="${transactionalSummary.counts}" var="count"><div><span><c:out value="${count.statusLabel}"/> · <c:out value="${count.quotaLabel}"/></span><strong><c:out value="${count.message_count}"/></strong></div></c:forEach></div>
<div class="transaction-table-wrap"><table class="transaction-table"><thead><tr><th>邮件 ID</th><th>用途</th><th>通道</th><th>状态</th><th>额度</th><th>创建时间（北京时间）</th></tr></thead><tbody><c:forEach items="${transactionalSummary.recentMessages}" var="message"><tr><td class="transaction-message"><c:out value="${message.message_id}"/></td><td><c:choose><c:when test="${message.purpose eq 'EMAIL_VERIFICATION_CODE'}">邮箱验证码</c:when><c:otherwise>邮箱验证链接</c:otherwise></c:choose></td><td><c:out value="${providerAliases[message.provider]}" default="${message.provider}"/></td><td><c:out value="${message.statusLabel}"/></td><td><c:out value="${message.quotaLabel}"/></td><td><c:out value="${message.createdAtDisplay}"/></td></tr></c:forEach><c:if test="${empty transactionalSummary.recentMessages}"><tr><td colspan="6">暂无事务邮件记录。</td></tr></c:if></tbody></table></div></section>
</c:otherwise></c:choose></main></div></body></html>
