<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<c:set var="ctx" value="${pageContext.request.contextPath}" />
<c:set var="mobilePage" value="campaigns" />
<c:url var="mobileCampaignListUrl" value="/mobile/campaigns"><c:param name="shop" value="${selectedShop}" /></c:url>
<c:url var="mobileCampaignDetailUrl" value="/mobile/campaigns/detail"><c:param name="shop" value="${selectedShop}" /><c:param name="campaignId" value="${editorCampaign.campaignId}" /></c:url>
<!doctype html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <title>创建营销活动</title>
    <link rel="stylesheet" href="${ctx}/shopify/mobile/mobile.css?v=20261108">
    <style>
        .mobile-editor-intro { margin: 0 0 20px; color: #536b64; line-height: 1.6; }
        .mobile-editor-card { margin: 0 0 14px; padding: 18px; border: 1px solid #d9e7df; border-radius: 14px; background: #fff; }
        .mobile-editor-card h2 { margin: 0 0 14px; color: #174a3a; font-size: 17px; }
        .mobile-editor-card label:not(.mobile-check) { display: grid; gap: 7px; margin: 14px 0; font-weight: 600; }
        .mobile-editor-card input[type=text], .mobile-editor-card select, .mobile-editor-card textarea { box-sizing: border-box; width: 100%; min-height: 46px; padding: 10px 12px; border: 1px solid #adbbb4; border-radius: 8px; background: #fff; font-size: 16px; }
        .mobile-editor-card button, .mobile-editor-card a { min-height: 44px; }
        .mobile-check { display: flex; gap: 10px; align-items: flex-start; margin: 12px 0; line-height: 1.5; }
        .mobile-check input { width: 19px; height: 19px; flex: 0 0 19px; margin-top: 2px; accent-color: #176c4c; }
        .mobile-note { color: #52645c; line-height: 1.6; font-size: 14px; }
        .mobile-editor-status { padding: 12px; border-radius: 8px; background: #eef6f1; color: #174a3a; line-height: 1.5; }
        .mobile-editor-actions { display: flex; flex-wrap: wrap; gap: 10px; }
        .mobile-editor-actions button, .mobile-editor-actions a { box-sizing: border-box; padding: 10px 16px; border: 1px solid #176c4c; border-radius: 8px; background: #fff; color: #176c4c; text-decoration: none; font-weight: 600; }
        .mobile-editor-actions button[type=submit] { background: #176c4c; color: white; }
        .mobile-editor-actions button:disabled { opacity: .5; }
        .mobile-preview-frame { width: 100%; min-height: 320px; border: 1px solid #d9e7df; background: white; }
        .mobile-test-record { padding: 12px 0; border-top: 1px solid #d9e7df; overflow-wrap: anywhere; }
        .mobile-test-record p { margin: 5px 0; }
        .mobile-editor-progress { margin: 0 0 14px; }
        .mobile-editor-progress ol { display: flex; padding: 0; margin: 0 0 8px; list-style: none; gap: 6px; }
        .mobile-editor-progress li { flex: 1; text-align: center; padding: 7px 0; border-bottom: 3px solid #d9e7df; color: #657970; font-size: 13px; }
        .mobile-editor-progress li[aria-current=step] { border-color: #087453; color: #087453; font-weight: 700; }
        .mobile-editor-progress p { margin: 0; color: #657970; font-size: 12px; }
        .mobile-step-navigation { position: sticky; bottom: 0; display: flex; justify-content: space-between; gap: 10px; padding: 12px 0 max(12px, env(safe-area-inset-bottom)); background: #f3f7f4; z-index: 2; }
        .mobile-step-navigation button { flex: 1; min-height: 46px; border: 1px solid #176c4c; border-radius: 9px; background: #fff; color: #176c4c; font: inherit; font-weight: 700; }
        #mobile-editor-next, #mobile-save-campaign { background: #176c4c; color: #fff; }
        .mobile-step-error { padding: 10px 12px; color: #962f25; background: #fff0ed; border-radius: 8px; }
        .mobile-editor-review { margin: 0 0 16px; }
        .mobile-editor-review div { padding: 10px 0; border-bottom: 1px solid #e7eee9; }
        .mobile-editor-review dt { font-size: 12px; color: #657970; }
        .mobile-editor-review dd { margin: 4px 0 0; overflow-wrap: anywhere; white-space: pre-wrap; }
        [hidden] { display: none !important; }
    </style>
</head>
<body>
<%@ include file="fragments/header.jspf" %>
<main class="mobile-main">
    <a class="mobile-button" data-mobile-list-return href="<c:out value='${mobileCampaignListUrl}'/>">← 活动列表</a>
    <h1><c:choose><c:when test="${editorCampaign.existing}">测试邮件</c:when><c:otherwise>创建营销活动</c:otherwise></c:choose></h1>
    <p class="mobile-editor-intro">保存为草稿后，可在详情中测试邮件和提交审批。</p>
    <c:if test="${not empty successMessage}"><p class="mobile-notice" role="status"><c:out value="${successMessage}" /></p></c:if>
    <c:if test="${not empty errorMessage}"><p class="mobile-notice error" role="alert"><c:out value="${errorMessage}" /></p></c:if>
    <c:choose>
        <c:when test="${editorCampaign.existing}">
            <section class="mobile-editor-card"><h2>测试邮件</h2><p>已有活动的配置请在电脑端编辑；测试邮件使用活动已保存的模板及配置。</p>
                <c:choose>
                    <c:when test="${canManageCampaigns and (editorCampaign.status eq 'DRAFT' or editorCampaign.status eq 'PENDING_APPROVAL')}">
                        <c:set var="testChannelCount" value="0" />
                        <c:forEach items="${senderSettings}" var="setting"><c:if test="${editorCampaign.providerSelections[setting.provider]}"><c:set var="testChannelCount" value="${testChannelCount + 1}" /></c:if></c:forEach>
                        <c:choose><c:when test="${testChannelCount gt 0}">
                            <form id="mobile-campaign-test-form" method="post" action="${ctx}/mobile/campaigns/test-send">
                                <input type="hidden" name="shop" value="<c:out value='${selectedShop}'/>">
                                <input type="hidden" name="campaignId" value="<c:out value='${editorCampaign.campaignId}'/>">
                                <input type="hidden" name="requestToken" value="${campaignTestRequestToken}">
                                <label><span>测试邮箱（最多 10 个）</span><textarea name="recipients" rows="3" required placeholder="多个邮箱用逗号、分号或换行分隔"></textarea></label>
                                <label><span>测试发送通道</span><select name="provider" required>
                                    <c:forEach items="${senderSettings}" var="setting"><c:if test="${editorCampaign.providerSelections[setting.provider]}"><option value="<c:out value='${setting.provider}'/>"><c:out value="${providerAliases[setting.provider]}" default="${setting.provider}" /></option></c:if></c:forEach>
                                </select></label>
                                <div class="mobile-editor-actions"><button type="submit" disabled>发送测试邮件</button></div>
                                <p id="mobile-test-send-status" class="mobile-note" role="status" aria-live="polite"></p>
                            </form>
                        </c:when><c:otherwise><p role="alert">活动没有可用的测试发送通道，请在电脑端检查配置。</p></c:otherwise></c:choose>
                    </c:when>
                    <c:otherwise><p>当前活动状态或账号权限不支持发送测试邮件。</p></c:otherwise>
                </c:choose>
                <c:if test="${canManageCampaigns}">
                    <h3>近期测试记录</h3>
                    <c:choose><c:when test="${empty campaignTestSendHistory}"><p class="mobile-note">暂无测试邮件记录。</p></c:when><c:otherwise>
                        <c:forEach items="${campaignTestSendHistory}" var="testItem" begin="0" end="19">
                            <article class="mobile-test-record">
                                <p><strong><c:out value="${testItem.recipientEmail}" /></strong></p>
                                <p>通道：<c:out value="${providerAliases[testItem.provider]}" default="${testItem.provider}" /></p>
                                <p>发送：<c:out value="${testItem.sendStatusDisplayName}" /> · 送达：<c:out value="${testItem.deliveryStatusDisplayName}" /></p>
                                <c:if test="${not empty testItem.lastErrorCode}"><p>错误：<c:out value="${testItem.lastErrorCode}" /></p></c:if>
                                <p>提交时间：<time data-browser-time="<c:out value='${testItem.requestedAt}'/>" datetime="<c:out value='${testItem.requestedAt}'/>"><c:out value="${testItem.requestedAt}" default="—" /></time></p>
                            </article>
                        </c:forEach>
                        <p class="mobile-note">仅展示最近 20 条收件人记录；可刷新查看最新状态。</p>
                    </c:otherwise></c:choose>
                </c:if>
                <p><a href="<c:out value='${mobileCampaignDetailUrl}'/>">返回活动详情</a></p></section>
        </c:when>
        <c:when test="${not canManageCampaigns}">
            <section class="mobile-editor-card"><p>当前账号没有创建活动的权限。</p></section>
        </c:when>
        <c:otherwise>
            <form id="mobile-campaign-form" method="post" action="${ctx}/mobile/campaigns" data-context="<c:out value='${ctx}'/>">
                <div class="mobile-editor-progress" id="mobile-editor-progress" hidden>
                    <ol aria-label="创建步骤"><li>1 内容</li><li>2 受众</li><li>3 通道</li><li>4 确认</li></ol>
                    <p id="mobile-editor-step-status" role="status" aria-live="polite"></p>
                </div>
                <p id="mobile-editor-step-error" class="mobile-step-error" role="alert" hidden></p>
                <input type="hidden" name="shop" value="<c:out value='${selectedShop}'/>">
                <input type="hidden" name="campaignVariables" value="{}">
                <input type="hidden" name="channelWeightsJson" disabled>
                <section class="mobile-editor-card" data-editor-step>
                    <h2>01 · 活动内容</h2>
                    <label><span>活动名称</span><input type="text" name="name" maxlength="255" enterkeyhint="next" autocomplete="off" required></label>
                    <label><span>已发布邮件模板</span>
                        <select name="templateId" required>
                            <option value="">请选择模板</option>
                            <c:forEach items="${templates}" var="template">
                                <c:if test="${template.status eq 'PUBLISHED'}"><option value="<c:out value='${template.templateId}'/>"><c:out value="${template.name}" /></option></c:if>
                            </c:forEach>
                        </select>
                    </label>
                    <p id="mobile-template-status" class="mobile-editor-status" role="status" aria-live="polite">请选择已发布模板。</p>
                    <div id="mobile-campaign-variables"></div>
                    <div class="mobile-editor-actions"><button type="button" id="mobile-preview-template" disabled>预览已发布模板</button></div>
                    <div id="mobile-template-preview" hidden>
                        <p id="mobile-preview-status" class="mobile-note" role="status"></p>
                        <iframe id="mobile-preview-frame" class="mobile-preview-frame" title="已发布邮件模板预览" sandbox="" referrerpolicy="no-referrer"></iframe>
                    </div>
                    <p class="mobile-note">商品、优惠券及复杂模板请在电脑端配置。</p>
                </section>
                <section class="mobile-editor-card" data-editor-step>
                    <h2>02 · 选择受众</h2>
                    <label><span>已有客户分群</span><select name="segmentId"><option value="">不使用客户分群</option>
                        <c:forEach items="${segments}" var="segment"><option value="<c:out value='${segment.segmentId}'/>"><c:out value="${segment.name}" /> · <c:out value="${segment.ruleSummary}" /></option></c:forEach>
                    </select></label>
                    <label class="mobile-check"><input type="checkbox" name="allCustomersConfirmed" value="true"><span>未选择分群时，我确认面向全部符合发送资格的客户。</span></label>
                    <p class="mobile-note">需要组合客户标签时，请在电脑端创建活动。</p>
                </section>
                <section class="mobile-editor-card" data-editor-step>
                    <h2>03 · 发送配置</h2>
                    <p class="mobile-note">请选择发送通道，按选中通道等权分配批次。重复发送间隔默认 24 小时，数据保留 14 天；归因来源为 auw、媒介为 email。</p>
                    <c:choose><c:when test="${empty senderSettings}"><p role="alert">当前店铺没有可用的发送通道，请先在电脑端配置。</p></c:when>
                    <c:otherwise><c:forEach items="${senderSettings}" var="setting">
                        <label class="mobile-check"><input type="checkbox" name="providers" value="<c:out value='${setting.provider}'/>" checked>
                            <span><strong><c:out value="${providerAliases[setting.provider]}" default="${setting.provider}" /></strong><br><c:out value="${setting.fromHeader}" /></span></label>
                    </c:forEach></c:otherwise></c:choose>
                </section>
                <section class="mobile-editor-card" data-editor-step>
                    <h2>04 · 保存草稿</h2>
                    <dl id="mobile-editor-review" class="mobile-editor-review"></dl>
                    <p class="mobile-note">保存后可在活动详情中测试、提交审批并查看进度。</p>
                </section>
                <div class="mobile-step-navigation">
                    <button type="button" id="mobile-editor-previous" hidden>上一步</button>
                    <button type="button" id="mobile-editor-next" hidden>下一步</button>
                    <button type="submit" id="mobile-save-campaign" disabled>保存活动</button>
                </div>
            </form>
        </c:otherwise>
    </c:choose>
</main>
<%@ include file="fragments/footer.jspf" %>
<script src="${ctx}/shopify/mobile/campaign-editor.js?v=20261108-steps2" defer></script>
</body>
</html>
