<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<%@ page language="java" pageEncoding="UTF-8" contentType="text/html; charset=UTF-8" %>
<fmt:setLocale value="zh_CN" scope="page"/>
<div data-mobile-quota-result data-shop="<c:out value='${selectedShop}'/>" data-available="${storeEmailQuotaAvailable and not empty storeEmailQuota}">
  <c:choose>
    <c:when test="${not storeEmailQuotaAvailable or empty storeEmailQuota}"><p class="mq-unavailable" role="status">暂时无法读取店铺发送额度，请稍后点击“刷新额度”重试。</p></c:when>
    <c:otherwise>
      <div class="mobile-metrics mq-grid" aria-label="邮件发送额度概览">
        <article class="mobile-metric mq-available" <c:if test="${storeEmailQuota.availableCount eq 0}">data-empty="true"</c:if>><span>可发送数量</span><strong data-quota-count="available"><fmt:formatNumber value="${storeEmailQuota.availableCount}" pattern="#,##0" groupingUsed="true"/></strong></article>
        <article class="mobile-metric"><span>额度总量</span><strong data-quota-count="balance"><fmt:formatNumber value="${storeEmailQuota.balanceCount}" pattern="#,##0" groupingUsed="true"/></strong></article>
        <article class="mobile-metric"><span>活动预留</span><strong data-quota-count="reserved"><fmt:formatNumber value="${storeEmailQuota.reservedCount}" pattern="#,##0" groupingUsed="true"/></strong></article>
        <article class="mobile-metric"><span>累计已核销</span><strong data-quota-count="consumed"><fmt:formatNumber value="${storeEmailQuota.consumedCount}" pattern="#,##0" groupingUsed="true"/></strong></article>
      </div>
      <p class="mq-note">额度总量为当前剩余余额，含预留占用；可发送数量为扣除预留后的可用额度。</p>
      <p class="mq-note">活动按提交量、自动营销按通道接受量核销。</p>
      <c:if test="${storeEmailQuota.expiryEnabled}">
        <details class="mq-expiry"><summary>额度有效期与占用情况</summary>
          <dl>
            <div><dt>未提交预扣</dt><dd><fmt:formatNumber value="${storeEmailQuota.unsubmittedReservedCount}" pattern="#,##0" groupingUsed="true"/></dd></div>
            <div><dt>已提交待核销</dt><dd><fmt:formatNumber value="${storeEmailQuota.pendingCount}" pattern="#,##0" groupingUsed="true"/></dd></div>
            <div><dt>累计到期回收</dt><dd><fmt:formatNumber value="${storeEmailQuota.expiredCount}" pattern="#,##0" groupingUsed="true"/></dd></div>
            <div><dt>已过期待回收</dt><dd><fmt:formatNumber value="${storeEmailQuota.pendingExpiryCount}" pattern="#,##0" groupingUsed="true"/></dd></div>
          </dl>
          <p class="mq-note">未提交预扣沿用原额度有效期；已提交待核销占用原额度批次。</p>
        </details>
      </c:if>
    </c:otherwise>
  </c:choose>
</div>
