<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ page language="java" pageEncoding="UTF-8" contentType="text/html; charset=UTF-8" %>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>营销活动 - Shopify 邮件营销</title>
<c:set var="ctx" value="${pageContext.request.contextPath}"/>
<c:url var="campaignRefreshUrl" value="/campaigns/detail">
    <c:param name="shop" value="${campaignDetail.shopDomain}"/>
    <c:param name="campaignId" value="${campaignDetail.campaignId}"/>
</c:url>
<c:url var="campaignProgressUrl" value="/campaigns/detail/progress">
    <c:param name="shop" value="${campaignDetail.shopDomain}"/>
    <c:param name="campaignId" value="${campaignDetail.campaignId}"/>
</c:url>
<c:url var="campaignRecipientsUrl" value="/campaigns/detail/recipients"/>
<c:url var="campaignRecipientExportsUrl" value="/campaigns/detail/recipients/exports">
    <c:param name="shop" value="${campaignDetail.shopDomain}"/>
    <c:param name="campaignId" value="${campaignDetail.campaignId}"/>
</c:url>
    <link rel="stylesheet" href="${ctx}/baseui/static/h-ui/css/H-ui.min.css">
    <link rel="stylesheet" href="${ctx}/baseui/static/h-ui.admin/css/H-ui.admin.css">
    <link rel="stylesheet" href="${ctx}/baseui/lib/font-awesome-4.7.0/css/font-awesome.min.css">
    <link rel="stylesheet" href="${ctx}${uiAssetBase}/css/dashboard.css?v=20261004-recipient-export-v3">
