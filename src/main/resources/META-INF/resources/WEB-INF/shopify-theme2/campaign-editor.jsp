<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ page language="java" pageEncoding="UTF-8" contentType="text/html; charset=UTF-8" %>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${editorCampaign.existing ? '编辑活动' : '创建活动'} - Shopify 邮件营销</title>
    <c:set var="ctx" value="${pageContext.request.contextPath}"/>
    <link rel="stylesheet" href="${ctx}/baseui/static/h-ui/css/H-ui.min.css">
    <link rel="stylesheet" href="${ctx}/baseui/static/h-ui.admin/css/H-ui.admin.css">
    <link rel="stylesheet" href="${ctx}/baseui/lib/font-awesome-4.7.0/css/font-awesome.min.css">
    <link rel="stylesheet" href="${ctx}${uiAssetBase}/css/dashboard.css?v=20261010-p93">
    <link rel="stylesheet" href="${ctx}/shopify/css/campaign-channel-weights.css?v=20261105-weights-card1">
    <link rel="stylesheet" href="${ctx}/shopify/css/campaign-search-picker.css?v=20261107-tag-mode1">
</head>
<body class="shopify-console">
<%@ include file="fragments/header.jspf" %>
<div class="console-layout">
    <%@ include file="fragments/navigation.jspf" %>
    <main class="console-main">
        <a class="back-link" href="${ctx}/campaigns?shop=${selectedShop}"><i class="fa fa-arrow-left"></i> 返回活动列表</a>
        <section class="page-heading"><div><p class="eyebrow">营销活动</p><h1>${editorCampaign.existing ? '编辑活动' : '创建活动'}</h1><p>审批通过后按当前配置生成受众快照，发送必须等待快照完成</p></div><c:if test="${editorCampaign.existing}"><span class="status-pill neutral"><c:out value="${editorCampaign.status}"/></span></c:if></section>
        <c:if test="${not empty errorMessage}"><div class="flash-message danger"><i class="fa fa-exclamation-circle"></i><c:out value="${errorMessage}"/></div></c:if>
        <section class="content-section form-section">
            <c:choose>
                <c:when test="${empty senderSettings}"><div class="empty-state compact"><i class="fa fa-envelope-o"></i><strong>尚未配置店铺发件身份</strong><span>请先到“我的店铺”配置至少一个邮件通道的发件身份。</span></div></c:when>
                <c:when test="${empty templates}"><div class="empty-state compact"><i class="fa fa-file-text-o"></i><strong>尚未发布邮件模板</strong><span>请先建立并发布一个邮件模板。</span><a class="primary-button" href="${ctx}/templates?shop=${selectedShop}">管理邮件模板</a></div></c:when>
                <c:otherwise>
                    <form class="workspace-form" method="post" action="${ctx}/campaigns">
                        <input type="hidden" name="shop" value="${selectedShop}">
                        <input type="hidden" name="campaignId" value="${editorCampaign.campaignId}">
                        <input id="campaign-variables" type="hidden" name="campaignVariables" value="<c:out value='${editorCampaign.campaignVariablesJson}'/>">
                        <div class="form-actions spaced-actions campaign-editor-top-actions"><a class="action-button" href="${ctx}/campaigns?shop=${selectedShop}">取消</a><button class="primary-button" type="submit" <c:if test="${not canManageCampaigns}">disabled hidden</c:if>><i class="fa fa-save"></i>保存活动</button><c:if test="${canManageCampaigns and editorCampaign.existing and editorCampaign.status eq 'DRAFT'}"><button class="action-button danger-action" type="submit" form="campaign-draft-delete-form" formnovalidate><i class="fa fa-trash" aria-hidden="true"></i><span>删除草稿</span></button></c:if></div>
                        <div class="form-grid campaign-editor-basics">
                            <label><span>活动名称 <span class="required-marker" aria-hidden="true">*</span></span><input name="name" value="${editorCampaign.name}" required maxlength="255"></label>
                            <div class="campaign-segment-field"><label for="campaign-template">邮件模板</label><div class="campaign-search-picker" id="campaign-template-picker"><select id="campaign-template" name="templateId" required><c:forEach items="${templates}" var="template"><option value="${template.templateId}" ${template.templateId eq editorCampaign.templateId ? 'selected' : ''}><c:out value="${template.name}"/></option></c:forEach></select><button class="campaign-picker-trigger" type="button" data-picker-trigger hidden aria-label="选择邮件模板" aria-haspopup="listbox" aria-expanded="false" aria-controls="campaign-template-options"><span data-picker-label>选择邮件模板</span><i class="fa fa-angle-down" aria-hidden="true"></i></button><div class="campaign-picker-panel" data-picker-panel hidden><input class="campaign-picker-search" type="search" data-picker-search placeholder="搜索邮件模板" aria-label="搜索邮件模板" autocomplete="off"><div class="campaign-picker-options" id="campaign-template-options" data-picker-options role="listbox" aria-label="邮件模板列表"></div><span class="campaign-picker-status" data-picker-status role="status" hidden></span></div></div></div>
                            <label><span>限制重复发送间隔（小时，0为不限制）</span><input name="repeatIntervalHours" type="number" min="0" max="8760" step="1" value="${editorCampaign.repeatIntervalHours}" required></label>
                            <label><span>活动有效天数（7-60天）</span><input name="hotRetentionDays" type="number" min="7" max="60" step="1" value="${editorCampaign.hotRetentionDays}" required></label>
                        </div>
                        <style>.campaign-audience-relation { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 18px; margin: 12px 0 0; padding: 10px 12px; border: 1px solid #d6dee6; border-radius: 5px; background: #f8fafb; } .campaign-audience-relation legend { width: auto; margin: 0; padding: 0 4px; border: 0; color: #4e5c69; font-size: 12px; font-weight: 600; } .campaign-audience-relation-options label { display: inline-flex; align-items: center; gap: 5px; margin: 0; white-space: nowrap; cursor: pointer; } .campaign-audience-relation-options input[type="radio"] { width: 15px !important; min-height: 15px !important; height: 15px; margin: 0; accent-color: #16865a; } .campaign-audience-relation small { color: #687d89; line-height: 1.5; } .campaign-audience-relation-options { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 18px; width: 100%; } .campaign-audience-relation > .form-grid { flex: 0 0 100%; width: 100%; } .form-grid.campaign-editor-basics { grid-template-columns: minmax(0, 2.55fr) repeat(3, minmax(0, 1.15fr)); } .campaign-editor-basics > label { align-content: start; } .campaign-editor-top-actions { margin-top: 0; } @media (max-width: 1100px) { .form-grid.campaign-editor-basics { grid-template-columns: repeat(2, minmax(0, 1fr)); } } @media (max-width: 620px) { .form-grid.campaign-editor-basics { grid-template-columns: 1fr; } } .campaign-content-panel { min-width: 0; margin: 12px 0 0; padding: 10px 12px; border: 1px solid #d6dee6; border-radius: 5px; background: #f8fafb; } .campaign-content-panel > legend { width: auto; margin: 0; padding: 0 4px; border: 0; color: #4e5c69; font-size: 12px; font-weight: 600; }</style><section class="campaign-audience-tags"><fieldset class="campaign-audience-relation"><legend>分群与标签</legend><div class="campaign-audience-relation-options"><c:if test="${not empty editorCampaign.segmentTagRelation}"><label><input type="radio" name="segmentTagRelation" value="AND" <c:if test="${editorCampaign.segmentTagRelation ne 'OR'}">checked</c:if>><span>交集（同时符合）</span></label><label><input type="radio" name="segmentTagRelation" value="OR" <c:if test="${editorCampaign.segmentTagRelation eq 'OR'}">checked</c:if>><span>并集（任一符合）</span></label><c:if test="${canPreviewDraftAudience and editorCampaign.status eq 'DRAFT'}"><button type="button" class="action-button" data-draft-preview-open aria-controls="campaign-draft-audience-preview">预览受众</button></c:if><small>标签结果先包含及排除，再与分群组合；并集时符合分群的客户不受排除标签限制。</small></c:if><c:if test="${empty editorCampaign.segmentTagRelation}"><small>当前服务端尚未支持分群与标签并集，暂按交集计算。</small></c:if></div><div class="form-grid three"><c:choose><c:when test="${editorCampaign.segmentIds ne null}">
                            <div class="customer-tag-field"><span>基础客户分群（可多选）</span>
                                <details class="customer-tag-select" id="campaign-segment-multi">
                                    <summary><span>选择客户分群</span><i class="fa fa-angle-down" aria-hidden="true"></i></summary>
                                    <div class="customer-tag-options">
                                        <input type="search" data-tag-search placeholder="搜索客户分群" aria-label="搜索客户分群" autocomplete="off">
                                        <small>命中任一分群即可，重复客户只算一次。最多选择 20 个。</small>
                                        <span class="customer-tag-search-empty" data-tag-search-empty hidden>没有匹配分群</span>
                                        <c:forEach items="${segments}" var="segment">
                                            <label><input type="checkbox" name="segmentIds" value="<c:out value='${segment.segmentId}'/>" <c:if test="${editorCampaign.segmentIds.contains(segment.segmentId)}">checked</c:if>>
                                                <span><c:out value="${segment.name}"/><small> · <c:out value="${segment.ruleSummary}"/></small></span>
                                            </label>
                                        </c:forEach>
                                        <c:forEach items="${editorCampaign.segmentIds}" var="selectedSegmentId">
                                            <c:set var="selectedSegmentAvailable" value="${false}"/>
                                            <c:forEach items="${segments}" var="segment"><c:if test="${segment.segmentId eq selectedSegmentId}"><c:set var="selectedSegmentAvailable" value="${true}"/></c:if></c:forEach>
                                            <c:if test="${not selectedSegmentAvailable}"><label><input type="checkbox" name="segmentIds" value="<c:out value='${selectedSegmentId}'/>" checked>
                                                <span>原分群已失效，请取消勾选或更换</span></label></c:if>
                                        </c:forEach>
                                    </div>
                                </details>
                            </div>
                            </c:when><c:otherwise><div class="campaign-segment-field"><label for="campaign-segment">基础客户分群（可选）</label><div class="campaign-search-picker" id="campaign-segment-picker"><select id="campaign-segment" name="segmentId"><option value="">不使用动态分群</option><c:forEach items="${segments}" var="segment"><option value="${segment.segmentId}" ${segment.segmentId eq editorCampaign.segmentId ? 'selected' : ''}><c:out value="${segment.name}"/> · <c:out value="${segment.ruleSummary}"/></option></c:forEach></select><button class="campaign-picker-trigger" type="button" data-picker-trigger hidden aria-label="选择基础客户分群" aria-haspopup="listbox" aria-expanded="false" aria-controls="campaign-segment-options"><span data-picker-label>不使用动态分群</span><i class="fa fa-angle-down" aria-hidden="true"></i></button><div class="campaign-picker-panel" data-picker-panel hidden><input class="campaign-picker-search" type="search" data-picker-search placeholder="搜索客户分群" aria-label="搜索客户分群" autocomplete="off"><div class="campaign-picker-options" id="campaign-segment-options" data-picker-options role="listbox" aria-label="客户分群列表"></div><span class="campaign-picker-status" data-picker-status role="status" hidden></span></div></div></div></c:otherwise></c:choose><div class="customer-tag-field"><span>包含标签（可选）</span><details class="customer-tag-select"><summary><span>包含标签（多选）</span><i class="fa fa-angle-down"></i></summary><div class="customer-tag-options"><div class="customer-tag-toolbar"><input type="search" data-tag-search placeholder="搜索包含标签" aria-label="搜索包含标签" autocomplete="off"><div class="customer-tag-mode" role="radiogroup" aria-label="包含标签关系"><label><input type="radio" name="includeTagMode" value="ANY" <c:if test="${editorCampaign.includeTagMode ne 'ALL'}">checked</c:if>><span>满足任意一个</span></label><label><input type="radio" name="includeTagMode" value="ALL" <c:if test="${editorCampaign.includeTagMode eq 'ALL'}">checked</c:if>><span>必须拥有全部</span></label></div></div><span class="customer-tag-search-empty" data-tag-search-empty hidden>没有匹配标签</span><c:forEach items="${customerTags}" var="tag"><label><input type="checkbox" name="includeTags" value="<c:out value='${tag}'/>" <c:if test="${editorCampaign.includeTags.contains(tag)}">checked</c:if>><span><c:out value="${tag}"/></span></label></c:forEach></div></details></div><div class="customer-tag-field"><span>排除标签（可选）</span><details class="customer-tag-select"><summary><span>排除标签（多选）</span><i class="fa fa-angle-down"></i></summary><div class="customer-tag-options"><input type="search" data-tag-search placeholder="搜索排除标签" aria-label="搜索排除标签" autocomplete="off"><span class="customer-tag-search-empty" data-tag-search-empty hidden>没有匹配标签</span><c:forEach items="${customerTags}" var="tag"><label><input type="checkbox" name="excludeTags" value="<c:out value='${tag}'/>" <c:if test="${editorCampaign.excludeTags.contains(tag)}">checked</c:if>><span><c:out value="${tag}"/></span></label></c:forEach></div></details></div></div></fieldset><label class="checkbox-row"><input type="checkbox" name="allCustomersConfirmed" value="true" <c:if test="${editorCampaign.allCustomersConfirmed}">checked</c:if>><span>未选择分群和标签时，明确确认向全部符合发送资格的客户发送</span></label><c:if test="${canPreviewDraftAudience and editorCampaign.status eq 'DRAFT'}"><%@ include file="/WEB-INF/shared/campaign-draft-audience-preview.jspf" %></c:if></section>
                        <fieldset class="campaign-content-panel"><legend>活动内容</legend>
                        <div class="form-grid two campaign-message-field"><label><span>活动文案</span><input id="campaign-message" maxlength="500" placeholder="填写本次活动的邮件文案"><small class="field-note">模板中插入 {{campaignMessage}} 后显示此内容。</small></label></div>
                        <section class="campaign-personalization">
                            <div class="section-intro"><strong>活动内容参数<span class="campaign-personalization-note">（审批通过后与客户资料一起冻结，发送时提交给邮件通道动态模板）</span></strong></div>
                            <div id="campaign-custom-variables" class="form-grid two"></div>
                            <div class="campaign-product-compose">
                                <div class="campaign-product-picker"><label for="campaign-product">关联商品（最多 12 个）</label><div class="campaign-search-picker" id="campaign-product-picker"><select id="campaign-product" aria-label="选择关联商品"><option value="">选择商品后加入</option></select><button class="campaign-picker-trigger" type="button" data-picker-trigger hidden aria-label="选择关联商品" aria-haspopup="listbox" aria-expanded="false" aria-controls="campaign-product-options"><span data-picker-label>选择商品后加入</span><i class="fa fa-angle-down" aria-hidden="true"></i></button><div class="campaign-picker-panel" data-picker-panel hidden><input class="campaign-picker-search" id="campaign-product-search" type="search" data-picker-search placeholder="搜索当前店铺商品" aria-label="搜索当前店铺商品" autocomplete="off"><div class="campaign-picker-options" id="campaign-product-options" data-picker-options role="listbox" aria-label="商品列表"></div><span class="campaign-picker-status" data-picker-status role="status" hidden></span></div></div><div id="campaign-product-inputs"><c:forEach items="${editorCampaign.productSourceIds}" var="productSourceId"><input type="hidden" name="productSourceIds" value="<c:out value='${productSourceId}'/>"></c:forEach></div></div>
                                <div class="campaign-discount-field"><label for="campaign-discount">优惠券</label><div class="campaign-search-picker" id="campaign-discount-picker"><select id="campaign-discount" name="discountSourceId" aria-label="选择优惠券"><option value="">不使用优惠券</option></select><button class="campaign-picker-trigger" type="button" data-picker-trigger hidden aria-label="选择优惠券" aria-haspopup="listbox" aria-expanded="false" aria-controls="campaign-discount-options"><span data-picker-label>不使用优惠券</span><i class="fa fa-angle-down" aria-hidden="true"></i></button><div class="campaign-picker-panel" data-picker-panel hidden><input class="campaign-picker-search" id="campaign-discount-search" type="search" data-picker-search placeholder="搜索有效优惠码" aria-label="搜索有效优惠码" autocomplete="off"><div class="campaign-picker-options" id="campaign-discount-options" data-picker-options role="listbox" aria-label="优惠券列表"></div><span class="campaign-picker-status" data-picker-status role="status" hidden></span></div></div></div>
                                <div class="campaign-selected-products"><div class="selected-products-header"><strong>已选商品</strong><span id="selected-products-count" aria-live="polite">0 / 12</span></div><div id="campaign-selected-products" class="selected-products-list" role="list" aria-live="polite"></div></div>
                            </div>
                        </section>
                        </fieldset>
                        <fieldset class="campaign-content-panel"><legend>UTM参数</legend>
                        <div class="form-grid two"><label><span>UTM 来源（utm_source）</span><input name="utmSource" value="<c:out value='${editorCampaign.utmSource}'/>" maxlength="128" required><small class="field-note">用于邮件链接归因，默认 auw。</small></label><label><span>UTM 媒介（utm_medium）</span><input name="utmMedium" value="<c:out value='${editorCampaign.utmMedium}'/>" maxlength="128" required><small class="field-note">用于邮件链接归因，默认 email。</small></label></div>
                        <div class="form-grid two"><label><span>UTM 活动（utm_campaign）</span><input name="utmCampaign" value="<c:out value='${editorCampaign.utmCampaign}'/>" maxlength="255" placeholder="留空时使用活动名称"><small class="field-note">可选；留空时使用活动名称。</small></label><label><span>UTM 内容（utm_content）</span><input name="utmContent" value="<c:out value='${editorCampaign.utmContent}'/>" maxlength="255" placeholder="留空时按链接自动生成"><small class="field-note">可选；留空时按链接自动生成。</small></label></div>
                        </fieldset>
                        <fieldset class="channel-selector">
                            <legend>发送邮件通道</legend>
                            <p class="field-note">可多选，拖动所选通道下方的滑块或输入权重，调整计划发送比例。</p>
                            <input type="hidden" name="channelWeightsJson" value="" data-channel-weights-json disabled>
                            <div class="channel-options-grid" data-channel-weight-editor>
                                <c:forEach items="${senderSettings}" var="setting">
                                    <div class="channel-option-card">
                                        <label class="channel-option"><input type="checkbox" name="providers" value="${setting.provider}" <c:if test="${not editorCampaign.existing or editorCampaign.providerSelections[setting.provider]}">checked</c:if>><span><strong><c:out value="${providerAliases[setting.provider]}"/></strong><small><c:out value="${setting.fromHeader}"/></small></span></label>
                                        <div class="channel-weight-row" data-channel-weight-row data-provider="<c:out value='${setting.provider}'/>" data-default-weight="<c:out value='${editorCampaign.channelWeights[setting.provider]}' default='1'/>" hidden>
                                            <div class="channel-weight-row-heading"><strong>计划发送比例</strong><output data-channel-weight-percent aria-label="<c:out value='${providerAliases[setting.provider]}'/>建议占比">—</output></div>
                                            <div class="channel-weight-controls"><input type="range" min="1" max="100" step="1" value="1" data-channel-weight-range aria-label="<c:out value='${providerAliases[setting.provider]}'/>发送权重"><label>权重<input type="number" min="1" max="100" step="1" value="1" required data-channel-weight-number aria-label="<c:out value='${providerAliases[setting.provider]}'/>发送权重数值"></label></div>
                                        </div>
                                    </div>
                                </c:forEach>
                            </div>
                            <p class="channel-weight-note">比例为计划分配目标。通道不可用或限流时，系统可使用其他已选通道，实际占比可能变化。</p>
                        </fieldset>
                    </form>
                    <c:if test="${canManageCampaigns and editorCampaign.existing and editorCampaign.status eq 'DRAFT'}"><form id="campaign-draft-delete-form" method="post" action="${ctx}/campaigns/action" hidden><input type="hidden" name="shop" value="${selectedShop}"><input type="hidden" name="campaignId" value="${editorCampaign.campaignId}"><input type="hidden" name="action" value="DELETE"></form></c:if>

                    <c:if test="${editorCampaign.existing}"><section id="campaign-test-send" class="campaign-test-send spaced-section"><fieldset class="channel-selector campaign-test-send-card"><legend>发送测试邮件</legend><p class="field-note">使用当前保存的模板与活动参数，测试状态仅供提示，不影响活动审批。</p><form class="workspace-form" method="post" action="${ctx}/campaigns/test-send"><input type="hidden" name="shop" value="${selectedShop}"><input type="hidden" name="campaignId" value="${editorCampaign.campaignId}"><input type="hidden" name="requestToken" value="${campaignTestRequestToken}"><div class="form-grid two campaign-test-compose"><label><span>测试邮箱（最多10个）</span><textarea name="recipients" rows="3" required placeholder="多个邮箱可用逗号、分号或换行分隔"></textarea></label><div class="campaign-test-route"><span>测试发送通道</span><div class="campaign-test-route-controls"><select name="provider" required><c:forEach items="${senderSettings}" var="setting"><c:if test="${editorCampaign.providerSelections[setting.provider]}"><option value="${setting.provider}"><c:out value="${providerAliases[setting.provider]}"/></option></c:if></c:forEach></select><button class="action-button" type="submit" <c:if test="${not canManageCampaigns}">disabled hidden</c:if>><i class="fa fa-paper-plane"></i>发送测试邮件</button></div></div></div></form><c:if test="${not empty campaignTestSendHistory}"><div class="campaign-test-history"><strong>测试邮件明细</strong><div class="campaign-test-history-scroll"><table class="status-table wide-table campaign-test-history-table"><thead><tr><th>测试时间</th><th>收件邮箱</th><th>邮件通道</th><th>发送状态</th><th>送达情况</th><th>发送/完成时间</th></tr></thead><tbody><c:forEach items="${campaignTestSendHistory}" var="testItem"><tr><td><time data-browser-time="<c:out value='${testItem.requestedAt}'/>" datetime="<c:out value='${testItem.requestedAt}'/>"><c:out value="${testItem.requestedAt}"/></time></td><td><c:out value="${testItem.recipientEmail}"/></td><td><c:out value="${providerAliases[testItem.provider]}"/></td><td><c:out value="${testItem.sendStatusDisplayName}"/><c:if test="${not empty testItem.lastErrorCode}"><small><c:out value="${testItem.lastErrorCode}"/></small></c:if></td><td><c:out value="${testItem.deliveryStatusDisplayName}"/><c:if test="${not empty testItem.deliveredAt}"><small><time data-browser-time="<c:out value='${testItem.deliveredAt}'/>" datetime="<c:out value='${testItem.deliveredAt}'/>"><c:out value="${testItem.deliveredAt}"/></time></small></c:if><c:if test="${not empty testItem.bouncedAt}"><small><time data-browser-time="<c:out value='${testItem.bouncedAt}'/>" datetime="<c:out value='${testItem.bouncedAt}'/>"><c:out value="${testItem.bouncedAt}"/></time></small></c:if></td><td><c:choose><c:when test="${not empty testItem.sentAt}"><time data-browser-time="<c:out value='${testItem.sentAt}'/>" datetime="<c:out value='${testItem.sentAt}'/>"><c:out value="${testItem.sentAt}"/></time></c:when><c:otherwise><time data-browser-time="<c:out value='${testItem.completedAt}'/>" datetime="<c:out value='${testItem.completedAt}'/>"><c:out value="${testItem.completedAt}" default="—"/></time></c:otherwise></c:choose></td></tr></c:forEach></tbody></table></div></div></c:if></fieldset></section></c:if>
                </c:otherwise>
            </c:choose>
        </section>
            <script data-campaign-draft-delete-script>
        (function () {
            var form = document.getElementById('campaign-draft-delete-form');
            if (!form) return;
            var button = document.querySelector('[form="campaign-draft-delete-form"]');
            form.addEventListener('submit', function (event) {
                if (form.dataset.submitting === 'true') {
                    event.preventDefault();
                    return;
                }
                if (!window.confirm('确认删除这个尚未执行的活动草稿？删除后无法恢复，客户和模板会保留。')) {
                    event.preventDefault();
                    return;
                }
                form.dataset.submitting = 'true';
                form.setAttribute('aria-busy', 'true');
                if (button) {
                    button.disabled = true;
                    button.innerHTML = '<i class="fa fa-spinner fa-spin" aria-hidden="true"></i><span>删除中…</span>';
                }
            });
        }());
        </script>
        <script src="${ctx}/shopify/js/campaign-channel-weights.js?v=20261105-range10"></script>
        <script src="${ctx}/shopify/js/campaign-search-picker.js?v=20261106-audience1"></script>
    </main>
</div>
<script src="${ctx}/shopify/js/campaign-editor-audience.js?v=20261114-preview-inline"></script><script src="${ctx}/shopify/js/campaign-audience-search.js?v=20261107-template1"></script>
<script>
(function () {
    var shop = document.querySelector('[name="shop"]').value;
    var templateSelect = document.querySelector('[name="templateId"]');
    var variablesField = document.getElementById('campaign-variables');
    var variables = JSON.parse(variablesField.value || '{}');
    var campaignMessageInput = document.getElementById('campaign-message');
    campaignMessageInput.value = Object.prototype.hasOwnProperty.call(variables, 'campaignMessage')
        ? variables.campaignMessage : '';
    variables.campaignMessage = campaignMessageInput.value;
    campaignMessageInput.addEventListener('input', function () {
        variables.campaignMessage = campaignMessageInput.value;
        variablesField.value = JSON.stringify(variables);
    });
    var MAX_PRODUCTS = 12;
    var productInputHost = document.getElementById('campaign-product-inputs');
    var selectedProducts = Array.prototype.map.call(
        productInputHost.querySelectorAll('input[name="productSourceIds"]'),
        function (input) { return { sourceId: input.value, title: input.value }; });
    var productCatalog = {};
    var productPicker = null, discountPicker = null;
    var productLookupVersion = 0, discountLookupVersion = 0;
    var variableLabels = { campaignMessage: '活动文案', promoText: '促销文案' };
    var initialDiscount = '<c:out value="${editorCampaign.discountSourceId}"/>';
    function api(path, query) {
        return fetch('${ctx}' + path + '?' + new URLSearchParams(query).toString(),
            { headers: { 'Accept': 'application/json' } }).then(function (response) {
                if (!response.ok) throw new Error('数据加载失败');
                return response.json();
            });
    }
    function renderVariables(defaults) {
        var host = document.getElementById('campaign-custom-variables');
        host.innerHTML = '';
        Object.keys(defaults || {}).forEach(function (name) {
            if (name === 'campaignMessage') return;
            var label = document.createElement('label');
            var title = document.createElement('span'); title.textContent = variableLabels[name] || name;
            title.title = '{{' + name + '}}';
            var input = document.createElement('input'); input.maxLength = 500;
            input.value = Object.prototype.hasOwnProperty.call(variables, name) ? variables[name] : defaults[name];
            variables[name] = input.value;
            input.addEventListener('input', function () {
                variables[name] = input.value; variablesField.value = JSON.stringify(variables);
            });
            label.appendChild(title); label.appendChild(input); host.appendChild(label);
        });
        variables.campaignMessage = campaignMessageInput.value;
        variablesField.value = JSON.stringify(variables);
        if (!host.children.length) host.innerHTML = '<p class="field-note">当前模板没有需要人工填写的自定义变量。</p>';
    }
    function populate(select, items, selected, emptyLabel, labelOf) {
        select.innerHTML = '';
        var empty = document.createElement('option'); empty.value = ''; empty.textContent = emptyLabel;
        select.appendChild(empty);
        var found = false;
        items.forEach(function (item) {
            var option = document.createElement('option'); option.value = item.sourceId;
            option.textContent = labelOf(item); option.selected = item.sourceId === selected;
            if (option.selected) found = true;
            select.appendChild(option);
        });
        if (selected && !found) {
            var retained = document.createElement('option'); retained.value = selected; retained.setAttribute('data-picker-retained', 'true');
            retained.textContent = '当前已选 · ' + selected; retained.selected = true; select.appendChild(retained);
        }
    }
    function syncProductInputs() {
        productInputHost.innerHTML = '';
        selectedProducts.forEach(function (product) {
            var input = document.createElement('input');
            input.type = 'hidden'; input.name = 'productSourceIds'; input.value = product.sourceId;
            productInputHost.appendChild(input);
        });
    }
    function moveProduct(index, offset) {
        var target = index + offset;
        if (target < 0 || target >= selectedProducts.length) return;
        var item = selectedProducts[index];
        selectedProducts[index] = selectedProducts[target]; selectedProducts[target] = item;
        renderSelectedProducts();
    }
    function renderSelectedProducts() {
        var host = document.getElementById('campaign-selected-products');
        document.getElementById('selected-products-count').textContent = selectedProducts.length + ' / ' + MAX_PRODUCTS;
        host.innerHTML = '';
        if (!selectedProducts.length) {
            host.innerHTML = '<div class="selected-products-empty">未关联商品，将使用模板默认商品或不显示商品。</div>';
            syncProductInputs(); return;
        }
        selectedProducts.forEach(function (product, index) {
            var row = document.createElement('div'); row.className = 'campaign-selected-product';
            row.setAttribute('role', 'listitem');
            var sequence = document.createElement('span'); sequence.className = 'selected-product-sequence';
            sequence.textContent = String(index + 1).padStart(2, '0');
            var details = document.createElement('div'); details.className = 'selected-product-details';
            var title = document.createElement('strong'); title.textContent = product.title || product.sourceId;
            title.title = title.textContent;
            details.appendChild(title);
            var catalogItem = productCatalog[product.sourceId];
            if (catalogItem && catalogItem.price != null) {
                var price = document.createElement('small');
                price.textContent = catalogItem.price + ' ' + (catalogItem.currency || '');
                details.appendChild(price);
            }
            var actions = document.createElement('div'); actions.className = 'selected-product-actions';
            [['fa-arrow-up', -1, '上移'], ['fa-arrow-down', 1, '下移']].forEach(function (definition) {
                var button = document.createElement('button'); button.type = 'button'; button.title = definition[2];
                button.setAttribute('aria-label', definition[2] + '商品 ' + (index + 1));
                button.innerHTML = '<i class="fa ' + definition[0] + '"></i>';
                button.disabled = (definition[1] < 0 && index === 0)
                    || (definition[1] > 0 && index === selectedProducts.length - 1);
                button.addEventListener('click', function () { moveProduct(index, definition[1]); });
                actions.appendChild(button);
            });
            var remove = document.createElement('button'); remove.type = 'button'; remove.title = '移除';
            remove.setAttribute('aria-label', '移除商品 ' + (index + 1));
            remove.innerHTML = '<i class="fa fa-times"></i>';
            remove.addEventListener('click', function () {
                selectedProducts.splice(index, 1); renderSelectedProducts(); loadProducts('');
            });
            actions.appendChild(remove);
            row.appendChild(sequence); row.appendChild(details); row.appendChild(actions); host.appendChild(row);
        });
        syncProductInputs();
    }
    function addProduct(product) {
        if (!product || !product.sourceId) return;
        if (selectedProducts.some(function (item) { return item.sourceId === product.sourceId; })) return;
        if (selectedProducts.length >= MAX_PRODUCTS) {
            alert('每个活动最多关联 ' + MAX_PRODUCTS + ' 个商品'); return;
        }
        selectedProducts.push({ sourceId: product.sourceId, title: product.title || product.sourceId });
        renderSelectedProducts(); loadProducts('');
    }
    function loadProducts(query) {
        var lookupVersion = ++productLookupVersion;
        return api('/templates/products', { shop: shop, q: query || '' }).then(function (items) {
            if (lookupVersion !== productLookupVersion) return;
            items.forEach(function (item) { productCatalog[item.sourceId] = item; });
            selectedProducts.forEach(function (product) {
                if (productCatalog[product.sourceId]) product.title = productCatalog[product.sourceId].title;
            });
            renderSelectedProducts();
            var select = document.getElementById('campaign-product');
            select.innerHTML = '<option value="">选择商品后加入</option>';
            items.filter(function (item) {
                return !selectedProducts.some(function (selected) { return selected.sourceId === item.sourceId; });
            }).forEach(function (item) {
                var option = document.createElement('option'); option.value = item.sourceId;
                option.textContent = item.title + (item.price ? ' · ' + item.price + ' ' + (item.currency || '') : '');
                select.appendChild(option);
            });
            if (productPicker) productPicker.refresh();
        });
    }
    function loadDiscounts(query, selected) {
        var lookupVersion = ++discountLookupVersion;
        var discountSelect = document.getElementById('campaign-discount');
        var oldOption = Array.prototype.find.call(discountSelect.options, function (option) { return option.value === selected; });
        var oldLabel = oldOption && oldOption.textContent;
        return api('/templates/discounts', { shop: shop, q: query || '' }).then(function (items) {
            if (lookupVersion !== discountLookupVersion) return;
            populate(document.getElementById('campaign-discount'), items, selected,
                '不使用优惠券', function (item) {
                    var label = item.title === item.code ? item.code : item.title + ' · ' + item.code;
                    return item.summary ? label + ' · ' + item.summary : label;
                });
            if (selected && oldLabel && !items.some(function (item) { return item.sourceId === selected; })) {
                var retained = Array.prototype.find.call(discountSelect.options, function (option) { return option.value === selected; });
                if (retained) retained.textContent = oldLabel;
            }
            if (discountPicker) discountPicker.refresh();
        });
    }
    function loadTemplateOptions(reset) {
        return api('/campaigns/template-options', { shop: shop, templateId: templateSelect.value })
            .then(function (options) {
                if (reset) variables = {};
                renderVariables(options.customVariables || {});
                if (reset) selectedProducts = [];
                if (!selectedProducts.length && options.productSourceId) {
                    selectedProducts.push({ sourceId: options.productSourceId, title: options.productSourceId });
                }
                return loadProducts('');
            }).catch(function (error) { alert(error.message); });
    }
    templateSelect.addEventListener('change', function () { loadTemplateOptions(true); });

    document.getElementById('campaign-product').addEventListener('change', function (event) {
        var product = productCatalog[event.target.value];
        if (product) addProduct(product);
        event.target.value = '';
    });
    productPicker = window.CampaignSearchPicker.create(document.getElementById('campaign-product-picker'), document.getElementById('campaign-product'), {
        placeholder: '选择商品后加入', includeEmpty: false, load: loadProducts, invalidate: function () { productLookupVersion++; }
    });
    discountPicker = window.CampaignSearchPicker.create(document.getElementById('campaign-discount-picker'), document.getElementById('campaign-discount'), {
        placeholder: '不使用优惠券', includeEmpty: true, load: function (query) { return loadDiscounts(query, document.getElementById('campaign-discount').value); },
        invalidate: function () { discountLookupVersion++; }
    });
    renderSelectedProducts();
    loadDiscounts('', initialDiscount).catch(function (error) { alert(error.message); });
    loadTemplateOptions(false);
})();
</script>
</body>
</html>
