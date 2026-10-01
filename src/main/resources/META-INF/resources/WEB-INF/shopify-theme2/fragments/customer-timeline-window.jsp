<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ page pageEncoding="UTF-8" %>
<c:set var="ctx" value="${pageContext.request.contextPath}"/>
<div class="timeline-window-block"
     data-window-from="<c:out value='${timelineWindow.fromDate}'/>"
     data-window-to="<c:out value='${timelineWindow.toDate}'/>"
     data-window-count="<c:out value='${timelineWindow.totalCount}'/>"
     data-window-has-earlier="<c:out value='${timelineWindow.hasEarlier}'/>"
     data-window-earlier-known="<c:out value='${timelineEarlierKnown}'/>">
    <div class="timeline-window-heading">
        <span><c:out value="${timelineWindow.fromDate}"/> 至 <c:out value="${timelineWindow.toDate}"/></span>
        <strong><c:out value="${timelineWindow.totalCount}"/> 项行为</strong>
    </div>
    <c:choose>
        <c:when test="${empty timelineWindow.groups}">
            <div class="timeline-window-empty"><i class="fa fa-calendar-o"></i><span>这个时间段没有行为记录</span></div>
        </c:when>
        <c:otherwise>
            <c:set var="timelineGroups" value="${timelineGroupPagingEnabled ? timelineWindow.groups : timelineWindow.completeGroups}"/>
            <div class="timeline">
                <c:forEach items="${timelineGroups}" var="group" varStatus="groupStatus">
                    <c:choose>
                        <c:when test="${group.collapsed}">
                            <details class="timeline-group ${group.kind eq 'CAMPAIGN' ? 'campaign-group' : 'browsing-group'}">
                                <summary>
                                    <span class="timeline-group-title"><c:out value="${group.title}"/> <span class="timeline-group-count"><c:out value="${group.count}"/> 条</span></span>
                                    <span class="timeline-group-range"><time data-browser-time="<c:out value='${group.earliestAt}'/>" datetime="<c:out value='${group.earliestAt}'/>"><c:out value="${group.earliestAt}"/></time> 至 <time data-browser-time="<c:out value='${group.latestAt}'/>" datetime="<c:out value='${group.latestAt}'/>"><c:out value="${group.latestAt}"/></time></span>
                                </summary>
                                <c:if test="${group.kind eq 'CAMPAIGN' and not empty group.campaignId}">
                                    <c:url var="customerCampaignPreviewUrl" value="/customers/campaign-preview"><c:param name="shop" value="${selectedShop}"/><c:param name="campaignId" value="${group.campaignId}"/><c:param name="customerId" value="${customerId}"/></c:url>
                                    <c:url var="automationSettingsUrl" value="/automations"><c:param name="shop" value="${selectedShop}"/><c:param name="automationId" value="${group.automationId}"/></c:url>
                                    <div class="timeline-group-actions">
                                        <c:if test="${canViewCampaigns}"><c:choose><c:when test="${not empty group.automationId}"><a class="timeline-action-link" href="${automationSettingsUrl}"><i class="fa fa-random"></i>查看自动营销</a></c:when><c:otherwise><a class="timeline-action-link" href="${ctx}/campaigns/detail?shop=${selectedShop}&amp;campaignId=${group.campaignId}"><i class="fa fa-paper-plane-o"></i>查看活动</a></c:otherwise></c:choose></c:if>
                                        <a class="timeline-action-link" href="${customerCampaignPreviewUrl}" data-customer-email-preview><i class="fa fa-envelope-open-o"></i>预览该客户邮件</a>
                                    </div>
                                </c:if>
                                <div class="timeline-group-items">
                                    <c:forEach items="${group.activities}" var="activity">
                                        <%@ include file="customer-activity.jspf" %>
                                    </c:forEach>
                                </div>
                                <c:if test="${group.hasMore and timelineGroupPagingEnabled}">
                                    <button class="timeline-group-more" type="button"
                                            data-timeline-group-more
                                            data-group-index="<c:out value='${groupStatus.index}'/>"
                                            data-next-offset="50">
                                        <i class="fa fa-angle-down"></i><span>再加载 50 条</span>
                                    </button>
                                </c:if>
                            </details>
                        </c:when>
                        <c:otherwise>
                            <c:forEach items="${group.activities}" var="activity">
                                <%@ include file="customer-activity.jspf" %>
                            </c:forEach>
                        </c:otherwise>
                    </c:choose>
                </c:forEach>
            </div>
        </c:otherwise>
    </c:choose>
    <c:if test="${timelineWindow.hasMore}">
        <button class="timeline-page-more" type="button"
                data-timeline-page-more
                data-next-cursor="<c:out value='${timelineWindow.nextCursor}'/>">
            <i class="fa fa-angle-down"></i><span>继续加载此时间段</span>
        </button>
    </c:if>
</div>