</head>
<body class="shopify-console">
<%@ include file="fragments/header.jspf" %>
<div class="console-layout">
    <%@ include file="fragments/navigation.jspf" %>
    <main class="console-main">
        <a class="back-link" href="${ctx}/campaigns?shop=${campaignDetail.shopDomain}">
            <i class="fa fa-arrow-left"></i> 返回活动列表
        </a>
        <section class="page-heading campaign-detail-heading">
            <div>
                <h1><c:out value="${campaignDetail.name}"/></h1>
            </div>
            <span id="campaign-current-status" class="status-pill neutral"><c:out value="${campaignDetail.status}"/></span>
        </section>

        <c:if test="${not empty successMessage}"><div class="flash-message success"><i class="fa fa-check-circle"></i><c:out value="${successMessage}"/></div></c:if>
        <c:if test="${not empty errorMessage}"><div class="flash-message danger"><i class="fa fa-exclamation-circle"></i><c:out value="${errorMessage}"/></div></c:if>

        <section class="campaign-command-bar">
            <div>
                <strong>审批与执行</strong>
                <span>批准后系统冻结受众，完成后可立即发送或设定发送时间。</span>
            </div>
            <div class="campaign-actions">
                <c:if test="${campaignDetail.status eq 'DRAFT' && canManageCampaigns}">
                    <form method="post" action="${ctx}/campaigns/action">
                        <input type="hidden" name="shop" value="${campaignDetail.shopDomain}">
                        <input type="hidden" name="campaignId" value="${campaignDetail.campaignId}">
                        <input type="hidden" name="action" value="SUBMIT">
                        <button class="primary-button" type="submit"><i class="fa fa-paper-plane-o"></i>提交审批</button>
                    </form>
                </c:if>
                <c:if test="${campaignDetail.status eq 'DRAFT' or campaignDetail.status eq 'PENDING_APPROVAL'}">
                    <a class="action-button" href="${ctx}/campaigns/editor?shop=${campaignDetail.shopDomain}&amp;campaignId=${campaignDetail.campaignId}"><i class="fa fa-pencil"></i>编辑活动</a>
                </c:if>
                <c:if test="${canManageCampaigns && (campaignDetail.status eq 'DRAFT' or campaignDetail.status eq 'PENDING_APPROVAL' or campaignDetail.status eq 'APPROVED')}">
                    <a class="action-button" href="${ctx}/campaigns/editor?shop=${campaignDetail.shopDomain}&amp;campaignId=${campaignDetail.campaignId}#campaign-test-send"><i class="fa fa-flask"></i>发送测试邮件</a>
                </c:if>
                <c:if test="${campaignDetail.pendingApproval}">
                    <form method="post" action="${ctx}/campaigns/action">
                        <input type="hidden" name="shop" value="${campaignDetail.shopDomain}">
                        <input type="hidden" name="campaignId" value="${campaignDetail.campaignId}">
                        <input type="hidden" name="action" value="APPROVE">
                        <button class="primary-button" type="submit"><i class="fa fa-check"></i>批准</button>
                    </form>
                    <form class="reject-form" method="post" action="${ctx}/campaigns/action">
                        <input type="hidden" name="shop" value="${campaignDetail.shopDomain}">
                        <input type="hidden" name="campaignId" value="${campaignDetail.campaignId}">
                        <input type="hidden" name="action" value="REJECT">
                        <input name="reason" required maxlength="500" placeholder="填写驳回原因">
                        <button class="action-button danger-text" type="submit"><i class="fa fa-times"></i>驳回</button>
                    </form>
                </c:if>
                <a id="campaign-detail-refresh" class="action-button" href="${campaignRefreshUrl}"
                   data-progress-url="${campaignProgressUrl}"><i class="fa fa-refresh"></i>刷新执行数据</a>
                <c:if test="${canManageCampaigns && (campaignDetail.status eq 'QUEUED' or campaignDetail.status eq 'RUNNING')}">
                    <form method="post" action="${ctx}/campaigns/action" data-campaign-active-control>
                        <input type="hidden" name="shop" value="${campaignDetail.shopDomain}">
                        <input type="hidden" name="campaignId" value="${campaignDetail.campaignId}">
                        <input type="hidden" name="action" value="PAUSE">
                        <button class="action-button" type="submit"><i class="fa fa-pause"></i>暂停发送</button>
                    </form>
                </c:if>
                <c:if test="${canManageCampaigns && campaignDetail.status eq 'PAUSED'}">
                    <form method="post" action="${ctx}/campaigns/action">
                        <input type="hidden" name="shop" value="${campaignDetail.shopDomain}">
                        <input type="hidden" name="campaignId" value="${campaignDetail.campaignId}">
                        <input type="hidden" name="action" value="RESUME">
                        <button class="primary-button" type="submit"><i class="fa fa-play"></i>继续发送</button>
                    </form>
                </c:if>
                <c:if test="${canManageCampaigns && (campaignDetail.status eq 'PREPARING' or campaignDetail.status eq 'QUEUED' or campaignDetail.status eq 'RUNNING' or campaignDetail.status eq 'PAUSED')}">
                    <form method="post" action="${ctx}/campaigns/action" data-campaign-active-control
                          onsubmit="return confirm('确认取消这个活动？已经提交给邮件通道的邮件无法撤回，尚未提交的邮件将不再发送。');">
                        <input type="hidden" name="shop" value="${campaignDetail.shopDomain}">
                        <input type="hidden" name="campaignId" value="${campaignDetail.campaignId}">
                        <input type="hidden" name="action" value="CANCEL">
                        <button class="action-button danger-text" type="submit"><i class="fa fa-ban"></i>取消发送</button>
                    </form>
                </c:if>
                <c:if test="${canManageCampaigns}">
                    <form id="campaign-send-form" class="campaign-send-form" method="post" action="${ctx}/campaigns/action" data-campaign-send-gate="sendable"<c:if test="${not campaignDetail.sendable}"> hidden</c:if>>
                        <input type="hidden" name="shop" value="${campaignDetail.shopDomain}">
                        <input type="hidden" name="campaignId" value="${campaignDetail.campaignId}">
                        <input type="hidden" name="action" value="SEND">
                        <label id="campaign-send-confirmation" class="campaign-send-confirmation"<c:if test="${campaignDetail.confirmationRequiredCount le 0}"> hidden</c:if>>
                            <input id="campaign-send-confirmation-input" type="checkbox" name="confirmNotSubscribed" value="true"<c:if test="${campaignDetail.confirmationRequiredCount gt 0}"> required</c:if>>
                            我已确认向 <span id="campaign-confirmation-count"><c:out value="${campaignDetail.confirmationRequiredCount}"/></span> 位尚未明确订阅的客户发送
                        </label>
                        <button id="campaign-send-open" class="primary-button" type="button"><i class="fa fa-paper-plane"></i>立即发送</button>
                    </form>
                    <button id="campaign-schedule-open" class="action-button" type="button"
                            data-campaign-schedule-gate="open"<c:if test="${not (campaignDetail.sendable or campaignDetail.status eq 'SCHEDULED')}"> hidden</c:if>>
                        <i class="fa fa-clock-o"></i> <span id="campaign-schedule-open-label"><c:choose><c:when test="${campaignDetail.status eq 'SCHEDULED'}">修改定时</c:when><c:otherwise>定时发送</c:otherwise></c:choose></span>
                    </button>
                    <form method="post" action="${ctx}/campaigns/action" data-campaign-schedule-gate="cancel"<c:if test="${campaignDetail.status ne 'SCHEDULED'}"> hidden</c:if>
                          onsubmit="return confirm('确认取消定时？活动将回到已批准状态，不会自动发送。');">
                        <input type="hidden" name="shop" value="${campaignDetail.shopDomain}">
                        <input type="hidden" name="campaignId" value="${campaignDetail.campaignId}">
                        <input type="hidden" name="action" value="CANCEL_SCHEDULE">
                        <button class="action-button danger-text" type="submit"><i class="fa fa-times-circle"></i>取消定时</button>
                    </form>
                    <button class="primary-button" type="button" disabled title="冻结完成后才允许发送" data-campaign-send-gate="waiting"<c:if test="${not (campaignDetail.status eq 'APPROVED' && not campaignDetail.audienceReady)}"> hidden</c:if>><i class="fa fa-spinner fa-spin"></i>冻结完成前不可发送</button>
                </c:if>
                <c:if test="${campaignDetail.status eq 'APPROVED' && campaignDetail.audienceReady && campaignDetail.summary.audience eq 0}">
                    <form method="post" action="${ctx}/campaigns/action"
                          onsubmit="return confirm('将按当前分群和最新客户资格重新生成受众，活动需要重新审批。是否继续？');">
                        <input type="hidden" name="shop" value="${campaignDetail.shopDomain}">
                        <input type="hidden" name="campaignId" value="${campaignDetail.campaignId}">
                        <input type="hidden" name="action" value="REFRESH_AUDIENCE">
                        <button class="primary-button" type="submit"><i class="fa fa-refresh"></i>重新生成受众</button>
                    </form>
                </c:if>
                <c:if test="${campaignDetail.deletable}">
                    <form method="post" action="${ctx}/campaigns/action" onsubmit="return confirm('确认删除这个尚未发送的活动？');">
                        <input type="hidden" name="shop" value="${campaignDetail.shopDomain}">
                        <input type="hidden" name="campaignId" value="${campaignDetail.campaignId}">
                        <input type="hidden" name="action" value="DELETE">
                        <button class="action-button danger-text" type="submit"><i class="fa fa-trash"></i>删除活动</button>
                    </form>
                </c:if>
            </div>
        </section>

        <section class="campaign-policy-strip" aria-label="当前活动发送设置">
            <div><i class="fa fa-filter"></i><span>客户分群</span><strong><c:out value="${campaignDetail.segmentName}"/></strong></div>
            <div><i class="fa fa-file-text-o"></i><span>邮件模板</span><strong><c:out value="${campaignDetail.templateName}"/></strong></div>
            <div><i class="fa fa-envelope-o"></i><span>发送通道</span><strong><c:forEach items="${campaignDetail.providers}" var="provider" varStatus="status"><c:if test="${not status.first}">、</c:if><c:out value="${providerAliases[provider]}"/></c:forEach></strong></div>
            <div><i class="fa fa-clock-o"></i><span>重复发送间隔</span><strong><c:choose><c:when test="${campaignDetail.repeatIntervalHours == 0}">不限制</c:when><c:otherwise><c:out value="${campaignDetail.repeatIntervalHours}"/> 小时</c:otherwise></c:choose></strong></div>
            <div><i class="fa fa-database"></i><span>热数据保留</span><strong><c:out value="${campaignDetail.hotRetentionDays}"/> 天</strong></div>
            <div><i class="fa fa-users"></i><span>冻结状态</span><strong id="campaign-snapshot-status"><c:out value="${campaignDetail.snapshotStatusDisplayName}"/></strong></div>
        </section>

        <c:if test="${canManageCampaigns}">
            <dialog id="campaign-send-dialog" class="campaign-send-dialog" aria-labelledby="campaign-send-dialog-title">
                <div class="campaign-send-dialog-icon"><i class="fa fa-paper-plane"></i></div>
                <div>
                    <h2 id="campaign-send-dialog-title">确认发送</h2>
                    <p>将向当前冻结的 <strong id="campaign-send-audience"><c:out value="${campaignDetail.summary.audience}"/></strong> 位受众创建发送任务。任务开始后不能修改受众、模板或发送通道。</p>
                </div>
                <div class="campaign-send-dialog-actions">
                    <button id="campaign-send-cancel" class="action-button" type="button">取消</button>
                    <button class="primary-button" type="submit" form="campaign-send-form"><i class="fa fa-paper-plane"></i>确认发送</button>
                </div>
            </dialog>
            <dialog id="campaign-schedule-dialog" class="campaign-send-dialog campaign-schedule-dialog" aria-labelledby="campaign-schedule-dialog-title">
                <div class="campaign-send-dialog-icon"><i class="fa fa-clock-o"></i></div>
                <div>
                    <h2 id="campaign-schedule-dialog-title">定时发送</h2>
                    <p>到达设定时间后，系统会向当前冻结受众自动创建发送任务。开始执行前可修改或取消定时。</p>
                </div>
                <form id="campaign-schedule-form" method="post" action="${ctx}/campaigns/action">
                    <input type="hidden" name="shop" value="${campaignDetail.shopDomain}">
                    <input type="hidden" name="campaignId" value="${campaignDetail.campaignId}">
                    <input id="campaign-schedule-action" type="hidden" name="action" value="${campaignDetail.status eq 'SCHEDULED' ? 'RESCHEDULE' : 'SCHEDULE'}">
                    <input id="campaign-schedule-instant" type="hidden" name="scheduledAt">
                    <label class="campaign-schedule-field" for="campaign-schedule-local">发送日期和时间
                        <input id="campaign-schedule-local" type="datetime-local" required step="60">
                    </label>
                    <p id="campaign-schedule-timezone" class="campaign-schedule-timezone"></p>
                    <label id="campaign-schedule-confirmation" class="campaign-send-confirmation"<c:if test="${campaignDetail.confirmationRequiredCount le 0}"> hidden</c:if>>
                        <input id="campaign-schedule-confirmation-input" type="checkbox" name="confirmNotSubscribed" value="true"<c:if test="${campaignDetail.confirmationRequiredCount gt 0}"> required</c:if>>
                        我已确认向 <span id="campaign-schedule-confirmation-count"><c:out value="${campaignDetail.confirmationRequiredCount}"/></span> 位尚未明确订阅的客户发送
                    </label>
                    <div class="campaign-send-dialog-actions">
                        <button id="campaign-schedule-close" class="action-button" type="button">返回</button>
                        <button class="primary-button" type="submit"><i class="fa fa-clock-o"></i>保存定时</button>
                    </div>
                </form>
            </dialog>
        </c:if>

        <div id="campaign-schedule-notice" class="system-notice campaign-schedule-notice"
             data-campaign-schedule-gate="notice"<c:if test="${campaignDetail.status ne 'SCHEDULED'}"> hidden</c:if>>
            <i class="fa fa-clock-o"></i><div><strong>已设定定时发送</strong>
                <time id="campaign-schedule-time" data-browser-time="<c:out value='${campaignDetail.scheduledAt}'/>"
                      data-scheduled-at="<c:out value='${campaignDetail.scheduledAt}'/>"
                      datetime="<c:out value='${campaignDetail.scheduledAt}'/>"><c:out value="${campaignDetail.scheduledAt}"/></time>
                <span id="campaign-schedule-error" class="campaign-schedule-error"<c:if test="${empty campaignDetail.scheduleErrorSummary}"> hidden</c:if>><c:out value="${campaignDetail.scheduleErrorSummary}"/></span>
            </div>
        </div>

        <div class="system-notice campaign-consent-warning" data-campaign-send-gate="consent"<c:if test="${not (campaignDetail.confirmationRequiredCount gt 0 && campaignDetail.sendable)}"> hidden</c:if>><i class="fa fa-exclamation-triangle"></i><div><strong>发送前需要额外确认</strong><span>冻结受众中有 <span id="campaign-consent-count"><c:out value="${campaignDetail.confirmationRequiredCount}"/></span> 位客户尚未明确订阅邮件营销，但未退订且不在抑制名单。勾选确认后才会创建发送任务。</span></div></div>

        <div class="system-notice campaign-snapshot-progress" data-campaign-send-gate="waiting"<c:if test="${not (campaignDetail.status eq 'APPROVED' && not campaignDetail.audienceReady)}"> hidden</c:if>><i class="fa fa-spinner fa-spin"></i><div><strong>冻结受众计算中，暂不可发送</strong><span id="campaign-snapshot-progress-note">已检查 <c:out value="${campaignDetail.snapshotProcessedCount}"/> 条候选记录，当前冻结 <c:out value="${campaignDetail.summary.audience}"/> 位客户。页面会自动刷新，也可点击“刷新执行数据”。</span></div></div>

        <c:if test="${campaignDetail.audienceReady && campaignDetail.summary.audience eq 0}">
            <div class="system-notice campaign-zero-audience"><i class="fa fa-exclamation-triangle"></i><div><strong>冻结受众为空，不能发送</strong><span>当前分群或客户资格已经变化时，可重新生成受众；新受众生成后需要再次审批。</span></div></div>
        </c:if>

        <section class="campaign-kpi-grid">
            <article><span>冻结受众</span><strong id="campaign-audience"><c:out value="${campaignDetail.summary.audience}"/></strong><small id="campaign-audience-note"><c:choose><c:when test="${campaignDetail.audienceReady}">审批后已固化</c:when><c:otherwise>已检查 <c:out value="${campaignDetail.snapshotProcessedCount}"/> 条候选记录</c:otherwise></c:choose></small></article>
            <article><span>发送处理</span><strong id="campaign-send-progress"><c:out value="${campaignDetail.summary.progressPercent}"/>%</strong><small id="campaign-send-note"><c:out value="${campaignDetail.summary.accepted}"/> 接受 / <c:out value="${campaignDetail.summary.failed}"/> 失败</small></article>
            <article><span>送达</span><strong id="campaign-delivered"><c:out value="${campaignDetail.summary.delivered}"/></strong><small id="campaign-delivery-note">打开 <c:out value="${campaignDetail.summary.openedRecipients}"/> 人 / <c:out value="${campaignDetail.summary.opened}"/> 次 · 点击 <c:out value="${campaignDetail.summary.clickedRecipients}"/> 人 / <c:out value="${campaignDetail.summary.clicked}"/> 次</small></article>
            <article><span>转化</span><strong id="campaign-orders"><c:out value="${campaignDetail.summary.orders}"/> 单</strong><small id="campaign-conversion-note"><c:out value="${campaignDetail.summary.convertedRecipients}"/> 位客户 · <c:out value="${campaignDetail.summary.netRevenue}"/></small></article>
            <article><span>风险反馈</span><strong id="campaign-risk"><c:out value="${campaignDetail.summary.bounced + campaignDetail.summary.complained + campaignDetail.summary.unsubscribed}"/></strong><small>退信 / 投诉 / 退订</small></article>
        </section>

        <section id="ga4-campaign-evaluation" class="content-section ga4-campaign-evaluation">
            <div class="section-heading">
                <div>
                    <h2>GA4 活动级购买评估</h2>
                    <p>按当前活动配置的 UTM 参数和活动 ID 汇总</p>
                </div>
                <span class="status-pill neutral"><c:out value="${campaignDetail.ga4Evaluation.statusDisplayName}"/></span>
            </div>
            <div class="ga4-utm-parameters" aria-label="当前活动 UTM 配置">
                <div><span>UTM 来源</span><code><c:out value="${campaignDetail.utmSource}"/></code></div>
                <div><span>UTM 媒介</span><code><c:out value="${campaignDetail.utmMedium}"/></code></div>
                <div><span>UTM 活动</span><code><c:out value="${campaignDetail.utmCampaign}"/></code></div>
                <div><span>UTM 内容</span><code><c:out value="${campaignDetail.utmContentDisplayName}"/></code></div>
            </div>
            <c:choose>
                <c:when test="${campaignDetail.ga4Evaluation.showMetrics}">
                    <c:if test="${not empty campaignDetail.ga4Evaluation.healthMessage}">
                        <p class="form-hint"><c:out value="${campaignDetail.ga4Evaluation.healthMessage}"/></p>
                    </c:if>
                    <div class="campaign-kpi-grid ga4-campaign-kpis">
                        <article><span>GA4 购买次数</span><strong><c:out value="${campaignDetail.ga4Evaluation.purchaseCountDisplay}"/></strong><small>活动级评估</small></article>
                        <article><span>GA4 购买收入</span><strong><c:out value="${campaignDetail.ga4Evaluation.purchaseRevenueDisplay}"/> <c:out value="${campaignDetail.ga4Evaluation.currency}"/></strong><small>GA4 报告口径</small></article>
                        <article><span>最后同步</span><strong class="ga4-sync-time"><time data-browser-time="<c:out value='${campaignDetail.ga4Evaluation.lastSyncedAt}'/>" datetime="<c:out value='${campaignDetail.ga4Evaluation.lastSyncedAt}'/>"><c:out value="${campaignDetail.ga4Evaluation.lastSyncedAt}"/></time></strong><small><c:out value="${campaignDetail.ga4Evaluation.reportingAttributionModel}"/></small></article>
                    </div>
                </c:when>
                <c:otherwise>
                    <div class="empty-state compact">
                        <i class="fa fa-line-chart"></i>
                        <strong><c:out value="${campaignDetail.ga4Evaluation.statusDisplayName}"/></strong>
                        <span><c:out value="${campaignDetail.ga4Evaluation.statusMessage}"/></span>
                    </div>
                </c:otherwise>
            </c:choose>
            <p class="form-hint">该指标独立于 Shopify 订单归因；订单、付款和退款仍以 Shopify 数据为准。</p>
        </section>

        <div class="campaign-detail-grid">
            <section class="content-section campaign-preview-panel">
                <div class="campaign-subject"><strong><c:out value="${campaignPreview.subject}"/></strong></div>
                <iframe id="campaign-preview-frame" title="活动邮件正文" sandbox src="about:blank"
                        data-preview-src="${ctx}/campaigns/preview?shop=${campaignDetail.shopDomain}&amp;campaignId=${campaignDetail.campaignId}"></iframe>
            </section>
            <section class="content-section">
                <div class="section-heading"><div><h2>发送任务</h2><p>邮件发送服务的任务处理进度</p></div></div>
                <div id="campaign-job-list" aria-live="polite"><c:choose><c:when test="${empty campaignDetail.jobs}"><div class="empty-state compact"><i class="fa fa-clock-o"></i><strong>尚未创建发送任务</strong><span>活动批准后执行发送才会产生任务。</span></div></c:when><c:otherwise>
                    <div class="job-list"><c:forEach items="${campaignDetail.jobs}" var="job"><article><div><strong><c:out value="${providerAliases[job.provider]}"/> · <c:out value="${job.status}"/></strong><span><c:out value="${job.jobId}"/></span></div><div class="job-progress"><span style="width:${job.progressPercent}%"></span></div><small><c:out value="${job.processed}"/> / <c:out value="${job.total}"/> · 失败 <c:out value="${job.failed}"/></small></article></c:forEach></div>
                </c:otherwise></c:choose></div>
            </section>
        </div>

        <section class="content-section spaced-section">
            <div class="section-heading"><div><h2>收件人执行明细</h2><p>发送、送达、打开、点击和下单状态按用户归并显示</p></div><span class="section-count"><c:out value="${campaignDetail.summary.audience}"/> 人</span></div>
            <form class="campaign-filter-form" method="get" action="${campaignRecipientsUrl}" data-campaign-recipient-form>
                <input type="hidden" name="shop" value="${campaignDetail.shopDomain}"><input type="hidden" name="campaignId" value="${campaignDetail.campaignId}">
                <input type="hidden" name="size" value="10">
                <input name="q" value="${campaignFilter.search}" placeholder="客户姓名、邮箱或 ID">
                <select name="provider"><option value="ALL">全部通道</option><c:forEach items="${campaignDetail.providers}" var="item"><option value="${item}" ${campaignFilter.provider eq item ? 'selected' : ''}><c:out value="${providerAliases[item]}"/></option></c:forEach></select>
                <select name="lifecycle"><option value="ALL">全部状态</option><option value="PENDING" ${campaignFilter.lifecycle eq 'PENDING' ? 'selected' : ''}>待处理</option><option value="ACCEPTED" ${campaignFilter.lifecycle eq 'ACCEPTED' ? 'selected' : ''}>已接受</option><option value="DELIVERED" ${campaignFilter.lifecycle eq 'DELIVERED' ? 'selected' : ''}>已送达</option><option value="OPENED" ${campaignFilter.lifecycle eq 'OPENED' ? 'selected' : ''}>已打开</option><option value="CLICKED" ${campaignFilter.lifecycle eq 'CLICKED' ? 'selected' : ''}>已点击</option><option value="CONVERTED" ${campaignFilter.lifecycle eq 'CONVERTED' ? 'selected' : ''}>已下单</option><option value="FAILED" ${campaignFilter.lifecycle eq 'FAILED' ? 'selected' : ''}>失败</option><option value="BOUNCED" ${campaignFilter.lifecycle eq 'BOUNCED' ? 'selected' : ''}>退信</option></select>
                <button class="action-button" type="submit"><i class="fa fa-search"></i>查询</button>
                <c:if test="${canExportCustomerData}"><button class="action-button campaign-export-button" type="submit" formaction="${ctx}/campaigns/detail/recipients/export" formmethod="post" data-campaign-recipient-export disabled title="请先执行查询"><i class="fa fa-file-excel-o"></i>导出查询结果</button></c:if>
            </form>
            <c:if test="${canExportCustomerData}"><details id="campaign-recipient-exports" class="campaign-export-panel" data-status-url="${campaignRecipientExportsUrl}" data-download-url="${ctx}/campaigns/detail/recipients/export/download" data-delete-url="${ctx}/campaigns/detail/recipients/export/delete"><summary class="campaign-export-heading"><div><strong>Excel 导出任务</strong><span>导出当前查询条件匹配的全部数据，文件保留 7 天</span></div><i class="fa fa-angle-down" aria-hidden="true"></i></summary><div id="campaign-recipient-export-list" class="campaign-export-list" aria-live="polite"><c:choose><c:when test="${empty recipientExports}"><div class="campaign-export-empty">尚未提交导出任务</div></c:when><c:otherwise><c:forEach items="${recipientExports}" var="exportJob"><article class="campaign-export-job"><div><strong><c:out value="${exportJob.status}"/></strong><span><c:out value="${exportJob.processedRows}"/> / <c:out value="${exportJob.totalRows}"/> 条</span></div><div class="campaign-export-actions"><c:if test="${exportJob.ready}"><a class="action-button" href="${ctx}/campaigns/detail/recipients/export/download?shop=${campaignDetail.shopDomain}&amp;jobId=${exportJob.jobId}"><i class="fa fa-download"></i>下载 Excel</a></c:if><c:if test="${exportJob.deletable}"><form method="post" action="${ctx}/campaigns/detail/recipients/export/delete" onsubmit="return confirm('确认删除这条导出记录及其文件吗？');"><input type="hidden" name="shop" value="${campaignDetail.shopDomain}"><input type="hidden" name="campaignId" value="${campaignDetail.campaignId}"><input type="hidden" name="jobId" value="${exportJob.jobId}"><input type="hidden" name="q" value="${campaignFilter.search}"><input type="hidden" name="provider" value="${campaignFilter.provider}"><input type="hidden" name="lifecycle" value="${campaignFilter.lifecycle}"><button class="action-button danger-text" type="submit"><i class="fa fa-trash-o"></i>删除</button></form></c:if></div></article></c:forEach></c:otherwise></c:choose></div></details></c:if>
            <div id="campaign-recipient-results" class="async-result-region" aria-live="polite">
                <div class="empty-state compact"><i class="fa fa-list-alt"></i><strong>尚未加载执行明细</strong><span>活动概况已显示</span></div>
            </div>
        </section>

        <dialog id="campaign-customer-dialog" class="campaign-customer-dialog"
                aria-label="客户详情">
            <header class="campaign-customer-dialog-heading">
                <div><p class="eyebrow">收件人执行明细</p></div>
                <button class="icon-button dialog-close-button" type="button"
                        data-campaign-customer-close title="关闭客户详情" aria-label="关闭客户详情">
                    <i class="fa fa-times" aria-hidden="true"></i>
                </button>
            </header>
            <div id="campaign-customer-dialog-body" class="campaign-customer-dialog-body"></div>
        </dialog>
        <dialog id="campaign-customer-email-preview-dialog"
                class="template-preview-dialog customer-email-preview-dialog"
                aria-labelledby="campaign-customer-email-preview-title">
            <div class="template-preview-heading">
                <div><p class="eyebrow">客户实际内容</p><h2 id="campaign-customer-email-preview-title">营销邮件预览</h2></div>
                <button class="icon-button dialog-close-button" type="button"
                        data-campaign-customer-preview-close title="关闭预览" aria-label="关闭预览">
                    <i class="fa fa-times" aria-hidden="true"></i>
                </button>
            </div>
            <div class="template-preview-body">
                <iframe id="campaign-customer-email-preview-frame" title="该客户收到的营销邮件"
                        sandbox src="about:blank"></iframe>
            </div>
        </dialog>
        <script src="${ctx}/shopify/js/customer-timeline.js?v=20260925-p130"></script>
    </main>
