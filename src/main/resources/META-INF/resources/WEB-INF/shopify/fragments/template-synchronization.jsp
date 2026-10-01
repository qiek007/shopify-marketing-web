<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ page language="java" pageEncoding="UTF-8" contentType="text/html; charset=UTF-8" %>
<span hidden data-template-sync-summary="${templateSync.syncSummary}" data-template-sync-class="${templateSync.syncSummaryClass}" data-template-sync-count="${templateSync.bindings.size()}"></span>
<c:choose>
    <c:when test="${empty templateSync.bindings}"><div class="empty-state compact"><strong>尚未同步</strong><span>发布模板后将同步到已启用的邮件通道。</span></div></c:when>
    <c:otherwise><div class="table-wrap"><table class="status-table compact-table"><thead><tr><th>通道</th><th>状态</th><th>通道模板 ID</th><th>配置版本</th><th>同步时间 / 说明</th></tr></thead><tbody>
    <c:forEach items="${templateSync.bindings}" var="binding"><tr><td><strong><c:out value="${providerAliases[binding.provider]}"/></strong></td><td><span class="status-pill ${binding.status eq 'SYNCED' ? '' : 'blocked'}"><c:choose><c:when test="${binding.status eq 'SYNCED'}">已同步</c:when><c:when test="${binding.status eq 'FAILED'}">同步失败</c:when><c:otherwise><c:out value="${binding.status}"/></c:otherwise></c:choose></span></td><td class="mono"><c:out value="${empty binding.providerTemplateId ? '-' : binding.providerTemplateId}"/></td><td>v<c:out value="${binding.providerConfigVersion}"/></td><td><time data-browser-time="<c:out value='${binding.syncedAt}'/>" data-browser-time-format="date-time" datetime="<c:out value='${binding.syncedAt}'/>"><c:out value="${binding.syncedAt}" default="-"/></time><c:if test="${not empty binding.lastError}"><span class="cell-note danger-text"><c:out value="${binding.lastError}"/></span></c:if></td></tr></c:forEach>
    </tbody></table></div></c:otherwise>
</c:choose>
