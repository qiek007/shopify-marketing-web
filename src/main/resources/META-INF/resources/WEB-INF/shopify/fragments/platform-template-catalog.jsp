<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ page language="java" pageEncoding="UTF-8" contentType="text/html; charset=UTF-8" %>
<c:set var="ctx" value="${pageContext.request.contextPath}"/>
<span hidden data-platform-template-total="${platformTemplates.size()}"></span>
<c:choose>
    <c:when test="${empty platformTemplates}"><div class="empty-state"><i class="fa fa-cloud-download"></i><strong>暂无可用公共模板</strong><span>管理端公共模板服务暂不可用，或尚未发布模板。</span></div></c:when>
    <c:otherwise><div class="template-catalog"><c:forEach items="${platformTemplates}" var="item"><article class="template-catalog-item"><div><span class="template-category"><c:out value="${item.category}"/> · v<c:out value="${item.version}"/></span><h3><c:out value="${item.name}"/></h3><p><c:out value="${item.description}" default="平台发布的公共模板"/></p><small><c:out value="${item.subjectTemplate}"/></small></div><div class="template-catalog-actions"><button class="action-button" type="button" data-platform-preview data-platform-template-id="${item.templateId}" data-platform-template-version="${item.version}"><i class="fa fa-eye"></i><span>预览</span></button><form method="post" action="${ctx}/templates/platform/copy" data-platform-copy-form><input type="hidden" name="shop" value="${selectedShop}"><input type="hidden" name="platformTemplateId" value="${item.templateId}"><input type="hidden" name="version" value="${item.version}"><button class="action-button" type="submit"><i class="fa fa-copy"></i><span>复制到店铺</span></button></form></div></article></c:forEach></div></c:otherwise>
</c:choose>
