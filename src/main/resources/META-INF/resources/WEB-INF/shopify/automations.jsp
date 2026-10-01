<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ page language="java" pageEncoding="UTF-8" contentType="text/html; charset=UTF-8" %>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>自动营销 - Shopify 邮件营销</title>
    <c:set var="ctx" value="${pageContext.request.contextPath}"/>
    <link rel="stylesheet" href="${ctx}/baseui/static/h-ui/css/H-ui.min.css">
    <link rel="stylesheet" href="${ctx}/baseui/static/h-ui.admin/css/H-ui.admin.css">
    <link rel="stylesheet" href="${ctx}/baseui/lib/font-awesome-4.7.0/css/font-awesome.min.css">
    <link rel="stylesheet" href="${ctx}${uiAssetBase}/css/dashboard.css?v=20260922-ga4">
</head>
<body class="shopify-console">
<%@ include file="fragments/header.jspf" %>
<div class="console-layout">
<%@ include file="fragments/navigation.jspf" %>
<main class="console-main" data-automation-root
      data-shop="<c:out value='${selectedShop}'/>"
      data-detail-url="${ctx}/automations/detail"
      data-discount-url="${ctx}/templates/discounts"
      data-customer-url="${ctx}/segments/customer/detail">
    <style data-automation-inline-styles>
        .automation-dialog { width: min(900px, calc(100vw - 32px)); max-height: calc(100vh - 32px); padding: 0; overflow: hidden; border: 1px solid var(--line); border-radius: 6px; background: #fff; color: var(--ink); box-shadow: 0 20px 60px rgba(18,42,52,.28); }
        .automation-dialog:not([open]) { display: none !important; }
        .automation-dialog[open] { display: flex; flex-direction: column; }
        .automation-dialog::backdrop { background: rgba(15,31,38,.52); }
        .automation-dialog-body { min-height: 0; overflow: auto; padding: 20px 24px 24px; }
        .automation-detail-dialog { width: min(1380px, calc(100vw - 32px)); height: min(900px, calc(100vh - 32px)); }
        .automation-detail-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); margin: 0 0 20px; border-top: 1px solid var(--line); }
        .automation-detail-grid > div { min-width: 0; padding: 12px 8px; border-bottom: 1px solid var(--line); }
        .automation-detail-grid dt { color: var(--muted); font-size: 12px; }
        .automation-detail-grid dd { margin: 4px 0 0; overflow-wrap: anywhere; font-weight: 600; }
        .automation-discount-row[hidden], .automation-detail-state[hidden], [data-automation-detail-content][hidden] { display: none !important; }
        .automation-detail-state { display: flex; min-height: 180px; align-items: center; justify-content: center; gap: 10px; color: var(--muted); }
        .automation-metric-grid { display: grid; grid-template-columns: repeat(4,minmax(130px,1fr)); gap: 1px; margin-bottom: 18px; border: 1px solid var(--line); background: var(--line); }
        .automation-metric-grid > div { min-width: 0; padding: 13px 14px; background: #fff; }
        .automation-metric-grid span, .automation-metric-grid strong { display: block; }
        .automation-metric-grid span { color: var(--muted); font-size: 12px; }
        .automation-metric-grid .automation-metric-label { display: flex; align-items: center; gap: 7px; }
        .automation-metric-icon { width: 16px; color: var(--green); text-align: center; font-size: 14px; }
        .automation-metric-grid strong { margin-top: 4px; overflow-wrap: anywhere; font-size: 18px; }
        .automation-ga4-panel { margin: 18px 0; padding: 16px; border: 1px solid var(--line); border-radius: 5px; }
        .automation-ga4-panel .section-heading { margin-bottom: 12px; }
        .automation-ga4-panel .campaign-kpi-grid { margin-bottom: 10px; }
        .automation-ga4-panel .ga4-sync-time { overflow-wrap: anywhere; }
        .automation-ga4-panel [hidden] { display: none !important; }
        .automation-detail-table-wrap { max-height: 390px; overflow: auto; border: 1px solid var(--line); }
        .automation-detail-table { min-width: 1240px; }
        .automation-detail-table thead { position: sticky; top: 0; z-index: 1; background: var(--surface); }
        .automation-list-table { min-width: 1180px; }
        .automation-beta-label { color: var(--muted); }
        .inline-search { display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 8px; }
        @media (max-width: 900px) { .automation-metric-grid { grid-template-columns: repeat(2,minmax(130px,1fr)); } }
        @media (max-width: 620px) { .automation-dialog-body { padding: 16px; } .automation-detail-grid { grid-template-columns: 1fr; } }
    </style>
    <section class="page-heading"><div><p class="eyebrow">自动营销 <span class="automation-beta-label">（Beta）</span></p></div></section>
    <c:if test="${not empty successMessage}"><div class="flash-message success"><i class="fa fa-check-circle"></i><c:out value="${successMessage}"/></div></c:if>
    <c:if test="${not empty errorMessage}"><div class="flash-message danger"><i class="fa fa-exclamation-circle"></i><c:out value="${errorMessage}"/></div></c:if>

    <c:choose>
        <c:when test="${empty selectedShop}">
            <section class="content-section"><div class="empty-state"><i class="fa fa-lock"></i><strong>没有可用店铺</strong><span>获得店铺授权后即可配置自动营销。</span></div></section>
        </c:when>
        <c:otherwise>
            <section class="content-section">
                <div class="section-heading">
                    <div><h2>自动营销列表</h2><p>查看规则配置、发送效果和客户旅程</p></div>
                    <div class="section-heading-actions">
                        <span class="section-count"><c:out value="${automationPage.total}"/> 条</span>
                        <c:if test="${canManageCampaigns}"><button class="primary-button compact" type="button" data-automation-new <c:if test="${empty senderSettings}">disabled title="请先配置店铺发件身份"</c:if>><i class="fa fa-plus"></i><span>新建自动营销</span></button></c:if>
                    </div>
                </div>
                <c:choose>
                    <c:when test="${empty automations}">
                        <div class="empty-state"><i class="fa fa-random"></i><strong>还没有自动营销</strong><span><c:choose><c:when test="${empty senderSettings}">请先到“我的店铺”完成发件设置。</c:when><c:otherwise>点击“新建自动营销”添加第一条规则。</c:otherwise></c:choose></span></div>
                    </c:when>
                    <c:otherwise>
                        <div class="table-wrap">
                            <table class="status-table wide-table automation-list-table">
                                <thead><tr><th>名称</th><th>状态</th><th>触发事件</th><th>等待</th><th>邮件模板</th><th>发送 / 送达</th><th>打开人数</th><th>点击人数</th><th>转化订单</th><th>操作</th></tr></thead>
                                <tbody>
                                <c:forEach items="${automations}" var="automation">
                                    <tr data-automation-id="<c:out value='${automation.automationId}'/>"
                                        data-name="<c:out value='${automation.name}'/>"
                                        data-journey-type="${automation.journeyType}"
                                        data-trigger-event="${automation.triggerEvent}"
                                        data-wait-minutes="${automation.waitMinutes}"
                                        data-template-id="<c:out value='${automation.templateId}'/>"
                                        data-template-name="<c:out value='${automation.templateName}'/>"
                                        data-provider="${automation.provider}"
                                        data-sender="<c:out value='${automation.sender}'/>"
                                        data-frequency-days="${automation.frequencyDays}"
                                        data-coupon-mode="${automation.couponMode}"
                                        data-discount-source-id="<c:out value='${automation.discountSourceId}'/>"
                                        data-exit-on-purchase="${automation.exitOnPurchase}"
                                        data-status="${automation.status}">
                                        <td><strong><c:out value="${automation.name}"/></strong><span class="cell-note"><c:choose><c:when test="${automation.journeyType eq 'ABANDONED_CART'}">购物车挽回</c:when><c:when test="${automation.journeyType eq 'BROWSE_ABANDONMENT'}">浏览挽回</c:when><c:when test="${automation.journeyType eq 'POST_PURCHASE'}">购买后跟进</c:when><c:otherwise><c:out value="${automation.journeyType}"/></c:otherwise></c:choose></span></td>
                                        <td><span class="status-pill ${automation.status eq 'ACTIVE' ? '' : 'neutral'}"><c:choose><c:when test="${automation.status eq 'ACTIVE'}">生效</c:when><c:otherwise>禁用</c:otherwise></c:choose></span></td>
                                        <td><c:out value="${automation.triggerEvent}"/></td>
                                        <td><c:out value="${automation.waitMinutes}"/> 分钟</td>
                                        <td><c:out value="${automation.templateName}"/></td>
                                        <td><strong><c:out value="${automation.sentCount}"/></strong><span class="cell-note">送达 <c:out value="${automation.deliveredCount}"/></span></td>
                                        <td><c:out value="${automation.openedRecipientCount}"/></td>
                                        <td><c:out value="${automation.clickedRecipientCount}"/></td>
                                        <td><c:out value="${automation.orderCount}"/></td>
                                        <td><div class="table-actions"><button class="action-button" type="button" data-automation-view>查看</button><c:if test="${canManageCampaigns}"><button class="action-button" type="button" data-automation-edit <c:if test="${empty senderSettings}">disabled title="请先配置店铺发件身份"</c:if>>编辑</button></c:if></div></td>
                                    </tr>
                                </c:forEach>
                                </tbody>
                            </table>
                        </div>
                        <c:url var="automationPreviousUrl" value="/automations"><c:param name="shop" value="${selectedShop}"/><c:param name="page" value="${automationPage.page - 1}"/></c:url>
                        <c:url var="automationNextUrl" value="/automations"><c:param name="shop" value="${selectedShop}"/><c:param name="page" value="${automationPage.page + 1}"/></c:url>
                        <div class="pagination-bar"><c:if test="${automationPage.hasPrevious}"><a class="action-button" href="${automationPreviousUrl}">上一页</a></c:if><span>第 <c:out value="${automationPage.page}"/> / <c:out value="${automationPage.totalPages}"/> 页</span><c:if test="${automationPage.hasNext}"><a class="action-button" href="${automationNextUrl}">下一页</a></c:if></div>
                    </c:otherwise>
                </c:choose>
            </section>

            <dialog id="automation-editor-dialog" class="automation-dialog">
                <div class="campaign-customer-dialog-heading"><h2 id="automation-editor-title">新建自动营销</h2><button class="action-button dialog-close-button" type="button" data-automation-close aria-label="关闭"><i class="fa fa-times"></i></button></div>
                <div class="automation-dialog-body">
                    <form id="automation-editor-form" class="workspace-form" method="post" action="${ctx}/automations" data-update-action="${ctx}/automations/update">
                        <input type="hidden" name="shop" value="<c:out value='${selectedShop}'/>">
                        <input type="hidden" name="automationId" value="">
                        <input type="hidden" name="page" value="${automationPage.page}">
                        <div class="form-grid"><label><span>规则名称</span><input name="name" placeholder="加入购物车 30 分钟未购买" required></label><label><span>状态</span><select name="status" required><option value="PAUSED">禁用</option><option value="ACTIVE">生效</option></select></label></div>
                        <div class="form-grid"><label><span>旅程类型</span><select name="journeyType"><c:forEach items="${journeyTypes}" var="type"><option value="${type}"><c:choose><c:when test="${type eq 'ABANDONED_CART'}">购物车挽回</c:when><c:when test="${type eq 'BROWSE_ABANDONMENT'}">浏览挽回</c:when><c:when test="${type eq 'POST_PURCHASE'}">购买后跟进</c:when><c:otherwise><c:out value="${type}"/></c:otherwise></c:choose></option></c:forEach></select></label><label><span>触发事件</span><select name="triggerEvent"><c:forEach items="${behaviorEventTypes}" var="event"><option value="${event}"><c:choose><c:when test="${event eq 'PAGE_VIEWED'}">浏览页面</c:when><c:when test="${event eq 'CLICKED'}">点击页面</c:when><c:when test="${event eq 'PRODUCT_VIEWED'}">查看商品</c:when><c:when test="${event eq 'SEARCH_SUBMITTED'}">提交搜索</c:when><c:when test="${event eq 'PRODUCT_ADDED_TO_CART'}">加入购物车</c:when><c:when test="${event eq 'CHECKOUT_STARTED'}">开始结账</c:when><c:when test="${event eq 'CHECKOUT_COMPLETED'}">完成结账</c:when><c:otherwise><c:out value="${event}"/></c:otherwise></c:choose></option></c:forEach></select></label></div>
                        <div class="form-grid"><label><span>等待分钟</span><input name="waitMinutes" type="number" min="1" max="43200" value="30" required></label><label><span>同一客户频控（天）</span><input name="frequencyDays" type="number" min="1" max="365" value="7" required></label></div>
                        <div class="form-grid"><label><span>邮件模板</span><select name="templateId" required><c:forEach items="${templates}" var="template"><option value="<c:out value='${template.templateId}'/>"><c:out value="${template.name}"/></option></c:forEach></select></label><label><span>邮件通道</span><select name="provider"><c:forEach items="${senderSettings}" var="setting"><option value="${setting.provider}"><c:out value="${providerAliases[setting.provider]}"/></option></c:forEach></select></label></div>
                        <div class="form-grid"><label><span>发件身份</span><input id="automation-sender-preview" readonly></label><label><span>优惠券动作</span><select name="couponMode"><option value="NONE">不使用优惠券</option><option value="FIXED_CODE">使用固定优惠码</option></select></label></div>
                        <div class="form-grid automation-discount-row" data-automation-discount-row hidden>
                            <label><span>搜索优惠券</span><div class="inline-search"><input type="search" data-automation-discount-search placeholder="输入优惠码或名称"><button class="action-button" type="button" data-automation-discount-search-button><i class="fa fa-search"></i><span>搜索</span></button></div></label>
                            <label><span>固定优惠券</span><select name="discountSourceId"><option value="">请选择有效优惠券</option></select></label>
                        </div>
                        <div class="sender-preview-data" hidden><c:forEach items="${senderSettings}" var="setting"><span data-sender-provider="${setting.provider}" data-sender-header="<c:out value='${setting.fromHeader}'/>"></span></c:forEach></div>
                        <label class="check-label"><input name="exitOnPurchase" type="checkbox" value="true" checked><span>客户购买后退出等待中的旅程</span></label>
                        <div class="form-actions"><button class="action-button" type="button" data-automation-close>取消</button><button class="primary-button" type="submit"><i class="fa fa-save"></i><span>保存自动营销</span></button></div>
                    </form>
                </div>
            </dialog>

            <dialog id="automation-detail-dialog" class="automation-dialog automation-detail-dialog">
                <div class="campaign-customer-dialog-heading"><h2>自动营销明细</h2><button class="action-button dialog-close-button" type="button" data-automation-close aria-label="关闭"><i class="fa fa-times"></i></button></div>
                <div class="automation-dialog-body">
                    <div class="automation-detail-state" data-automation-detail-loading><i class="fa fa-circle-o-notch fa-spin"></i><span>正在加载自动营销明细</span></div>
                    <div class="automation-detail-state danger" data-automation-detail-error hidden><i class="fa fa-exclamation-circle"></i><span></span></div>
                    <div data-automation-detail-content hidden>
                        <dl class="automation-detail-grid"><div><dt>名称</dt><dd data-automation-detail="name"></dd></div><div><dt>状态</dt><dd data-automation-detail="status"></dd></div><div><dt>旅程类型</dt><dd data-automation-detail="journeyType"></dd></div><div><dt>触发事件</dt><dd data-automation-detail="triggerEvent"></dd></div><div><dt>等待时间</dt><dd data-automation-detail="waitMinutes"></dd></div><div><dt>同一客户频控</dt><dd data-automation-detail="frequencyDays"></dd></div><div><dt>邮件模板</dt><dd data-automation-detail="templateName"></dd></div><div><dt>邮件通道</dt><dd data-automation-detail="provider"></dd></div><div><dt>发件邮箱</dt><dd data-automation-detail="sender"></dd></div><div><dt>优惠券</dt><dd data-automation-detail="discountSourceId"></dd></div><div><dt>购买后退出</dt><dd data-automation-detail="exitOnPurchase"></dd></div></dl>
                        <div class="automation-metric-grid" data-automation-metrics></div>
                        <section class="automation-ga4-panel" data-automation-ga4>
                            <div class="section-heading"><div><h3>GA4 自动营销购买评估</h3><p>按 utm_source=auw、utm_medium=email 和当前自动营销 ID 汇总</p></div><span class="status-pill neutral" data-automation-ga4-status></span></div>
                            <p class="form-hint" data-automation-ga4-message></p>
                            <div class="campaign-kpi-grid ga4-campaign-kpis" data-automation-ga4-metrics hidden>
                                <article><span>GA4 购买次数</span><strong data-automation-ga4-count></strong><small>自动营销级评估</small></article>
                                <article><span>GA4 购买收入</span><strong data-automation-ga4-revenue></strong><small>GA4 报告口径</small></article>
                                <article><span>最后同步</span><strong class="ga4-sync-time"><time data-automation-ga4-time></time></strong><small data-automation-ga4-model></small></article>
                            </div>
                            <p class="form-hint">该指标独立于上方的 Shopify 订单转化数据。</p>
                        </section>
                        <div class="table-wrap automation-detail-table-wrap"><table class="status-table automation-detail-table"><thead><tr><th>客户</th><th>触发时间</th><th>计划发送</th><th>实际发送</th><th>通道</th><th>接受/送达</th><th>打开/点击</th><th>订单/金额</th><th>状态</th></tr></thead><tbody data-automation-detail-rows></tbody></table></div>
                        <div class="empty-state compact" data-automation-detail-empty hidden><i class="fa fa-inbox"></i><strong>暂无客户旅程</strong></div>
                        <div class="pagination-bar automation-detail-pagination"><button class="action-button" type="button" data-automation-detail-page="previous">上一页</button><span data-automation-detail-page-label></span><button class="action-button" type="button" data-automation-detail-page="next">下一页</button></div>
                    </div>
                </div>
            </dialog>

            <dialog id="automation-customer-dialog" class="campaign-customer-dialog">
                <div class="campaign-customer-dialog-heading"><h2>客户明细</h2><button class="action-button dialog-close-button" type="button" data-automation-close aria-label="关闭"><i class="fa fa-times"></i></button></div>
                <div class="campaign-customer-dialog-body" data-automation-customer-detail></div>
            </dialog>
        </c:otherwise>
    </c:choose>
    <script src="${ctx}/shopify/js/customer-timeline.js?v=20260925-p130"></script>
    <script src="${ctx}/shopify/js/automations.js?v=20260927-customer-timeline"></script>
</main>
</div>
</body>
</html>
