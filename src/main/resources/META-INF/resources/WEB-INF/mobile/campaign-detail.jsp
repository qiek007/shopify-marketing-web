<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ page language="java" pageEncoding="UTF-8" contentType="text/html; charset=UTF-8" %>
<c:set var="ctx" value="${pageContext.request.contextPath}"/>
<c:set var="mobilePage" value="campaigns"/>
<c:url var="detailUrl" value="/mobile/campaigns/detail"><c:param name="shop" value="${campaignDetail.shopDomain}"/><c:param name="campaignId" value="${campaignDetail.campaignId}"/></c:url>
<c:url var="listUrl" value="/mobile/campaigns"><c:param name="shop" value="${campaignDetail.shopDomain}"/></c:url>
<c:url var="testUrl" value="/mobile/campaigns/editor"><c:param name="shop" value="${campaignDetail.shopDomain}"/><c:param name="campaignId" value="${campaignDetail.campaignId}"/><c:param name="mode" value="test"/></c:url>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>活动详情</title>
  <link rel="stylesheet" href="${ctx}/shopify/mobile/mobile.css">
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
    .md-detail-list { margin:0; } .md-detail-list div { display:flex; justify-content:space-between; gap:16px; padding:9px 0; border-bottom:1px solid #edf2ef; }
    .md-detail-list div:last-child { border-bottom:0; } .md-detail-list dt { color:#5a6e64; } .md-detail-list dd { margin:0; text-align:right; overflow-wrap:anywhere; }
    .md-detail-job { padding:12px 0; border-top:1px solid #edf2ef; overflow-wrap:anywhere; }
    .md-detail-job progress { display:block; width:100%; height:10px; margin:9px 0; accent-color:#17644a; }
    .md-detail-refresh { display:inline-block; padding:10px 0; color:#17644a; font-weight:700; }
  </style>
</head>
<body>
  <%@ include file="fragments/header.jspf" %>
  <main class="mobile-main">
    <a class="md-detail-back" href="<c:out value='${listUrl}'/>">← 返回活动列表</a>
    <p class="md-detail-eyebrow">营销活动 / 执行详情</p>
    <h1 class="md-detail-title"><c:out value="${campaignDetail.name}"/></h1>
    <span class="md-detail-status"><c:choose>
      <c:when test="${campaignDetail.status eq 'DRAFT'}">草稿</c:when><c:when test="${campaignDetail.status eq 'PENDING_APPROVAL'}">待审批</c:when>
      <c:when test="${campaignDetail.status eq 'APPROVED'}">已批准</c:when><c:when test="${campaignDetail.status eq 'PREPARING'}">准备发送</c:when>
      <c:when test="${campaignDetail.status eq 'QUEUED'}">等待发送</c:when><c:when test="${campaignDetail.status eq 'RUNNING'}">发送中</c:when>
      <c:when test="${campaignDetail.status eq 'PAUSED'}">已暂停</c:when><c:when test="${campaignDetail.status eq 'COMPLETED'}">已完成</c:when>
      <c:when test="${campaignDetail.status eq 'CANCELLED'}">已取消</c:when><c:when test="${campaignDetail.status eq 'FAILED'}">失败</c:when>
      <c:when test="${campaignDetail.status eq 'SCHEDULED'}">已定时</c:when><c:otherwise><c:out value="${campaignDetail.status}"/></c:otherwise>
    </c:choose></span>

    <c:if test="${not empty successMessage}"><p role="status" class="md-detail-note"><c:out value="${successMessage}"/></p></c:if>
    <c:if test="${not empty errorMessage}"><p role="alert" class="md-detail-note md-detail-error"><c:out value="${errorMessage}"/></p></c:if>
    <c:if test="${campaignDetail.status eq 'APPROVED' and approvedSendState eq 'APPROVE_AND_SEND'}"><p class="md-detail-note">已批准，系统正在冻结受众；完成后自动提交发送。</p></c:if>
    <c:if test="${campaignDetail.status eq 'APPROVED' and approvedSendState eq 'APPROVE_AND_SEND_FAILED'}"><p role="alert" class="md-detail-note md-detail-error">自动发送未完成，请检查受众、额度和模板状态，刷新后确认是否需要手动发送。</p></c:if>

    <section class="md-detail-section" aria-labelledby="md-progress-title">
      <h2 id="md-progress-title">执行进度</h2>
      <div class="md-detail-grid">
        <article class="md-detail-metric"><span>冻结受众</span><strong><c:out value="${campaignDetail.summary.audience}" default="0"/></strong><small><c:out value="${campaignDetail.snapshotStatusDisplayName}"/> · 已检查 <c:out value="${campaignDetail.snapshotProcessedCount}"/> 条</small></article>
        <article class="md-detail-metric"><span>发送处理</span><strong><c:out value="${campaignDetail.summary.progressPercent}" default="0"/>%</strong><small>接受 <c:out value="${campaignDetail.summary.accepted}"/> · 失败 <c:out value="${campaignDetail.summary.failed}"/> · 未知 <c:out value="${campaignDetail.summary.unknown}"/></small></article>
        <article class="md-detail-metric"><span>送达</span><strong><c:out value="${campaignDetail.summary.delivered}" default="0"/></strong><small>打开 <c:out value="${campaignDetail.summary.openedRecipients}"/> 人 · 点击 <c:out value="${campaignDetail.summary.clickedRecipients}"/> 人</small></article>
        <article class="md-detail-metric"><span>转化</span><strong><c:out value="${campaignDetail.summary.orders}" default="0"/> 单</strong><small>客户 <c:out value="${campaignDetail.summary.convertedRecipients}"/> · <c:out value="${campaignDetail.summary.netRevenue}"/></small></article>
      </div>
      <c:if test="${campaignDetail.status eq 'APPROVED' and not campaignDetail.audienceReady}"><p class="md-detail-note">受众冻结中，完成前不能发送。请刷新查看进度。</p></c:if>
      <c:if test="${campaignDetail.audienceReady and campaignDetail.summary.audience eq 0}"><p class="md-detail-note">冻结受众为空，不能发送；请在电脑端检查分群并重新生成受众。</p></c:if>
      <a class="md-detail-refresh" href="<c:out value='${detailUrl}'/>">↻ 刷新执行数据</a>
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
        <div><dt>重复发送间隔</dt><dd><c:choose><c:when test="${campaignDetail.repeatIntervalHours eq 0}">不限制</c:when><c:otherwise><c:out value="${campaignDetail.repeatIntervalHours}"/> 小时</c:otherwise></c:choose></dd></div>
      </dl>
    </section>
    <c:if test="${canManageCampaigns}">
      <section class="md-detail-section" aria-labelledby="md-actions-title">
        <h2 id="md-actions-title">活动操作</h2>
        <p data-mobile-action-loading>操作组件加载中；如长时间未完成，请刷新页面。</p>
        <div class="md-detail-actions">
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
        </div>
      </section>
    </c:if>

    <section class="md-detail-section" aria-labelledby="md-jobs-title">
      <h2 id="md-jobs-title">发送任务</h2>
      <c:choose><c:when test="${empty campaignDetail.jobs}"><p>尚未创建发送任务。</p></c:when><c:otherwise>
        <c:forEach items="${campaignDetail.jobs}" var="job"><article class="md-detail-job"><strong><c:out value="${providerAliases[job.provider]}" default="${job.provider}"/> · <c:out value="${job.status}"/></strong><p><c:out value="${job.jobId}"/></p><progress max="100" value="<c:out value='${job.progressPercent}'/>"><c:out value="${job.progressPercent}"/>%</progress><small>已处理 <c:out value="${job.processed}"/> / <c:out value="${job.total}"/> · 失败 <c:out value="${job.failed}"/></small></article></c:forEach>
      </c:otherwise></c:choose>
    </section>
  </main>
  <%@ include file="fragments/footer.jspf" %>
  <script src="${ctx}/shopify/mobile/campaign-detail.js" defer></script>
</body>
</html>