</div>
<div id="provider-alias-data" hidden><c:forEach items="${providerAliases}" var="entry"><span data-provider-code="<c:out value='${entry.key}'/>" data-provider-alias="<c:out value='${entry.value}'/>"></span></c:forEach></div>
<script>
    (function () {
        var providerAliases = {};
        document.querySelectorAll('#provider-alias-data [data-provider-code]').forEach(function (item) {
            providerAliases[item.dataset.providerCode] = item.dataset.providerAlias;
        });
        var dialog = document.getElementById('campaign-send-dialog');
        var openButton = document.getElementById('campaign-send-open');
        var cancelButton = document.getElementById('campaign-send-cancel');
        if (dialog && openButton && cancelButton) {
            openButton.addEventListener('click', function () {
                var form = document.getElementById('campaign-send-form');
                if (form && !form.reportValidity()) return;
                dialog.showModal();
            });
            cancelButton.addEventListener('click', function () { dialog.close(); });
            dialog.addEventListener('click', function (event) {
                if (event.target === dialog) dialog.close();
            });
        }

        var scheduleDialog = document.getElementById('campaign-schedule-dialog');
        var scheduleOpen = document.getElementById('campaign-schedule-open');
        var scheduleClose = document.getElementById('campaign-schedule-close');
        var scheduleForm = document.getElementById('campaign-schedule-form');
        var scheduleLocal = document.getElementById('campaign-schedule-local');
        var scheduleInstant = document.getElementById('campaign-schedule-instant');
        var scheduleTime = document.getElementById('campaign-schedule-time');
        var scheduleAction = document.getElementById('campaign-schedule-action');

        function localDateTimeValue(date) {
            return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
                    .toISOString().slice(0, 16);
        }

        function hasAmbiguousLocalTime(date, requested) {
            var nextDay = new Date(date.getTime() + 24 * 60 * 60000);
            var offsetChange = nextDay.getTimezoneOffset() - date.getTimezoneOffset();
            return offsetChange > 0
                    && localDateTimeValue(new Date(date.getTime() + offsetChange * 60000)) === requested;
        }

        function normalizeInstantValue(value) {
            if (value === null || value === undefined || value === '') return null;
            var numeric = typeof value === 'number' ? value
                    : (/^-?\d+(\.\d+)?$/.test(String(value)) ? Number(value) : NaN);
            if (Number.isFinite(numeric)) {
                if (Math.abs(numeric) < 100000000000) numeric *= 1000;
                return new Date(numeric);
            }
            return new Date(value);
        }

        function showScheduledTime(value) {
            if (!scheduleTime) return;
            scheduleTime.dataset.scheduledAt = value || '';
            var date = normalizeInstantValue(value);
            scheduleTime.textContent = date && !isNaN(date.getTime())
                    ? date.toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })
                    : '时间未设置';
        }

        showScheduledTime(scheduleTime ? scheduleTime.dataset.scheduledAt : '');
        if (scheduleDialog && scheduleOpen && scheduleForm && scheduleLocal) {
            var zone = Intl.DateTimeFormat().resolvedOptions().timeZone || '浏览器本地时区';
            setText('campaign-schedule-timezone', '按当前浏览器时区 ' + zone + ' 选择时间');
            scheduleOpen.addEventListener('click', function () {
                var minimum = new Date(Date.now() + 60000);
                scheduleLocal.min = localDateTimeValue(minimum);
                var current = scheduleTime && scheduleTime.dataset.scheduledAt
                        ? normalizeInstantValue(scheduleTime.dataset.scheduledAt) : null;
                scheduleLocal.value = localDateTimeValue(current && current > minimum
                        ? current : new Date(Date.now() + 10 * 60000));
                scheduleLocal.setCustomValidity('');
                scheduleDialog.showModal();
            });
            scheduleClose.addEventListener('click', function () { scheduleDialog.close(); });
            scheduleDialog.addEventListener('click', function (event) {
                if (event.target === scheduleDialog) scheduleDialog.close();
            });
            scheduleLocal.addEventListener('input', function () {
                scheduleLocal.setCustomValidity('');
            });
            scheduleForm.addEventListener('submit', function (event) {
                var selected = new Date(scheduleLocal.value);
                if (!scheduleLocal.value || isNaN(selected.getTime()) || selected <= new Date()) {
                    event.preventDefault();
                    scheduleLocal.setCustomValidity('请选择晚于当前时间的发送日期和时间');
                    scheduleLocal.reportValidity();
                    return;
                }
                if (localDateTimeValue(selected) !== scheduleLocal.value
                        || hasAmbiguousLocalTime(selected, scheduleLocal.value)) {
                    event.preventDefault();
                    scheduleLocal.setCustomValidity('此时间位于夏令时切换时段，请选择其他时间');
                    scheduleLocal.reportValidity();
                    return;
                }
                scheduleInstant.value = selected.toISOString();
            });
        }

        var previewFrame = document.getElementById('campaign-preview-frame');
        if (previewFrame) {
            window.addEventListener('load', function () {
                if (previewFrame.src === 'about:blank') previewFrame.src = previewFrame.dataset.previewSrc;
            }, { once: true });
        }

        var refreshLink = document.getElementById('campaign-detail-refresh');
        var autoRefresh = ${campaignDetail.snapshotBuilding
                || campaignDetail.status eq 'PREPARING'
                || campaignDetail.status eq 'SCHEDULED'
                || campaignDetail.status eq 'QUEUED'
                || campaignDetail.status eq 'RUNNING'};
        var refreshTimer;
        var refreshInFlight = false;

        function setText(id, value) {
            var element = document.getElementById(id);
            if (element) element.textContent = value;
        }

        function displaySnapshotStatus(status) {
            return ({ READY: '已完成', BUILDING: '计算中', PROCESSING: '计算中',
                FAILED: '失败' })[status] || status || '-';
        }

        function applySendGate(progress) {
            var waiting = progress.status === 'APPROVED' && progress.snapshotStatus !== 'READY';
            var confirmationCount = Number(progress.confirmationRequiredCount || 0);
            document.querySelectorAll('[data-campaign-send-gate]').forEach(function (element) {
                var gate = element.dataset.campaignSendGate;
                var visible = (gate === 'sendable' && progress.sendable)
                        || (gate === 'waiting' && waiting)
                        || (gate === 'consent' && progress.sendable && confirmationCount > 0);
                element.hidden = !visible;
            });
            var confirmation = document.getElementById('campaign-send-confirmation');
            var confirmationInput = document.getElementById('campaign-send-confirmation-input');
            if (confirmation) confirmation.hidden = confirmationCount <= 0;
            if (confirmationInput) confirmationInput.required = confirmationCount > 0;
            setText('campaign-confirmation-count', confirmationCount);
            setText('campaign-consent-count', confirmationCount);
            setText('campaign-snapshot-progress-note', '已检查 ' + progress.snapshotProcessedCount
                    + ' 条候选记录，当前冻结 ' + progress.summary.audience
                    + ' 位客户。页面会自动刷新，也可点击“刷新执行数据”。');
            var active = ['PREPARING', 'QUEUED', 'RUNNING', 'PAUSED'].includes(progress.status);
            document.querySelectorAll('[data-campaign-active-control]').forEach(function (element) {
                element.hidden = !active;
            });
        }

        function applyScheduleGate(progress) {
            var scheduled = progress.status === 'SCHEDULED';
            document.querySelectorAll('[data-campaign-schedule-gate]').forEach(function (element) {
                var gate = element.dataset.campaignScheduleGate;
                element.hidden = gate === 'open' ? !(progress.sendable || scheduled) : !scheduled;
            });
            setText('campaign-schedule-open-label', scheduled ? '修改定时' : '定时发送');
            if (scheduleAction) scheduleAction.value = scheduled ? 'RESCHEDULE' : 'SCHEDULE';
            showScheduledTime(progress.scheduledAt);
            var error = document.getElementById('campaign-schedule-error');
            if (error) {
                error.textContent = progress.scheduleErrorSummary || '';
                error.hidden = !scheduled || !progress.scheduleErrorSummary;
            }
            var confirmation = document.getElementById('campaign-schedule-confirmation');
            var confirmationInput = document.getElementById('campaign-schedule-confirmation-input');
            var confirmationCount = Number(progress.confirmationRequiredCount || 0);
            if (confirmation) confirmation.hidden = confirmationCount <= 0;
            if (confirmationInput) confirmationInput.required = confirmationCount > 0;
            setText('campaign-schedule-confirmation-count', confirmationCount);
            if (!scheduled && !progress.sendable && scheduleDialog && scheduleDialog.open) {
                scheduleDialog.close();
            }
        }

        function renderJobs(jobs) {
            var host = document.getElementById('campaign-job-list');
            if (!host) return;
            host.replaceChildren();
            if (!jobs || jobs.length === 0) {
                var empty = document.createElement('div');
                empty.className = 'empty-state compact';
                var title = document.createElement('strong');
                title.textContent = '尚未创建发送任务';
                var note = document.createElement('span');
                note.textContent = '活动批准后执行发送才会产生任务。';
                empty.append(title, note);
                host.appendChild(empty);
                return;
            }
            var list = document.createElement('div');
            list.className = 'job-list';
            jobs.forEach(function (job) {
                var article = document.createElement('article');
                var heading = document.createElement('div');
                var title = document.createElement('strong');
                title.textContent = (providerAliases[job.provider] || '') + ' · ' + job.status;
                var id = document.createElement('span');
                id.textContent = job.jobId;
                heading.append(title, id);
                var bar = document.createElement('div');
                bar.className = 'job-progress';
                var fill = document.createElement('span');
                fill.style.width = job.progressPercent + '%';
                bar.appendChild(fill);
                var note = document.createElement('small');
                note.textContent = job.processed + ' / ' + job.total + ' · 失败 ' + job.failed;
                article.append(heading, bar, note);
                list.appendChild(article);
            });
            host.appendChild(list);
        }

        function scheduleRefresh() {
            clearTimeout(refreshTimer);
            if (autoRefresh) refreshTimer = setTimeout(refreshProgress, 10000);
        }

        function applyProgress(progress) {
            if (${campaignDetail.status eq 'SCHEDULED'} && progress.status !== 'SCHEDULED') {
                window.location.reload();
                return;
            }
            var summary = progress.summary;
            setText('campaign-current-status', progress.status);
            setText('campaign-snapshot-status', displaySnapshotStatus(progress.snapshotStatus));
            setText('campaign-audience', summary.audience);
            setText('campaign-send-audience', summary.audience);
            setText('campaign-audience-note', progress.snapshotStatus === 'READY'
                    ? '审批后已固化' : '已检查 ' + progress.snapshotProcessedCount + ' 条候选记录');
            setText('campaign-send-progress', summary.progressPercent + '%');
            setText('campaign-send-note', summary.accepted + ' 接受 / ' + summary.failed + ' 失败');
            setText('campaign-delivered', summary.delivered);
            setText('campaign-delivery-note', '打开 ' + summary.openedRecipients + ' 人 / ' + summary.opened + ' 次 · 点击 ' + summary.clickedRecipients + ' 人 / ' + summary.clicked + ' 次');
            setText('campaign-orders', summary.orders + ' 单');
            setText('campaign-conversion-note', summary.convertedRecipients + ' 位客户 · ' + summary.netRevenue);
            setText('campaign-risk', summary.bounced + summary.complained + summary.unsubscribed);
            renderJobs(progress.jobs);
            applySendGate(progress);
            applyScheduleGate(progress);
            autoRefresh = ['PREPARING', 'SCHEDULED', 'QUEUED', 'RUNNING'].includes(progress.status)
                    || ['BUILDING', 'PROCESSING'].includes(progress.snapshotStatus);
        }

        function refreshProgress(event) {
            if (event) event.preventDefault();
            if (!refreshLink || refreshInFlight) return;
            refreshInFlight = true;
            refreshLink.classList.add('disabled');
            fetch(refreshLink.dataset.progressUrl, {
                credentials: 'same-origin',
                headers: { Accept: 'application/json' }
            }).then(function (response) {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.json();
            }).then(applyProgress).catch(function () {
                refreshLink.title = '刷新失败，请稍后重试';
            }).finally(function () {
                refreshInFlight = false;
                refreshLink.classList.remove('disabled');
                scheduleRefresh();
            });
        }

        if (refreshLink) {
            refreshLink.addEventListener('click', refreshProgress);
            scheduleRefresh();
        }

        var recipientForm = document.querySelector('[data-campaign-recipient-form]');
        var recipientHost = document.getElementById('campaign-recipient-results');
        var recipientRequest;
        var customerDialog = document.getElementById('campaign-customer-dialog');
        var customerDialogBody = document.getElementById('campaign-customer-dialog-body');
        var customerPreviewDialog = document.getElementById('campaign-customer-email-preview-dialog');
        var customerPreviewFrame = document.getElementById('campaign-customer-email-preview-frame');
        var customerRequest;
        var customerDialogScrollY = 0;
        var customerDialogScrollX = 0;
        var customerDialogTrigger = null;

        function initializeCustomerTimeline() {
            var timelineRoot = customerDialogBody.querySelector('[data-customer-timeline]');
            if (timelineRoot && window.ShopifyCustomerTimeline) {
                window.ShopifyCustomerTimeline.init(timelineRoot);
            }
        }

        function openCustomerDetail(link) {
            if (!customerDialog || !customerDialogBody) return;
            if (customerRequest) customerRequest.abort();
            customerRequest = new AbortController();
            customerDialogScrollY = window.scrollY;
            customerDialogScrollX = window.scrollX;
            customerDialogTrigger = link;
            customerDialogBody.setAttribute('aria-busy', 'true');
            customerDialogBody.innerHTML = '<div class="async-loading campaign-customer-loading"><i class="fa fa-spinner fa-spin"></i><strong>正在加载客户详情</strong></div>';
            if (!customerDialog.open) {
                customerDialog.showModal();
                window.scrollTo(customerDialogScrollX, customerDialogScrollY);
            }
            fetch(link.dataset.detailUrl, {
                credentials: 'same-origin', signal: customerRequest.signal,
                headers: { Accept: 'text/html' }
            }).then(function (response) {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.text();
            }).then(function (html) {
                customerDialogBody.innerHTML = html;
                initializeCustomerTimeline();
            }).catch(function (error) {
                if (error.name === 'AbortError') return;
                customerDialogBody.innerHTML = '<div class="empty-state"><i class="fa fa-exclamation-circle"></i><strong>客户详情加载失败</strong><span>请关闭后重新打开</span></div>';
            }).finally(function () {
                customerDialogBody.removeAttribute('aria-busy');
            });
        }

        function loadRecipients(page) {
            if (!recipientForm || !recipientHost) return;
            if (recipientRequest) recipientRequest.abort();
            recipientRequest = new AbortController();
            var params = new URLSearchParams(new FormData(recipientForm));
            params.set('page', page || '1');
            recipientHost.setAttribute('aria-busy', 'true');
            recipientHost.innerHTML = '<div class="async-loading campaign-recipient-loading"><i class="fa fa-spinner fa-spin"></i><strong>正在加载执行明细</strong></div>';
            fetch(recipientForm.action + '?' + params.toString(), {
                credentials: 'same-origin', signal: recipientRequest.signal,
                headers: { Accept: 'text/html' }
            }).then(function (response) {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.text();
            }).then(function (html) {
                recipientHost.innerHTML = html;
                markRecipientExportQueried();
            }).catch(function (error) {
                if (error.name === 'AbortError') return;
                markRecipientExportUnqueried();
                recipientHost.innerHTML = '<div class="empty-state compact"><i class="fa fa-exclamation-circle"></i><strong>执行明细加载失败</strong><span>请稍后重新查询</span></div>';
            }).finally(function () {
                recipientHost.removeAttribute('aria-busy');
            });
        }

        var recipientExportPanel=document.getElementById('campaign-recipient-exports'), recipientExportList=document.getElementById('campaign-recipient-export-list'), recipientExportButton=document.querySelector('[data-campaign-recipient-export]'), recipientExportTimer;
        function markRecipientExportUnqueried(){if(!recipientExportButton)return;recipientExportButton.disabled=true;recipientExportButton.title='请先执行查询';}
        function markRecipientExportQueried(){if(!recipientExportButton)return;recipientExportButton.disabled=false;recipientExportButton.title='导出当前查询条件的全部结果';}
        function exportStatusText(status){return {PENDING:'排队中',RUNNING:'生成中',READY:'已完成',FAILED:'生成失败',EXPIRED:'已过期'}[status]||status;}
        function renderRecipientExports(items){if(!recipientExportList)return false;recipientExportList.replaceChildren();if(!items||items.length===0){var empty=document.createElement('div');empty.className='campaign-export-empty';empty.textContent='尚未提交导出任务';recipientExportList.appendChild(empty);return false;}var active=false;items.forEach(function(job){active=active||job.status==='PENDING'||job.status==='RUNNING';var article=document.createElement('article');article.className='campaign-export-job '+String(job.status||'').toLowerCase();var summary=document.createElement('div'),title=document.createElement('strong'),detail=document.createElement('span');title.textContent=exportStatusText(job.status);detail.textContent=(job.processedRows||0)+' / '+(job.totalRows||0)+' 条 · '+(job.progressPercent||0)+'%';summary.append(title,detail);article.appendChild(summary);var actions=document.createElement('div');actions.className='campaign-export-actions';if(job.status==='READY'){var link=document.createElement('a'),url=new URL(recipientExportPanel.dataset.downloadUrl,window.location.href);url.searchParams.set('shop',recipientForm.elements.shop.value);url.searchParams.set('jobId',job.jobId);link.href=url.toString();link.className='action-button';link.innerHTML='<i class="fa fa-download"></i>下载 Excel';actions.appendChild(link);}else if(job.status==='FAILED'){var error=document.createElement('span');error.className='campaign-export-error';error.textContent=job.errorSummary||'生成失败，请重新提交';article.appendChild(error);}if(job.status!=='PENDING'&&job.status!=='RUNNING'){var form=document.createElement('form');form.method='post';form.action=recipientExportPanel.dataset.deleteUrl;form.onsubmit=function(){return window.confirm('确认删除这条导出记录及其文件吗？');};[['shop',recipientForm.elements.shop.value],['campaignId',recipientForm.elements.campaignId.value],['jobId',job.jobId],['q',recipientForm.elements.q.value],['provider',recipientForm.elements.provider.value],['lifecycle',recipientForm.elements.lifecycle.value]].forEach(function(entry){var input=document.createElement('input');input.type='hidden';input.name=entry[0];input.value=entry[1];form.appendChild(input);});var remove=document.createElement('button');remove.type='submit';remove.className='action-button danger-text';remove.innerHTML='<i class="fa fa-trash-o"></i>删除';form.appendChild(remove);actions.appendChild(form);}if(actions.childElementCount)article.appendChild(actions);recipientExportList.appendChild(article);});return active;}
        function refreshRecipientExports(){if(!recipientExportPanel||!recipientExportPanel.open)return;clearTimeout(recipientExportTimer);fetch(recipientExportPanel.dataset.statusUrl,{credentials:'same-origin',headers:{Accept:'application/json'}}).then(function(response){if(!response.ok)throw new Error('HTTP '+response.status);return response.json();}).then(function(payload){if(renderRecipientExports(payload.items||payload))recipientExportTimer=setTimeout(refreshRecipientExports,2000);}).catch(function(){recipientExportTimer=setTimeout(refreshRecipientExports,5000);});}

        if (recipientForm && recipientHost) {
            recipientForm.addEventListener('input', markRecipientExportUnqueried);
            recipientForm.addEventListener('change', markRecipientExportUnqueried);
            recipientForm.addEventListener('submit', function (event) {
                if(event.submitter&&event.submitter.hasAttribute('data-campaign-recipient-export')){event.submitter.disabled=true;event.submitter.innerHTML='<i class="fa fa-spinner fa-spin"></i>已提交';return;}
                event.preventDefault();
                loadRecipients(1);
            });
            recipientHost.addEventListener('click', function (event) {
                var customerLink = event.target.closest('[data-campaign-customer-detail]');
                if (customerLink) {
                    event.preventDefault();
                    openCustomerDetail(customerLink);
                    return;
                }
                var link = event.target.closest('[data-campaign-recipient-page]');
                if (!link) return;
                event.preventDefault();
                loadRecipients(link.dataset.campaignRecipientPage);
            });
        }
        if(recipientExportPanel)recipientExportPanel.addEventListener('toggle',function(){clearTimeout(recipientExportTimer);if(recipientExportPanel.open)refreshRecipientExports();});

        if (customerDialog) {
            customerDialogBody.addEventListener('click', function (event) {
                var previewLink = event.target.closest('[data-customer-email-preview]');
                if (!previewLink || !customerPreviewDialog || !customerPreviewFrame) return;
                event.preventDefault();
                customerPreviewFrame.src = previewLink.href;
                if (!customerPreviewDialog.open) customerPreviewDialog.showModal();
            });
            customerDialog.querySelector('[data-campaign-customer-close]').addEventListener('click', function () {
                customerDialog.close();
            });
            customerDialog.addEventListener('click', function (event) {
                if (event.target === customerDialog) customerDialog.close();
            });
            customerDialog.addEventListener('close', function () {
                var returnFocus = customerDialogTrigger;
                var scrollX = customerDialogScrollX;
                var scrollY = customerDialogScrollY;
                if (customerRequest) customerRequest.abort();
                if (customerPreviewDialog && customerPreviewDialog.open) customerPreviewDialog.close();
                customerDialogBody.replaceChildren();
                customerDialogTrigger = null;
                if (returnFocus && document.contains(returnFocus)) {
                    returnFocus.focus({ preventScroll: true });
                }
                window.scrollTo(scrollX, scrollY);
            });
        }
        if (customerPreviewDialog && customerPreviewFrame) {
            customerPreviewDialog.querySelector('[data-campaign-customer-preview-close]').addEventListener('click', function () {
                customerPreviewDialog.close();
            });
            customerPreviewDialog.addEventListener('click', function (event) {
                if (event.target === customerPreviewDialog) customerPreviewDialog.close();
            });
            customerPreviewDialog.addEventListener('close', function () {
                customerPreviewFrame.src = 'about:blank';
            });
        }
    }());
</script>
</body>
</html>
