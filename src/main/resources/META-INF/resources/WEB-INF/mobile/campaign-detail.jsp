<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ page language="java" pageEncoding="UTF-8" contentType="text/html; charset=UTF-8" %>
<c:set var="ctx" value="${pageContext.request.contextPath}"/>
<c:set var="mobilePage" value="campaigns"/>
<c:url var="detailUrl" value="/mobile/campaigns/detail"><c:param name="shop" value="${campaignDetail.shopDomain}"/><c:param name="campaignId" value="${campaignDetail.campaignId}"/><c:param name="listPage" value="${empty param.listPage ? 1 : param.listPage}"/><c:param name="listSize" value="${empty param.listSize ? 10 : param.listSize}"/><c:param name="listQ" value="${param.listQ}"/><c:param name="listStatus" value="${param.listStatus}"/><c:param name="listFromDate" value="${param.listFromDate}"/><c:param name="listToDate" value="${param.listToDate}"/></c:url>
<c:url var="listUrl" value="/mobile/campaigns"><c:param name="shop" value="${campaignDetail.shopDomain}"/><c:param name="page" value="${empty param.listPage ? 1 : param.listPage}"/><c:param name="size" value="${empty param.listSize ? 10 : param.listSize}"/><c:param name="q" value="${param.listQ}"/><c:param name="status" value="${param.listStatus}"/><c:param name="fromDate" value="${param.listFromDate}"/><c:param name="toDate" value="${param.listToDate}"/></c:url>
<c:url var="testUrl" value="/mobile/campaigns/editor"><c:param name="shop" value="${campaignDetail.shopDomain}"/><c:param name="campaignId" value="${campaignDetail.campaignId}"/><c:param name="mode" value="test"/></c:url>
<c:set var="hasMobileActions" value="${canWithdrawCampaign or (canManageCampaigns and (campaignDetail.status eq 'DRAFT' or campaignDetail.pendingApproval or campaignDetail.sendable or campaignDetail.status eq 'SCHEDULED' or campaignDetail.status eq 'PREPARING' or campaignDetail.status eq 'QUEUED' or campaignDetail.status eq 'RUNNING' or campaignDetail.status eq 'PAUSED'))}"/>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>活动详情</title>
  <link rel="stylesheet" href="${ctx}/shopify/mobile/mobile.css?v=20261108">
  <link rel="stylesheet" href="${ctx}/shopify/mobile/status.css?v=20261108">
  <link rel="stylesheet" href="${ctx}/shopify/mobile/campaign-recipients.css?v=20261110-status">
  <style>
    .md-detail-back { display:inline-block; margin:8px 0 16px; color:#17644a; text-decoration:none; font-weight:650; }
    .md-detail-title { margin:0; overflow-wrap:anywhere; font-size:26px; line-height:1.3; }
    .md-detail-eyebrow { margin:0 0 8px; color:#477365; font-size:12px; font-weight:700; letter-spacing:.08em; }
    .md-detail-status { display:inline-block; margin:12px 0 0; padding:5px 10px; border-radius:20px; background:#e4f2eb; color:#185840; font-size:13px; font-weight:700; }
    .md-detail-section { margin:16px 0; padding:18px; border:1px solid #dce8e2; border-radius:12px; background:#fff; }
    .md-detail-section h2 { margin:0 0 14px; font-size:17px; }
    .md-detail-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
    .md-detail-metric { padding:13px; background:#f2f7f4; border-radius:9px; min-width:0; }
    .md-detail-metric span,.md-detail-metric small { display:block; color:#526b60; font-size:12px; line-height:1.5; }
    .md-detail-metric strong { display:block; margin:6px 0; color:#123e31; font-size:23px; overflow-wrap:anywhere; }
    .md-detail-note { margin:10px 0; padding:12px; border-left:3px solid #bd8834; background:#fff7e9; line-height:1.55; }
    .md-detail-error { border-color:#b84a3d; background:#fff2ef; color:#842d24; }
    .md-detail-actions { display:grid; gap:10px; }
    .md-detail-actions form { margin:0; }
    .md-detail-actions button { width:100%; min-height:46px; padding:10px 14px; border:1px solid #17644a; border-radius:8px; background:#17644a; color:white; font:inherit; font-weight:700; cursor:pointer; }
    .md-detail-actions button.secondary { background:white; color:#17644a; }
    .md-detail-actions button.danger { border-color:#a43c35; background:white; color:#9a3029; }
    .md-detail-actions button:disabled { opacity:.55; cursor:wait; }
    .md-detail-actions label { display:flex; align-items:flex-start; gap:8px; margin:0 0 10px; font-size:14px; line-height:1.5; }
    .md-detail-actions input[type=checkbox] { flex:none; width:19px; height:19px; margin:1px 0 0; }
    .md-detail-actions label.md-detail-field { display:grid; gap:6px; }
    .md-detail-field input, .md-detail-field textarea { box-sizing:border-box; width:100%; min-height:44px; padding:10px; border:1px solid #9fb5a9; border-radius:8px; font:inherit; }
    .md-detail-list { margin:0; } .md-detail-list div { display:flex; justify-content:space-between; gap:16px; padding:9px 0; border-bottom:1px solid #edf2ef; }
    .md-detail-list div:last-child { border-bottom:0; } .md-detail-list dt { color:#5a6e64; } .md-detail-list dd { margin:0; text-align:right; overflow-wrap:anywhere; }
    .md-detail-job { padding:12px 0; border-top:1px solid #edf2ef; overflow-wrap:anywhere; }
    .md-detail-job progress { display:block; width:100%; height:10px; margin:9px 0; accent-color:#17644a; }
    .md-detail-refresh { display:inline-block; padding:10px 0; color:#17644a; font-weight:700; }
    .md-detail-toolbar { display:flex; justify-content:space-between; align-items:center; gap:12px; margin:12px 0; }
    .md-detail-toolbar a { min-height:44px; padding:10px 12px; border:1px solid #bfd7c9; border-radius:9px; color:#17644a; font-size:14px; font-weight:700; }
    .md-detail-section summary { padding:4px 0; cursor:pointer; font-weight:700; color:#17644a; }
    .md-detail-list { font-size:13px; }
    .md-detail-list dt { flex:0 0 64px; }
    .md-detail-list dd { min-width:0; }
    .md-detail-section details { border-top:1px solid #edf2ef; margin-top:8px; padding-top:8px; }
    #md-actions-title { scroll-margin-top:16px; }
  </style>
</head>
<body>
  <%@ include file="fragments/header.jspf" %>
  <main class="mobile-main">
    <a class="md-detail-back" data-mobile-list-return href="<c:out value='${listUrl}'/>">← 返回活动列表</a>
    <p class="md-detail-eyebrow">营销活动 / 执行详情</p>
    <h1 class="md-detail-title"><c:out value="${campaignDetail.name}"/></h1>
    <span class="md-detail-status" data-campaign-status="<c:out value='${campaignStatusDisplayName eq "已归档" ? "ARCHIVED" : campaignDetail.status}'/>"><c:choose>
      <c:when test="${not empty campaignStatusDisplayName}"><c:out value="${campaignStatusDisplayName}"/></c:when>
      <c:when test="${campaignDetail.status eq 'DRAFT'}">草稿</c:when><c:when test="${campaignDetail.status eq 'PENDING_APPROVAL'}">待审批</c:when>
      <c:when test="${campaignDetail.status eq 'APPROVED'}">已审批</c:when><c:when test="${campaignDetail.status eq 'PREPARING'}">准备中</c:when>
      <c:when test="${campaignDetail.status eq 'QUEUED'}">已进入队列</c:when><c:when test="${campaignDetail.status eq 'RUNNING'}">发送中</c:when>
      <c:when test="${campaignDetail.status eq 'PAUSED'}">已暂停</c:when><c:when test="${campaignDetail.status eq 'COMPLETED'}">已完成</c:when>
      <c:when test="${campaignDetail.status eq 'CANCELLED'}">已取消</c:when><c:when test="${campaignDetail.status eq 'FAILED'}">失败</c:when>
      <c:when test="${campaignDetail.status eq 'SCHEDULED'}">已计划</c:when>
      <c:when test="${campaignDetail.status eq 'ARCHIVED'}">已归档</c:when>
      <c:otherwise><c:out value="${campaignDetail.status}"/></c:otherwise>
    </c:choose></span>
    <div class="md-detail-toolbar">
      <a href="<c:out value='${detailUrl}'/>">↻ 刷新数据</a>
      <c:if test="${hasMobileActions}"><a href="#md-actions-title">查看活动操作 ↓</a></c:if>
    </div>

    <c:if test="${not empty successMessage}"><p role="status" class="md-detail-note"><c:out value="${successMessage}"/></p></c:if>
    <c:if test="${not empty errorMessage}"><p role="alert" class="md-detail-note md-detail-error"><c:out value="${errorMessage}"/></p></c:if>
    <c:if test="${campaignDetail.status eq 'APPROVED' and approvedSendState eq 'APPROVE_AND_SEND'}"><p class="md-detail-note">已批准，系统正在冻结受众；完成后自动提交发送。</p></c:if>
    <c:if test="${campaignDetail.status eq 'APPROVED' and approvedSendState eq 'APPROVE_AND_SEND_FAILED'}"><p role="alert" class="md-detail-note md-detail-error">自动发送未完成，请检查受众、额度和模板状态，刷新后确认是否需要手动发送。</p></c:if>
    <c:if test="${campaignDetail.status eq 'SCHEDULED'}"><p class="md-detail-note">计划发送：<time data-mobile-scheduled-time data-scheduled-at="<c:out value='${campaignDetail.scheduledAt}'/>"><c:out value="${campaignDetail.scheduledAt}" default="时间未设置"/></time><c:if test="${not empty campaignDetail.scheduleErrorSummary}"><br><c:out value="${campaignDetail.scheduleErrorSummary}"/></c:if></p></c:if>

    <section class="md-detail-section" aria-labelledby="md-progress-title">
      <h2 id="md-progress-title">执行进度</h2>
      <c:set var="statisticsMissingLabel" value="${campaignDetail.summary.statisticsPartial or campaignDetail.summary.statisticsStatus eq 'ARCHIVE_PENDING' ? '历史未记录' : '待核验'}"/>
        <c:if test="${campaignDetail.summary.statisticsStatus eq 'FROZEN_PARTIAL' and not campaignDetail.summary.statisticsReady}"><c:set var="savedLegacyEvents" value="${campaignDetail.summary.savedLegacyEvents}"/></c:if>
        <c:set var="legacySavedDelivery" value="${not campaignDetail.summary.outcomeStatisticsAvailable and savedLegacyEvents.delivered ne null}"/>
        <c:set var="legacySavedConversion" value="${not campaignDetail.summary.financialStatisticsAvailable and savedLegacyEvents.converted ne null}"/>
        <c:set var="legacySavedRisk" value="${not campaignDetail.summary.outcomeStatisticsAvailable and campaignDetail.summary.eventStatisticsAvailable and savedLegacyEvents.bounced ne null}"/>
      <c:if test="${not empty campaignDetail.summary.statisticsStatus and not campaignDetail.summary.statisticsReady}"><p class="md-detail-note" role="status"><c:choose><c:when test="${not empty savedLegacyEvents}">已显示历史保留统计，缺失字段标为历史未记录。</c:when><c:when test="${campaignDetail.summary.statisticsStatus eq 'FROZEN_PARTIAL'}">已显示原固化统计，缺失字段标为历史未记录。</c:when><c:when test="${campaignDetail.summary.statisticsStatus eq 'ARCHIVE_PENDING'}">未找到完整历史固化统计，已有最终任务计数仍可查看。</c:when><c:otherwise>统计正在后台准备，请稍后刷新。</c:otherwise></c:choose><c:if test="${campaignDetail.summary.preservedEventStatistics}">（含历史保留的累计事件计数）</c:if></p></c:if>
      <div class="md-detail-grid">
        <article class="md-detail-metric"><span>冻结受众</span><strong><c:out value="${campaignDetail.summary.audience}" default="0"/></strong><small><c:out value="${campaignDetail.snapshotStatusDisplayName}"/> · 已检查 <c:out value="${campaignDetail.snapshotProcessedCount}"/> 条</small></article>
        <c:choose><c:when test="${not empty campaignDetail.legacySendingProgress}"><article class="md-detail-metric"><span>发送处理</span><strong><c:out value="${campaignDetail.legacySendingProgress.progressPercent}"/>%</strong><small>原最终任务计数：已处理 <c:out value="${campaignDetail.legacySendingProgress.processed}"/> / <c:out value="${campaignDetail.legacySendingProgress.total}"/> · 接受 <c:out value="${campaignDetail.legacySendingProgress.accepted}"/></small></article></c:when><c:when test="${not empty campaignDetail.summary.statisticsStatus and not campaignDetail.summary.statisticsReady and campaignDetail.summary.statisticsStatus ne 'INITIALIZING' and not campaignDetail.summary.sendingStatisticsAvailable}"><article class="md-detail-metric"><span>发送处理</span><strong>—</strong><small>历史发送统计未记录</small></article></c:when><c:otherwise><article class="md-detail-metric"><span>发送处理</span><strong><c:out value="${campaignDetail.summary.progressPercent}" default="0"/>%</strong><small>接受 <c:out value="${campaignDetail.summary.accepted}"/> · 失败 <c:out value="${campaignDetail.summary.failed}"/> · 未知 <c:out value="${campaignDetail.summary.unknown}"/></small></article></c:otherwise></c:choose>
                <article class="md-detail-metric"><span id="campaign-delivered-label"><c:choose><c:when test="${legacySavedDelivery}">送达累计记录</c:when><c:otherwise>送达</c:otherwise></c:choose></span><strong><c:choose><c:when test="${legacySavedDelivery}"><c:out value="${savedLegacyEvents.delivered}"/> 次</c:when><c:when test="${empty campaignDetail.summary.statisticsStatus or campaignDetail.summary.statisticsReady or campaignDetail.summary.outcomeStatisticsAvailable}"><c:out value="${campaignDetail.summary.delivered}"/></c:when><c:otherwise><span data-statistics-pending>—</span></c:otherwise></c:choose></strong><c:if test="${legacySavedDelivery}"><small>历史事件口径 · 去重送达人数历史未记录</small></c:if><small><c:choose><c:when test="${empty campaignDetail.summary.statisticsStatus or campaignDetail.summary.statisticsReady or campaignDetail.summary.eventStatisticsAvailable}">打开 <c:choose><c:when test="${campaignDetail.summary.openedRecipients eq null}"><c:out value="${statisticsMissingLabel}"/></c:when><c:otherwise><c:out value="${campaignDetail.summary.openedRecipients}"/> 人</c:otherwise></c:choose> / <c:out value="${campaignDetail.summary.opened}"/> 次 · 点击 <c:choose><c:when test="${campaignDetail.summary.clickedRecipients eq null}"><c:out value="${statisticsMissingLabel}"/></c:when><c:otherwise><c:out value="${campaignDetail.summary.clickedRecipients}"/> 人</c:otherwise></c:choose> / <c:out value="${campaignDetail.summary.clicked}"/> 次</c:when><c:otherwise>打开、点击统计<c:out value="${statisticsMissingLabel}"/></c:otherwise></c:choose></small></article>
        <article class="md-detail-metric"><span id="campaign-conversion-label"><c:choose><c:when test="${legacySavedConversion}">转化累计记录</c:when><c:otherwise>转化</c:otherwise></c:choose></span><strong><c:choose><c:when test="${legacySavedConversion}"><c:out value="${savedLegacyEvents.converted}"/> 次</c:when><c:when test="${empty campaignDetail.summary.statisticsStatus or campaignDetail.summary.statisticsReady or campaignDetail.summary.financialStatisticsAvailable}"><c:out value="${campaignDetail.summary.orders}"/> 单</c:when><c:otherwise><span data-statistics-pending>—</span></c:otherwise></c:choose></strong><small><c:choose><c:when test="${legacySavedConversion}">原转化记录（历史事件口径）；订单、客户及金额历史未记录</c:when><c:when test="${empty campaignDetail.summary.statisticsStatus or campaignDetail.summary.statisticsReady or campaignDetail.summary.financialStatisticsAvailable}">客户 <c:out value="${campaignDetail.summary.convertedRecipients}"/> · <c:out value="${campaignDetail.summary.netRevenue}"/></c:when><c:otherwise>转化统计<c:out value="${statisticsMissingLabel}"/></c:otherwise></c:choose></small></article>
        <article class="md-detail-metric"><span>风险反馈<c:if test="${legacySavedRisk or (campaignDetail.summary.statisticsStatus eq 'FROZEN_PARTIAL' and campaignDetail.summary.outcomeStatisticsAvailable and campaignDetail.summary.eventStatisticsAvailable and campaignDetail.summary.unsubscribedRecipients eq null)}">（历史事件口径）</c:if></span><strong><c:choose><c:when test="${legacySavedRisk}"><c:out value="${savedLegacyEvents.bounced + campaignDetail.summary.complained + campaignDetail.summary.unsubscribed}"/> 次</c:when><c:when test="${empty campaignDetail.summary.statisticsStatus or campaignDetail.summary.statisticsReady or campaignDetail.summary.riskTotalAvailable or (campaignDetail.summary.statisticsStatus eq 'FROZEN_PARTIAL' and campaignDetail.summary.outcomeStatisticsAvailable and campaignDetail.summary.eventStatisticsAvailable and campaignDetail.summary.unsubscribedRecipients eq null)}"><c:out value="${campaignDetail.summary.bounced + campaignDetail.summary.complained + (campaignDetail.summary.unsubscribedRecipients eq null ? campaignDetail.summary.unsubscribed : campaignDetail.summary.unsubscribedRecipients)}"/></c:when><c:otherwise><span data-statistics-pending>—</span></c:otherwise></c:choose></strong><small><c:choose><c:when test="${legacySavedRisk}">原退信记录 <c:out value="${savedLegacyEvents.bounced}"/> 次 / 投诉 <c:out value="${campaignDetail.summary.complained}"/> 次 / 退订事件 <c:out value="${campaignDetail.summary.unsubscribed}"/> 次（退订去重人数历史未记录）</c:when><c:otherwise>退信 <c:choose><c:when test="${empty campaignDetail.summary.statisticsStatus or campaignDetail.summary.statisticsReady or campaignDetail.summary.outcomeStatisticsAvailable}"><c:out value="${campaignDetail.summary.bounced}"/></c:when><c:otherwise><c:out value="${statisticsMissingLabel}"/></c:otherwise></c:choose> / 投诉 <c:choose><c:when test="${empty campaignDetail.summary.statisticsStatus or campaignDetail.summary.statisticsReady or campaignDetail.summary.eventStatisticsAvailable}"><c:out value="${campaignDetail.summary.complained}"/></c:when><c:otherwise><c:out value="${statisticsMissingLabel}"/></c:otherwise></c:choose> / <c:choose><c:when test="${campaignDetail.summary.unsubscribedRecipients ne null}">退订人数 <c:out value="${campaignDetail.summary.unsubscribedRecipients}"/></c:when><c:when test="${campaignDetail.summary.statisticsStatus eq 'FROZEN_PARTIAL' and campaignDetail.summary.outcomeStatisticsAvailable and campaignDetail.summary.eventStatisticsAvailable and campaignDetail.summary.unsubscribedRecipients eq null}">退订事件 <c:out value="${campaignDetail.summary.unsubscribed}"/>（历史未记录去重人数）</c:when><c:otherwise>退订人数 <c:out value="${statisticsMissingLabel}"/><c:if test="${empty campaignDetail.summary.statisticsStatus or campaignDetail.summary.statisticsReady or campaignDetail.summary.eventStatisticsAvailable}">（退订事件 <c:out value="${campaignDetail.summary.unsubscribed}"/>）</c:if></c:otherwise></c:choose></c:otherwise></c:choose></small></article>
      </div>
      <c:if test="${campaignDetail.status eq 'APPROVED' and not campaignDetail.audienceReady}"><p class="md-detail-note">受众冻结中，完成前不能发送。请刷新查看进度。</p></c:if>
      <c:if test="${campaignDetail.audienceReady and campaignDetail.summary.audience eq 0}"><p class="md-detail-note">冻结受众为空，不能发送；请在电脑端检查分群并重新生成受众。</p></c:if>
    </section>

    <section class="md-detail-section" aria-labelledby="md-config-title">
      <h2 id="md-config-title">活动设置</h2>
      <dl class="md-detail-list" data-mobile-review>
        <div><dt>店铺</dt><dd><c:out value="${campaignDetail.shopDomain}"/></dd></div>
        <div><dt>受众</dt><dd><c:out value="${campaignDetail.audienceSourceDisplayName}"/> <c:out value="${campaignDetail.segmentName}"/></dd></div>
        <c:if test="${campaignDetail.hasIncludeTags}"><div><dt>包含标签（<c:out value="${campaignDetail.includeTagModeDisplayName}"/>）</dt><dd><c:out value="${campaignDetail.includeTagsDisplayName}"/></dd></div></c:if>
        <c:if test="${campaignDetail.hasExcludeTags}"><div><dt>排除标签</dt><dd><c:out value="${campaignDetail.excludeTagsDisplayName}"/></dd></div></c:if>
        <div><dt>邮件模板</dt><dd><c:out value="${campaignDetail.templateName}"/></dd></div>
        <div><dt>发送通道</dt><dd><c:forEach items="${campaignDetail.providers}" var="provider" varStatus="item"><c:if test="${not item.first}">、</c:if><c:out value="${providerAliases[provider]}" default="${provider}"/></c:forEach></dd></div>
      </dl>
      <details><summary>更多活动设置</summary><dl class="md-detail-list">
        <div><dt>重复发送间隔</dt><dd><c:choose><c:when test="${campaignDetail.repeatIntervalHours eq 0}">不限制</c:when><c:otherwise><c:out value="${campaignDetail.repeatIntervalHours}"/> 小时</c:otherwise></c:choose></dd></div>
        <div><dt>数据保留</dt><dd><c:out value="${campaignDetail.hotRetentionDays}" default="—"/> 天</dd></div>
        <div><dt>UTM 来源</dt><dd><c:out value="${campaignDetail.utmSource}" default="—"/></dd></div>
        <div><dt>UTM 媒介</dt><dd><c:out value="${campaignDetail.utmMedium}" default="—"/></dd></div>
        <div><dt>UTM 活动</dt><dd><c:out value="${campaignDetail.utmCampaign}" default="—"/></dd></div>
        <div><dt>UTM 内容</dt><dd><c:out value="${campaignDetail.utmContentDisplayName}" default="—"/></dd></div>
      </dl></details>
    </section>
    <c:if test="${hasMobileActions}">
      <section class="md-detail-section" aria-labelledby="md-actions-title">
        <h2 id="md-actions-title">活动操作</h2>
        <p data-mobile-action-loading>操作组件加载中；如长时间未完成，请刷新页面。</p>
        <div class="md-detail-actions">
          <c:if test="${canWithdrawCampaign}">
            <form method="post" action="${ctx}/mobile/campaigns/action" data-mobile-campaign-action data-requires-guard="true" data-confirm-message="撤回后返回草稿并清除冻结受众，发送前需重新审批。确认撤回？">
              <input type="hidden" name="shop" value="<c:out value='${campaignDetail.shopDomain}'/>"><input type="hidden" name="campaignId" value="<c:out value='${campaignDetail.campaignId}'/>"><input type="hidden" name="action" value="WITHDRAW"><button type="submit" class="secondary" disabled>撤回审批</button>
            </form>
          </c:if>
          <c:if test="${canManageCampaigns}">
          <c:if test="${canManageCampaigns and (campaignDetail.status eq 'DRAFT' or campaignDetail.status eq 'PENDING_APPROVAL')}"><a class="md-detail-refresh" href="<c:out value='${testUrl}'/>">发送测试邮件 →</a></c:if>
          <c:if test="${campaignDetail.status eq 'DRAFT'}">
            <form method="post" action="${ctx}/mobile/campaigns/action" data-mobile-campaign-action data-requires-guard="true" data-confirm-message="确认提交此活动审批？">
              <input type="hidden" name="shop" value="<c:out value='${campaignDetail.shopDomain}'/>"><input type="hidden" name="campaignId" value="<c:out value='${campaignDetail.campaignId}'/>"><input type="hidden" name="action" value="SUBMIT"><button type="submit" disabled>提交审批</button>
            </form>
          </c:if>
          <c:if test="${canManageCampaigns and campaignDetail.pendingApproval}">
            <form method="post" action="${ctx}/mobile/campaigns/action" data-mobile-campaign-action data-requires-guard="true" data-confirm-message="确认批准活动并开始冻结受众？">
              <input type="hidden" name="shop" value="<c:out value='${campaignDetail.shopDomain}'/>"><input type="hidden" name="campaignId" value="<c:out value='${campaignDetail.campaignId}'/>"><input type="hidden" name="action" value="APPROVE"><button type="submit" disabled>批准</button>
            </form>
            <form method="post" action="${ctx}/mobile/campaigns/action" data-mobile-campaign-action data-requires-guard="true" data-confirm-message="确认批准活动，并在受众冻结完成后自动提交发送？">
              <input type="hidden" name="shop" value="<c:out value='${campaignDetail.shopDomain}'/>"><input type="hidden" name="campaignId" value="<c:out value='${campaignDetail.campaignId}'/>"><input type="hidden" name="action" value="APPROVE_AND_SEND">
              <label><input type="checkbox" name="confirmNotSubscribed" value="true"><span>如有尚未明确订阅的客户，我确认向其发送</span></label><button type="submit" class="secondary" disabled>批准并发送</button>
            </form>
            <form method="post" action="${ctx}/mobile/campaigns/action" data-mobile-campaign-action data-requires-guard="true" data-reject-action="true" data-confirm-message="确认驳回？活动将返回草稿。">
              <input type="hidden" name="shop" value="<c:out value='${campaignDetail.shopDomain}'/>"><input type="hidden" name="campaignId" value="<c:out value='${campaignDetail.campaignId}'/>"><input type="hidden" name="action" value="REJECT">
              <label class="md-detail-field">驳回原因<textarea name="reason" required maxlength="500" rows="2" placeholder="请填写驳回原因"></textarea></label><button type="submit" class="danger" disabled>驳回活动</button>
            </form>
          </c:if>
          <c:if test="${campaignDetail.sendable or campaignDetail.status eq 'SCHEDULED'}">
            <form method="post" action="${ctx}/mobile/campaigns/action" data-mobile-campaign-action data-requires-guard="true" data-schedule-action="true" data-scheduled-at="<c:out value='${campaignDetail.scheduledAt}'/>" data-confirm-message="确认按所选时间发送当前冻结受众？">
              <input type="hidden" name="shop" value="<c:out value='${campaignDetail.shopDomain}'/>"><input type="hidden" name="campaignId" value="<c:out value='${campaignDetail.campaignId}'/>"><input type="hidden" name="action" value="${campaignDetail.status eq 'SCHEDULED' ? 'RESCHEDULE' : 'SCHEDULE'}"><input type="hidden" name="scheduledAt" value="">
              <label class="md-detail-field">发送日期和时间<input type="datetime-local" name="scheduleLocal" required step="60"></label>
              <p data-mobile-schedule-timezone>按当前设备时区选择时间</p>
              <c:if test="${campaignDetail.confirmationRequiredCount gt 0}"><label><input type="checkbox" name="confirmNotSubscribed" value="true" required><span>我确认向 <c:out value="${campaignDetail.confirmationRequiredCount}"/> 位尚未明确订阅的客户发送</span></label></c:if>
              <button type="submit" class="secondary" disabled><c:choose><c:when test="${campaignDetail.status eq 'SCHEDULED'}">修改定时</c:when><c:otherwise>定时发送</c:otherwise></c:choose></button>
            </form>
          </c:if>
          <c:if test="${campaignDetail.status eq 'SCHEDULED'}">
            <form method="post" action="${ctx}/mobile/campaigns/action" data-mobile-campaign-action data-requires-guard="true" data-confirm-message="确认取消定时？活动将回到已批准状态，不会自动发送。">
              <input type="hidden" name="shop" value="<c:out value='${campaignDetail.shopDomain}'/>"><input type="hidden" name="campaignId" value="<c:out value='${campaignDetail.campaignId}'/>"><input type="hidden" name="action" value="CANCEL_SCHEDULE"><button type="submit" class="danger" disabled>取消定时</button>
            </form>
          </c:if>
          <c:if test="${canManageCampaigns and campaignDetail.sendable}">
            <form method="post" action="${ctx}/mobile/campaigns/action" data-mobile-campaign-action data-requires-guard="true" data-confirm-message="确认向当前冻结受众创建发送任务？任务开始后不能修改受众、模板或发送通道。">
              <input type="hidden" name="shop" value="<c:out value='${campaignDetail.shopDomain}'/>"><input type="hidden" name="campaignId" value="<c:out value='${campaignDetail.campaignId}'/>"><input type="hidden" name="action" value="SEND">
              <c:if test="${campaignDetail.confirmationRequiredCount gt 0}"><label><input type="checkbox" name="confirmNotSubscribed" value="true" required><span>我确认向 <c:out value="${campaignDetail.confirmationRequiredCount}"/> 位尚未明确订阅的客户发送</span></label></c:if>
              <button type="submit" disabled>执行发送</button>
            </form>
          </c:if>
          <c:if test="${campaignDetail.status eq 'QUEUED' or campaignDetail.status eq 'RUNNING'}">
            <form method="post" action="${ctx}/mobile/campaigns/action" data-mobile-campaign-action data-requires-guard="true" data-confirm-message="确认暂停此活动的发送？">
              <input type="hidden" name="shop" value="<c:out value='${campaignDetail.shopDomain}'/>"><input type="hidden" name="campaignId" value="<c:out value='${campaignDetail.campaignId}'/>"><input type="hidden" name="action" value="PAUSE"><button type="submit" class="secondary" disabled>暂停发送</button>
            </form>
          </c:if>
          <c:if test="${campaignDetail.status eq 'PAUSED'}">
            <form method="post" action="${ctx}/mobile/campaigns/action" data-mobile-campaign-action data-requires-guard="true" data-confirm-message="确认继续发送此活动？">
              <input type="hidden" name="shop" value="<c:out value='${campaignDetail.shopDomain}'/>"><input type="hidden" name="campaignId" value="<c:out value='${campaignDetail.campaignId}'/>"><input type="hidden" name="action" value="RESUME"><button type="submit" disabled>继续发送</button>
            </form>
          </c:if>
          <c:if test="${campaignDetail.status eq 'PREPARING' or campaignDetail.status eq 'QUEUED' or campaignDetail.status eq 'RUNNING' or campaignDetail.status eq 'PAUSED'}">
            <form method="post" action="${ctx}/mobile/campaigns/action" data-mobile-campaign-action data-requires-guard="true" data-confirm-message="确认取消此活动？已提交给邮件通道的邮件无法撤回，尚未提交的邮件将不再发送。">
              <input type="hidden" name="shop" value="<c:out value='${campaignDetail.shopDomain}'/>"><input type="hidden" name="campaignId" value="<c:out value='${campaignDetail.campaignId}'/>"><input type="hidden" name="action" value="CANCEL"><button type="submit" class="danger" disabled>取消发送</button>
            </form>
          </c:if>
          </c:if>
        </div>
      </section>
    </c:if>

    <details class="md-detail-section">
      <summary>活动操作记录</summary>
      <dl class="md-detail-list">
        <div><dt>创建人</dt><dd><c:out value="${campaignActors.creator}" default="未记录"/><c:if test="${not empty campaignActors.createdAt}"><br><time data-browser-time="<c:out value='${campaignActors.createdAt}'/>" data-browser-time-format="date-time"><c:out value="${campaignActors.createdAt}"/></time></c:if></dd></div>
        <div><dt>审批人</dt><dd><c:out value="${campaignActors.approver}" default="未记录"/><c:if test="${not empty campaignActors.approvedAt}"><br><time data-browser-time="<c:out value='${campaignActors.approvedAt}'/>" data-browser-time-format="date-time"><c:out value="${campaignActors.approvedAt}"/></time></c:if></dd></div>
        <div><dt>执行人</dt><dd><c:out value="${campaignActors.executor}" default="未记录"/><c:if test="${not empty campaignActors.executedAt}"><br><time data-browser-time="<c:out value='${campaignActors.executedAt}'/>" data-browser-time-format="date-time"><c:out value="${campaignActors.executedAt}"/></time></c:if></dd></div>
      </dl>
    </details>
    <details class="md-detail-section" <c:if test="${campaignDetail.status eq 'RUNNING' or campaignDetail.status eq 'QUEUED' or campaignDetail.status eq 'PAUSED'}">open</c:if>>
      <summary id="md-jobs-title">发送任务明细</summary>
      <c:choose><c:when test="${empty campaignDetail.jobs}"><p>尚未创建发送任务。</p></c:when><c:otherwise>
        <c:forEach items="${campaignDetail.jobs}" var="job"><article class="md-detail-job"><strong><c:out value="${providerAliases[job.provider]}" default="${job.provider}"/> · <c:out value="${job.status}"/></strong><p><c:out value="${job.jobId}"/></p><progress max="100" value="<c:out value='${job.progressPercent}'/>"><c:out value="${job.progressPercent}"/>%</progress><small>已处理 <c:out value="${job.processed}"/> / <c:out value="${job.total}"/> · 失败 <c:out value="${job.failed}"/></small></article></c:forEach>
      </c:otherwise></c:choose>
    </details>
    <section class="md-detail-section" id="md-recipient-section" data-mobile-recipients
             data-url="${ctx}/campaigns/detail/recipients" data-context="<c:out value='${ctx}'/>"
             data-shop="<c:out value='${campaignDetail.shopDomain}'/>" data-campaign="<c:out value='${campaignDetail.campaignId}'/>"
             data-user="<c:out value='${logineduser.domainid}'/>:<c:out value='${logineduser.id}'/>">
      <h2>收件人执行明细</h2>
      <p class="mr-intro">发送、送达、打开、点击和下单状态按客户归并展示。每页 10 条，可打开客户查看资料、订单与行为。</p>
      <form class="mr-filter" data-recipient-form method="get" action="${ctx}/mobile/campaigns/detail">
        <input type="hidden" name="shop" value="<c:out value='${campaignDetail.shopDomain}'/>"><input type="hidden" name="campaignId" value="<c:out value='${campaignDetail.campaignId}'/>">
        <label for="mr-search">搜索收件人<input id="mr-search" type="search" name="q" maxlength="255" value="<c:out value='${campaignFilter.search}'/>" placeholder="客户姓名、邮箱或 ID"></label>
        <div class="mr-filter-row">
          <label for="mr-provider">发送通道<select id="mr-provider" name="provider"><option value="ALL">全部通道</option><c:forEach items="${campaignDetail.providers}" var="provider"><option value="<c:out value='${provider}'/>" <c:if test="${campaignFilter.provider eq provider}">selected</c:if>><c:out value="${providerAliases[provider]}" default="${provider}"/></option></c:forEach></select></label>
          <label for="mr-lifecycle">执行状态<select id="mr-lifecycle" name="lifecycle">
            <option value="ALL">全部状态</option>
            <option value="PENDING" <c:if test="${campaignFilter.lifecycle eq 'PENDING'}">selected</c:if>>待处理</option>
            <option value="ACCEPTED" <c:if test="${campaignFilter.lifecycle eq 'ACCEPTED'}">selected</c:if>>已接受</option>
            <c:if test="${canFilterCampaignNoFeedback}"><option value="NO_FEEDBACK" <c:if test="${campaignFilter.lifecycle eq 'NO_FEEDBACK'}">selected</c:if>>无回执</option></c:if>
            <option value="DELIVERED" <c:if test="${campaignFilter.lifecycle eq 'DELIVERED'}">selected</c:if>>已送达</option>
            <option value="OPENED" <c:if test="${campaignFilter.lifecycle eq 'OPENED'}">selected</c:if>>已打开</option>
            <option value="CLICKED" <c:if test="${campaignFilter.lifecycle eq 'CLICKED'}">selected</c:if>>已点击</option>
            <option value="CONVERTED" <c:if test="${campaignFilter.lifecycle eq 'CONVERTED'}">selected</c:if>>已下单</option>
            <option value="FAILED" <c:if test="${campaignFilter.lifecycle eq 'FAILED'}">selected</c:if>>失败</option>
            <option value="UNKNOWN" <c:if test="${campaignFilter.lifecycle eq 'UNKNOWN'}">selected</c:if>>结果未知</option>
            <option value="BOUNCED" <c:if test="${campaignFilter.lifecycle eq 'BOUNCED'}">selected</c:if>>退信</option>
            <option value="UNSUBSCRIBED" <c:if test="${campaignFilter.lifecycle eq 'UNSUBSCRIBED'}">selected</c:if>>退订</option>
            <option value="COMPLAINT" <c:if test="${campaignFilter.lifecycle eq 'COMPLAINT'}">selected</c:if>>投诉</option>
          </select></label>
        </div>
        <div class="mr-filter-actions"><button type="submit">查询</button><button type="button" data-recipient-clear>清除筛选</button></div>
      </form>
      <p class="mr-state" data-recipient-state role="status" aria-live="polite">收件人明细加载中…</p>
      <div data-recipient-results></div>
    </section>
  </main>
  <%@ include file="fragments/footer.jspf" %>
  <script src="${ctx}/shopify/mobile/campaign-detail.js?v=20261108-schedule" defer></script>
  <script src="${ctx}/shopify/mobile/campaign-recipients.js?v=20261110-3" defer></script>
</body>
</html>
