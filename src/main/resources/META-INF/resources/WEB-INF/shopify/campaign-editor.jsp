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
    <link rel="stylesheet" href="${ctx}${uiAssetBase}/css/dashboard.css?v=20260915-p92">
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
                <c:when test="${empty segments}"><div class="empty-state compact"><i class="fa fa-users"></i><strong>尚未建立客户分群</strong><span>请先新建分群并预览可发送客户。</span><a class="primary-button" href="${ctx}/segments/editor?shop=${selectedShop}"><i class="fa fa-plus"></i>新建分群</a></div></c:when>
                <c:otherwise>
                    <form class="workspace-form" method="post" action="${ctx}/campaigns">
                        <input type="hidden" name="shop" value="${selectedShop}">
                        <input type="hidden" name="campaignId" value="${editorCampaign.campaignId}">
                        <input id="campaign-variables" type="hidden" name="campaignVariables" value="<c:out value='${editorCampaign.campaignVariablesJson}'/>">
                        <div class="form-grid three">
                            <label><span>活动名称</span><input name="name" value="${editorCampaign.name}" required maxlength="255"></label>
                            <label><span>邮件模板</span><select name="templateId" required><c:forEach items="${templates}" var="template"><option value="${template.templateId}" ${template.templateId eq editorCampaign.templateId ? 'selected' : ''}><c:out value="${template.name}"/></option></c:forEach></select></label>
                            <label><span>客户分群</span><select name="segmentId" required><c:forEach items="${segments}" var="segment"><option value="${segment.segmentId}" ${segment.segmentId eq editorCampaign.segmentId ? 'selected' : ''}><c:out value="${segment.name}"/> · <c:out value="${segment.ruleSummary}"/></option></c:forEach></select></label>
                        </div>
                        <section class="campaign-personalization"><div class="section-intro"><strong>活动内容参数</strong><span>审批通过后与客户资料一起冻结，发送时提交给邮件通道动态模板</span></div><div id="campaign-custom-variables" class="form-grid two"></div><div class="form-grid two"><div class="campaign-product-picker"><label for="campaign-product-search">关联商品（最多 12 个）</label><div class="field-with-action"><input id="campaign-product-search" placeholder="搜索当前店铺商品"><button id="campaign-product-search-button" type="button"><i class="fa fa-search"></i><span>搜索</span></button></div><select id="campaign-product" aria-label="选择关联商品"><option value="">选择商品后加入</option></select><div class="campaign-selected-products"><div class="selected-products-header"><strong>已选商品</strong><span id="selected-products-count" aria-live="polite">0 / 12</span></div><div id="campaign-selected-products" class="selected-products-list" role="list" aria-live="polite"></div></div><div id="campaign-product-inputs"><c:forEach items="${editorCampaign.productSourceIds}" var="productSourceId"><input type="hidden" name="productSourceIds" value="<c:out value='${productSourceId}'/>"></c:forEach></div></div><label><span>优惠券</span><div class="field-with-action"><input id="campaign-discount-search" placeholder="搜索有效优惠码"><button id="campaign-discount-search-button" type="button"><i class="fa fa-search"></i><span>搜索</span></button></div><select id="campaign-discount" name="discountSourceId"><option value="">不使用优惠券</option></select></label></div></section>
                        <div class="form-grid two repeat-interval-field">
                            <label><span>重复发送间隔（小时）</span><input name="repeatIntervalHours" type="number" min="0" max="8760" step="1" value="${editorCampaign.repeatIntervalHours}" required><small class="field-note">0 表示不限制且不查询历史发送记录；默认 24 小时。</small></label>
                            <label><span>持续天数</span><input name="hotRetentionDays" type="number" min="7" max="60" step="1" value="${editorCampaign.hotRetentionDays}" required><small class="field-note">发送完成后在热表和热索引中保留，默认 14 天，可设置 7 至 60 天；到期后归档至 Doris。</small></label>
                        </div>
                        <fieldset class="channel-selector"><legend>发送邮件通道</legend><p class="field-note">可多选，邮件发送服务会在选中的可用通道中自动分配。</p><div class="channel-options-grid">
                            <c:forEach items="${senderSettings}" var="setting"><label class="channel-option"><input type="checkbox" name="providers" value="${setting.provider}" <c:if test="${not editorCampaign.existing or editorCampaign.providerSelections[setting.provider]}">checked</c:if>><span><strong><c:out value="${providerAliases[setting.provider]}"/></strong><small><c:out value="${setting.fromHeader}"/></small></span></label></c:forEach></div>
                        </fieldset>
                        <div class="form-actions spaced-actions"><a class="action-button" href="${ctx}/campaigns?shop=${selectedShop}">取消</a><button class="primary-button" type="submit" <c:if test="${not canManageCampaigns}">disabled hidden</c:if>><i class="fa fa-save"></i>保存活动</button></div>
                    </form>
                </c:otherwise>
            </c:choose>
        </section>
    </main>
</div>
<script>
(function () {
    var shop = document.querySelector('[name="shop"]').value;
    var templateSelect = document.querySelector('[name="templateId"]');
    var variablesField = document.getElementById('campaign-variables');
    var variables = JSON.parse(variablesField.value || '{}');
    var MAX_PRODUCTS = 12;
    var productInputHost = document.getElementById('campaign-product-inputs');
    var selectedProducts = Array.prototype.map.call(
        productInputHost.querySelectorAll('input[name="productSourceIds"]'),
        function (input) { return { sourceId: input.value, title: input.value }; });
    var productCatalog = {};
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
            var retained = document.createElement('option'); retained.value = selected;
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
        return api('/templates/products', { shop: shop, q: query || '' }).then(function (items) {
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
        });
    }
    function loadDiscounts(query, selected) {
        return api('/templates/discounts', { shop: shop, q: query || '' }).then(function (items) {
            populate(document.getElementById('campaign-discount'), items, selected,
                '不使用优惠券', function (item) {
                    var label = item.title === item.code ? item.code : item.title + ' · ' + item.code;
                    return item.summary ? label + ' · ' + item.summary : label;
                });
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
    document.getElementById('campaign-product-search-button').addEventListener('click', function () {
        loadProducts(document.getElementById('campaign-product-search').value.trim());
    });
    document.getElementById('campaign-product').addEventListener('change', function (event) {
        var product = productCatalog[event.target.value];
        if (product) addProduct(product);
        event.target.value = '';
    });
    document.getElementById('campaign-discount-search-button').addEventListener('click', function () {
        loadDiscounts(document.getElementById('campaign-discount-search').value.trim(),
            document.getElementById('campaign-discount').value);
    });
    renderSelectedProducts();
    loadDiscounts('', initialDiscount).catch(function (error) { alert(error.message); });
    loadTemplateOptions(false);
})();
</script>
</body>
</html>
