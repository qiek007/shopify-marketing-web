<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ page language="java" pageEncoding="UTF-8" contentType="text/html; charset=UTF-8" %>
<c:set var="ctx" value="${pageContext.request.contextPath}"/>
<div class="mr-results" data-mobile-recipient-results data-page="<c:out value='${recipientPage.page}'/>" data-read-state="<c:out value='${recipientReadState}'/>">
  <c:choose>
    <c:when test="${recipientReadState eq 'CURRENT'}"><p class="mr-notice" role="status">活动数据持续更新，以下为当前查询结果。</p></c:when>
    <c:when test="${recipientReadState eq 'UPDATING'}"><p class="mr-notice" data-partial role="status">回执同步中，已展示现有明细。状态、次数和筛选结果可能稍有延迟，请稍后重新查询。</p></c:when>
    <c:when test="${recipientReadState eq 'PARTIAL'}"><p class="mr-notice" data-partial role="status"><c:choose><c:when test="${recipientReadReason eq 'ARCHIVE_BUILDING'}">历史快照准备中，已展示当前可读取的数据。</c:when><c:otherwise>当前明细完整性尚未确认，已展示可读取的数据。</c:otherwise></c:choose>次数与筛选结果可能不完整；空白或零次不代表未发送、未送达或未发生。</p></c:when>
  </c:choose>
  <c:if test="${not empty recipientQuality}">
    <details class="mr-notice"><summary>数据核验情况</summary>
      <p>明细覆盖：<c:choose><c:when test="${recipientQuality.coverage eq 'IDENTITY_VERIFIED'}">已逐条核验</c:when><c:when test="${recipientQuality.coverage eq 'COUNT_ALIGNED'}">数量对齐，尚未逐条核验</c:when><c:when test="${recipientQuality.coverage eq 'COUNT_MISMATCH'}">数量未对齐</c:when><c:otherwise>尚未确认</c:otherwise></c:choose></p>
      <p>通道接收：<c:choose><c:when test="${recipientQuality.acceptance eq 'ALIGNED'}">上次核验对齐</c:when><c:when test="${recipientQuality.acceptance eq 'MISMATCH'}">存在差异</c:when><c:otherwise>尚未确认</c:otherwise></c:choose></p>
      <p>回调统计：<c:choose><c:when test="${recipientQuality.callbacks eq 'CALIBRATED'}">已按归档明细校准</c:when><c:when test="${recipientQuality.callbacks eq 'ALIGNED'}">上次核验对齐</c:when><c:when test="${recipientQuality.callbacks eq 'MISMATCH'}">存在差异</c:when><c:otherwise>尚未确认</c:otherwise></c:choose></p>
      <c:if test="${not empty recipientQuality.differences}"><p>上次核验差异（汇总 / 明细）：<c:forEach items="${recipientQuality.differences}" var="difference"><c:out value="${difference.label}"/> <c:out value="${difference.summaryCount}"/> / <c:out value="${difference.projectedCount}"/>；</c:forEach>不能单凭差异判断哪一侧有误。</p></c:if>
    </details>
  </c:if>
  <c:choose>
    <c:when test="${recipientReadState eq 'SYNCHRONIZING'}"><p class="mr-empty" role="status">收件人历史明细暂未就绪，正在同步或等待完整性核验，请稍后点击“查询”重试。</p></c:when>
    <c:otherwise>
      <p class="mr-count"><c:choose><c:when test="${recipientReadState eq 'PARTIAL' or recipientReadState eq 'UPDATING'}">当前可用数据匹配</c:when><c:otherwise>当前筛选匹配</c:otherwise></c:choose> <strong><c:out value="${recipientPage.total}"/></strong> 条</p>
      <c:if test="${empty recipientPage.items}"><p class="mr-empty"><c:choose><c:when test="${recipientReadState eq 'PARTIAL' or recipientReadState eq 'UPDATING'}">当前可用数据中没有匹配记录，不能据此认定活动没有收件人。可清除筛选或稍后重新查询。</c:when><c:otherwise>当前筛选没有匹配的收件人，可清除筛选后重试。</c:otherwise></c:choose></p></c:if>
      <c:forEach items="${recipientPage.items}" var="recipient">
        <c:set var="recipientName" value="${not empty recipient.customerName ? recipient.customerName : (not empty recipient.email ? recipient.email : '未命名客户')}"/>
        <c:set var="recipientState" value="待处理"/><c:set var="recipientStatus" value="PENDING"/><c:set var="recipientTone" value="warning"/>
        <c:choose>
          <c:when test="${not empty recipient.complainedAt}"><c:set var="recipientState" value="投诉"/><c:set var="recipientStatus" value="COMPLAINT"/><c:set var="recipientTone" value="danger"/></c:when>
          <c:when test="${not empty recipient.unsubscribedAt}"><c:set var="recipientState" value="退订"/><c:set var="recipientStatus" value="UNSUBSCRIBED"/><c:set var="recipientTone" value="danger"/></c:when>
          <c:when test="${not empty recipient.bouncedAt}"><c:set var="recipientState" value="退信"/><c:set var="recipientStatus" value="BOUNCED"/><c:set var="recipientTone" value="danger"/></c:when>
          <c:when test="${recipient.orderCount gt 0}"><c:set var="recipientState" value="已下单"/><c:set var="recipientStatus" value="CONVERTED"/><c:set var="recipientTone" value="success"/></c:when>
          <c:when test="${recipient.clickCount gt 0 or not empty recipient.clickedAt}"><c:set var="recipientState" value="已点击"/><c:set var="recipientStatus" value="CLICKED"/><c:set var="recipientTone" value="success"/></c:when>
          <c:when test="${recipient.openCount gt 0 or not empty recipient.openedAt}"><c:set var="recipientState" value="已打开"/><c:set var="recipientStatus" value="OPENED"/><c:set var="recipientTone" value="success"/></c:when>
          <c:when test="${not empty recipient.deliveredAt}"><c:set var="recipientState" value="已送达"/><c:set var="recipientStatus" value="DELIVERED"/><c:set var="recipientTone" value="success"/></c:when>
          <c:when test="${recipient.sendStatus eq 'FAILED'}"><c:set var="recipientState" value="失败"/><c:set var="recipientStatus" value="FAILED"/><c:set var="recipientTone" value="danger"/></c:when>
          <c:when test="${recipient.sendStatus eq 'UNKNOWN'}"><c:set var="recipientState" value="结果未知"/><c:set var="recipientStatus" value="UNKNOWN"/></c:when>
          <c:when test="${recipient.sendStatus eq 'ACCEPTED' or recipient.sendStatus eq 'SENT'}"><c:set var="recipientState" value="已提交"/><c:set var="recipientStatus" value="ACCEPTED"/><c:set var="recipientTone" value="success"/></c:when>
          <c:when test="${recipient.sendStatus eq 'SENDING'}"><c:set var="recipientState" value="发送中"/><c:set var="recipientStatus" value="SENDING"/></c:when>
        </c:choose>
        <article class="mr-card md-recipient-card">
          <div class="mr-card-head"><strong><c:out value="${recipientName}"/></strong><span class="mr-badge" data-tone="${recipientTone}" data-status="${recipientStatus}"><c:out value="${recipientState}"/></span></div>
          <p class="mr-email"><c:out value="${recipient.email}" default="邮箱未记录"/></p>
          <div class="mr-stats"><div><span>打开</span><strong><c:out value="${recipient.openCount}" default="—"/> 次</strong></div><div><span>点击</span><strong><c:out value="${recipient.clickCount}" default="—"/> 次</strong></div><div><span>转化</span><strong><c:out value="${recipient.orderCount}" default="—"/> 单</strong></div></div>
          <p class="mr-meta">送达：<time data-browser-time="<c:out value='${recipient.deliveredAt}'/>"><c:out value="${recipient.deliveredAt}" default="未记录"/></time></p>
          <c:if test="${recipient.machineOpenCount gt 0 or recipient.machineClickCount gt 0}"><p class="mr-meta">供应商标记的机器行为：打开 <c:out value="${recipient.machineOpenCount}" default="0"/> 次，点击 <c:out value="${recipient.machineClickCount}" default="0"/> 次。原始次数保持不变，未标记不代表真人。</p></c:if>
          <c:if test="${canViewCustomers and not empty recipient.customerSourceId}"><c:url var="recipientCustomerUrl" value="/mobile/customers/detail"><c:param name="shop" value="${shopDomain}"/><c:param name="customerId" value="${recipient.customerSourceId}"/></c:url><a class="mr-customer-open" data-recipient-customer href="<c:out value='${recipientCustomerUrl}'/>">打开客户详情 →</a></c:if>
          <details><summary>更多执行信息</summary><dl>
            <div><dt>客户 ID</dt><dd><c:out value="${recipient.customerSourceId}" default="未记录"/></dd></div>
            <div><dt>通道</dt><dd data-recipient-provider="<c:out value='${recipient.provider}'/>"><c:out value="${recipient.provider}" default="未记录"/></dd></div>
            <div><dt>尝试次数</dt><dd><c:out value="${recipient.attemptCount}" default="—"/></dd></div>
            <div><dt>发送时间</dt><dd><time data-browser-time="<c:out value='${recipient.sentAt}'/>"><c:out value="${recipient.sentAt}" default="未记录"/></time></dd></div>
            <div><dt>打开时间</dt><dd><time data-browser-time="<c:out value='${recipient.openedAt}'/>"><c:out value="${recipient.openedAt}" default="未记录"/></time></dd></div>
            <div><dt>点击时间</dt><dd><time data-browser-time="<c:out value='${recipient.clickedAt}'/>"><c:out value="${recipient.clickedAt}" default="未记录"/></time></dd></div>
            <c:if test="${recipient.orderCount gt 0}"><div><dt>归因金额</dt><dd><c:out value="${recipient.netRevenue}"/></dd></div><div><dt>最近下单</dt><dd><time data-browser-time="<c:out value='${recipient.lastOrderAt}'/>"><c:out value="${recipient.lastOrderAt}"/></time></dd></div></c:if>
            <c:if test="${not empty recipient.bouncedAt}"><div><dt>退信</dt><dd><time data-browser-time="<c:out value='${recipient.bouncedAt}'/>"><c:out value="${recipient.bouncedAt}"/></time></dd></div></c:if>
            <c:if test="${not empty recipient.complainedAt}"><div><dt>投诉</dt><dd><time data-browser-time="<c:out value='${recipient.complainedAt}'/>"><c:out value="${recipient.complainedAt}"/></time></dd></div></c:if>
            <c:if test="${not empty recipient.unsubscribedAt}"><div><dt>退订</dt><dd><time data-browser-time="<c:out value='${recipient.unsubscribedAt}'/>"><c:out value="${recipient.unsubscribedAt}"/></time></dd></div></c:if>
            <c:if test="${not empty recipient.lastErrorCode}"><div><dt>错误码</dt><dd><c:out value="${recipient.lastErrorCode}"/></dd></div></c:if>
            <c:if test="${not empty recipient.providerErrorName or not empty recipient.providerErrorDescription}"><div><dt>通道反馈</dt><dd><c:out value="${recipient.providerErrorName}"/> <c:out value="${recipient.providerErrorDescription}"/></dd></div></c:if>
          </dl></details>
        </article>
      </c:forEach>
      <c:if test="${not empty recipientPage.items or recipientPage.hasPrevious or recipientPage.hasNext}"><nav class="mr-pagination" aria-label="收件人分页"><c:if test="${recipientPage.hasPrevious}"><button type="button" data-recipient-page="${recipientPage.page - 1}">上一页</button></c:if><span>第 <c:out value="${recipientPage.page}"/> 页<c:if test="${recipientPage.totalPages gt 0}"> / <c:out value="${recipientPage.totalPages}"/> 页</c:if></span><c:if test="${recipientPage.hasNext}"><button type="button" data-recipient-page="${recipientPage.page + 1}">下一页</button></c:if><c:if test="${recipientPage.page gt 1}"><button type="button" data-recipient-page="1">第一页</button></c:if></nav></c:if>
    </c:otherwise>
  </c:choose>
</div>
