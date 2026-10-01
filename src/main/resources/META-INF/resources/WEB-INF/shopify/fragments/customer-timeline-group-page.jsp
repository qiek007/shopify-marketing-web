<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ page pageEncoding="UTF-8" %>
<div class="timeline-group-page" data-has-more="<c:out value='${hasMore}'/>"
     data-next-offset="<c:out value='${nextOffset}'/>">
    <c:forEach items="${activities}" var="activity">
        <%@ include file="customer-activity.jspf" %>
    </c:forEach>
</div>
