<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ page language="java" pageEncoding="UTF-8" contentType="text/html; charset=UTF-8" %>
<!DOCTYPE html><html lang="zh-CN"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>可视化模板编辑器 - Shopify 邮件营销</title><c:set var="ctx" value="${pageContext.request.contextPath}"/>
<link rel="stylesheet" href="${ctx}/baseui/static/h-ui/css/H-ui.min.css"><link rel="stylesheet" href="${ctx}/baseui/static/h-ui.admin/css/H-ui.admin.css"><link rel="stylesheet" href="${ctx}/baseui/lib/font-awesome-4.7.0/css/font-awesome.min.css"><link rel="stylesheet" href="${ctx}${uiAssetBase}/css/dashboard.css?v=20260921-template-saving"><link rel="stylesheet" href="${ctx}/shopify/vendor/grapesjs/grapes.min.css">
</head><body class="shopify-console"><%@ include file="fragments/header.jspf" %><div class="console-layout"><%@ include file="fragments/navigation.jspf" %><main class="console-main editor-main">
<section class="page-heading editor-heading"><div><p class="eyebrow">邮件模板</p><h1><c:choose><c:when test="${empty editorTemplate.templateId}">新建可视化模板</c:when><c:otherwise>编辑当前模板</c:otherwise></c:choose></h1><p hidden style="display: none;"><c:out value="${selectedShop}"/><c:if test="${not empty editorTemplate.templateId}"> · 保存后同步覆盖各邮件通道</c:if></p></div><a class="action-button" href="${ctx}/templates?shop=${selectedShop}"><i class="fa fa-arrow-left"></i><span>返回模板库</span></a></section>
<form id="template-form" class="editor-meta" method="post" action="${ctx}/templates">
<input type="hidden" name="shop" value="${selectedShop}"><input type="hidden" name="templateId" value="${editorTemplate.templateId}"><input id="template-html" type="hidden" name="html"><input id="custom-variables" type="hidden" name="customVariables" value="<c:out value='${editorTemplate.customVariablesJson}'/>"><input id="content-config" type="hidden" name="contentConfig" value="<c:out value='${editorTemplate.contentConfigJson}'/>">
<div class="editor-meta-row editor-meta-primary"><label><span>模板名称</span><input name="name" value="<c:out value='${editorTemplate.name}'/>" maxlength="255" required></label><label class="subject-field"><span>邮件主题</span><input name="subject" value="<c:out value='${editorTemplate.subject}'/>" placeholder="欢迎加入，{{firstName}}" required></label><label><span>纯文本备用内容</span><input name="text" value="<c:out value='${editorTemplate.text}'/>" placeholder="不支持 HTML 时显示"></label></div>
<div class="editor-meta-row editor-meta-secondary"><label><span>退订文案</span><input id="unsubscribe-label" maxlength="120" required placeholder="系统会自动生成 {{unsubscribeUrl}} 链接"></label><label><span>模板语言</span><select id="template-language" required><option value="zh-CN">简体中文（zh-CN）</option><option value="en-US">英语（en-US）</option><option value="ja-JP">日语（ja-JP）</option><option value="de-DE">德语（de-DE）</option></select></label><button class="primary-button" type="submit" <c:if test="${not canManageCampaigns}">disabled hidden</c:if>><i class="fa fa-cloud-upload"></i><span><c:choose><c:when test="${empty editorTemplate.templateId}">发布模板</c:when><c:otherwise>保存并同步</c:otherwise></c:choose></span></button></div>
</form>
<div id="template-save-overlay" class="template-save-overlay" hidden aria-live="polite" aria-busy="true"><div class="template-save-progress"><i class="fa fa-spinner fa-spin" aria-hidden="true"></i><strong><c:choose><c:when test="${empty editorTemplate.templateId}">正在发布模板</c:when><c:otherwise>正在保存并同步</c:otherwise></c:choose></strong><span>正在同步邮件通道，请稍候</span></div></div>
<section class="visual-editor-shell">
<div class="editor-toolbar" aria-label="编辑器工具栏"><div class="editor-toolbar-group"><button type="button" data-editor-command="undo" title="撤销上一步"><i class="fa fa-undo"></i><span>撤销</span></button><button type="button" data-editor-command="redo" title="重做上一步"><i class="fa fa-repeat"></i><span>重做</span></button><button type="button" data-editor-command="delete" title="删除当前选中的内容"><i class="fa fa-trash-o"></i><span>删除</span></button></div><div class="editor-toolbar-group editor-mode-switch" aria-label="编辑模式"><button class="active" type="button" data-editor-mode="visual">可视化编辑</button><button type="button" data-editor-mode="source">HTML 源码</button></div><div class="editor-toolbar-group editor-device-switch" aria-label="预览设备"><button class="active" type="button" data-editor-device="desktop" title="桌面预览"><i class="fa fa-desktop"></i><span>桌面</span></button><button type="button" data-editor-device="mobile" title="手机预览"><i class="fa fa-mobile"></i><span>手机</span></button></div><div class="editor-toolbar-group editor-save-state"><span id="editor-state">内容已载入</span></div></div>
<div class="variable-toolbar" aria-label="模板变量"><span>插入变量</span><button type="button" data-variable="{{firstName}}">名字</button><button type="button" data-variable="{{lastName}}">姓氏</button><button type="button" data-variable="{{email}}">邮箱</button><button type="button" data-variable="{{shopDomain}}">店铺域名</button><button type="button" data-variable="{{productTitle}}" title="单商品模板，发送时等同第一个商品">单商品名称</button><button type="button" data-variable="{{productPrice}}" title="单商品模板，发送时等同第一个商品">单商品价格</button><button type="button" data-variable="{{couponTitle}}">优惠名称</button><button type="button" data-variable="{{couponCode}}">优惠码</button><div class="custom-variable-control"><input id="custom-variable-name" placeholder="自定义变量名" maxlength="40"><input id="custom-variable-value" placeholder="默认值" maxlength="500"><button id="add-custom-variable" type="button">添加自定义变量</button></div></div>
<div id="visual-editor-mode" class="visual-editor-layout"><aside class="editor-side-panel editor-block-panel"><div class="editor-panel-title"><strong>内容块</strong><span>拖入邮件画布</span></div><div id="editor-blocks"></div></aside><div class="editor-canvas-wrap"><div id="gjs"></div></div><aside class="editor-side-panel editor-style-panel"><div class="editor-panel-title"><strong>样式</strong><span>选中内容后调整</span></div><div id="editor-styles"></div></aside></div>
<textarea id="template-source-editor" class="template-source-editor" hidden spellcheck="false" aria-label="HTML 源码"></textarea>
</section>
<textarea id="initial-html" hidden><c:out value="${editorTemplate.html}"/></textarea>
</main></div>
<script src="${ctx}/shopify/vendor/grapesjs/grapes.min.js"></script>
<script>
(function () {
    var MAX_EMBEDDED_IMAGE_BYTES = 2 * 1024 * 1024;
    var MAX_TEMPLATE_PAYLOAD_BYTES = 18 * 1024 * 1024;
    var ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    var shop = document.querySelector('[name="shop"]').value;
    var contentConfig = JSON.parse(document.getElementById('content-config').value || '{}');
    var initialHtml = document.getElementById('initial-html').value.trim();
    var configuredSlotCount = 12;
    contentConfig.productSlotCount = configuredSlotCount;
    contentConfig.unsubscribeLabel = String(contentConfig.unsubscribeLabel || '取消订阅');
    contentConfig.templateLanguage = String(contentConfig.templateLanguage || 'zh-CN');
    document.getElementById('unsubscribe-label').value = contentConfig.unsubscribeLabel;
    var languageSelect = document.getElementById('template-language');
    if (!languageSelect.querySelector('option[value="' + contentConfig.templateLanguage + '"]')) {
        var historicalLanguage = document.createElement('option');
        historicalLanguage.value = contentConfig.templateLanguage;
        historicalLanguage.textContent = contentConfig.templateLanguage + '（历史模板）';
        languageSelect.appendChild(historicalLanguage);
    }
    languageSelect.value = contentConfig.templateLanguage;
    document.getElementById('content-config').value = JSON.stringify(contentConfig);
    if (!initialHtml) {
        initialHtml = '<div style="max-width:640px;margin:0 auto;background:#ffffff;font-family:Arial,sans-serif;color:#24323a">' +
            '<div style="padding:32px 36px;border-top:6px solid #16845b">' +
            '<p style="margin:0 0 10px;color:#16845b;font-size:13px;font-weight:bold">店铺邮件</p>' +
            '<h1 style="margin:0 0 18px;font-size:28px;line-height:1.25">你好，{{firstName}}</h1>' +
            '<p style="margin:0 0 22px;font-size:16px;line-height:1.7">在这里输入邮件正文，也可以从左侧拖入新的内容块。</p>' +
            '<a href="#" style="display:inline-block;padding:12px 20px;background:#16845b;color:#ffffff;text-decoration:none;border-radius:4px">查看详情</a>' +
            '</div></div>';
    }
    var editor = grapesjs.init({
        container: '#gjs', height: '700px', width: 'auto', fromElement: false,
        components: initialHtml, storageManager: false, panels: { defaults: [] },
        assetManager: {
            upload: false,
            embedAsBase64: true,
            uploadFile: function (event) {
                var files = event.dataTransfer ? event.dataTransfer.files : event.target.files;
                Array.prototype.forEach.call(files || [], function (file) {
                    if (ALLOWED_IMAGE_TYPES.indexOf(file.type) < 0) {
                        alert('图片仅支持 PNG、JPEG、GIF 或 WebP 格式'); return;
                    }
                    if (file.size > MAX_EMBEDDED_IMAGE_BYTES) {
                        alert('单张图片不能超过 2 MiB'); return;
                    }
                    var reader = new FileReader();
                    reader.onload = function (loaded) {
                        var source = String(loaded.target.result || '');
                        if (source.indexOf('data:image/') !== 0) {
                            alert('图片读取失败，请重新选择'); return;
                        }
                        editor.AssetManager.add({ src: source, name: file.name });
                        var selected = editor.getSelected();
                        if (selected && selected.is('image')) selected.addAttributes({ src: source });
                    };
                    reader.readAsDataURL(file);
                });
            }
        },
        blockManager: { appendTo: '#editor-blocks' },
        styleManager: { appendTo: '#editor-styles', sectors: [
            { name: '尺寸与间距', open: true, buildProps: ['width', 'max-width', 'min-height', 'margin', 'padding'] },
            { name: '文字', open: true, buildProps: ['font-family', 'font-size', 'font-weight', 'line-height', 'color', 'text-align', 'text-decoration'] },
            { name: '外观', open: false, buildProps: ['background-color', 'border', 'border-radius'] }
        ] },
        deviceManager: { devices: [
            { id: 'desktop', name: '桌面', width: '' },
            { id: 'mobile', name: '手机', width: '375px', widthMedia: '480px' }
        ] }
    });
    var blocks = editor.BlockManager;
    blocks.add('email-section', { label: '内容区', category: '结构', content: '<section style="padding:28px 32px;background:#ffffff"><p style="line-height:1.7">在这里编辑内容</p></section>' });
    blocks.add('email-columns', { label: '双栏', category: '结构', content: '<table role="presentation" width="100%" style="border-collapse:collapse"><tr><td width="50%" style="padding:14px;vertical-align:top">左侧内容</td><td width="50%" style="padding:14px;vertical-align:top">右侧内容</td></tr></table>' });
    blocks.add('email-heading', { label: '标题', category: '基础内容', content: '<h2 style="margin:0 0 16px;font-size:24px;line-height:1.3">邮件标题</h2>' });
    blocks.add('email-text', { label: '正文', category: '基础内容', content: '<p style="margin:0 0 16px;font-size:16px;line-height:1.7">双击编辑文本内容</p>' });
    blocks.add('email-image', { label: '图片', category: '基础内容', select: true, content: { type: 'image', style: { width: '100%', height: 'auto' } } });
    blocks.add('email-button', { label: '按钮', category: '基础内容', content: '<a href="#" style="display:inline-block;padding:12px 20px;background:#16845b;color:#ffffff;text-decoration:none;border-radius:4px">立即查看</a>' });
    blocks.add('email-divider', { label: '分隔线', category: '基础内容', content: '<hr style="border:0;border-top:1px solid #dde4ea;margin:22px 0">' });
    blocks.add('email-spacer', { label: '留白', category: '基础内容', content: '<div style="height:28px;line-height:28px">&nbsp;</div>' });
    blocks.add('email-footer', { label: '邮件页脚', category: '基础内容', content: '<div style="padding:20px;color:#61717c;font-size:12px;line-height:1.6;text-align:center">来自 {{shopDomain}} 的店铺消息</div>' });
    blocks.add('product-card', { label: '商品卡片', category: '商品内容', content: '<table role="presentation" width="100%" style="border-collapse:collapse;background:#ffffff"><tr><td style="padding:16px"><a href="{{productUrl}}" style="text-decoration:none;color:#24323a"><img src="{{productImageUrl}}" alt="{{productTitle}}" style="display:block;width:100%;height:auto;max-height:360px;object-fit:contain"><h2 style="margin:16px 0 8px">{{productTitle}}</h2><p style="margin:0 0 16px;font-size:18px;font-weight:bold">{{productPrice}}</p><span style="display:inline-block;padding:12px 20px;background:#16845b;color:#ffffff;border-radius:4px">查看商品</span></a></td></tr></table>' });
    function fixedProductListMarkup(slotCount) {
        var cards = [];
        for (var slot = 1; slot <= slotCount; slot++) {
            cards.push('<div style="display:{{product' + slot + 'Display}};"><table role="presentation" width="100%" style="border-collapse:collapse;background:#ffffff;border-bottom:1px solid #dde4ea"><tr><td width="180" style="padding:16px;vertical-align:top"><a href="{{product' + slot + 'Url}}"><img src="{{product' + slot + 'ImageUrl}}" alt="{{product' + slot + 'Title}}" width="148" style="display:block;width:148px;max-width:100%;height:auto"></a></td><td style="padding:16px;vertical-align:middle"><h3 style="margin:0 0 8px;font-size:20px;line-height:1.35">{{product' + slot + 'Title}}</h3><p style="margin:0 0 14px;font-size:17px;font-weight:bold">{{product' + slot + 'Price}}</p><a href="{{product' + slot + 'Url}}" style="display:inline-block;padding:10px 16px;background:#16845b;color:#ffffff;text-decoration:none;border-radius:4px">查看商品</a></td></tr></table></div>');
        }
        return cards.join('');
    }
    blocks.add('product-list', { label: '多商品列表', category: '商品内容', content: fixedProductListMarkup(configuredSlotCount) });
    blocks.add('coupon-code', { label: '优惠码', category: '商品内容', content: '<div style="padding:20px;border:1px dashed #16845b;text-align:center"><p style="margin:0 0 8px">{{couponTitle}}</p><strong style="font-size:22px;letter-spacing:0">{{couponCode}}</strong></div>' });
    var stateLabel = document.getElementById('editor-state');
    var visualEditorMode = document.getElementById('visual-editor-mode');
    var sourceEditor = document.getElementById('template-source-editor');
    var activeEditorMode = 'visual';
    function visualHtml() {
        var css = editor.getCss();
        return editor.getHtml() + (css ? '<style>' + css + '</style>' : '');
    }
    function syncSourceFromVisual() { sourceEditor.value = visualHtml(); }
    function syncVisualFromSource() {
        var html = sourceEditor.value.trim();
        if (!html) { alert('HTML 源码不能为空'); return false; }
        editor.setComponents(html);
        return true;
    }
    document.querySelectorAll('[data-editor-mode]').forEach(function (button) {
        button.addEventListener('click', function () {
            var mode = button.dataset.editorMode;
            if (mode === activeEditorMode) return;
            if (mode === 'source') syncSourceFromVisual();
            if (mode === 'visual' && !syncVisualFromSource()) return;
            activeEditorMode = mode;
            visualEditorMode.hidden = mode !== 'visual';
            sourceEditor.hidden = mode !== 'source';
            document.querySelectorAll('[data-editor-mode]').forEach(function (item) {
                item.classList.toggle('active', item === button);
            });
            stateLabel.textContent = mode === 'source' ? '正在编辑 HTML 源码' : '已切换到可视化编辑';
        });
    });
    sourceEditor.addEventListener('input', function () { stateLabel.textContent = '有未保存修改'; });
    editor.on('update', function () { stateLabel.textContent = '有未保存修改'; });
    document.querySelectorAll('[data-editor-command]').forEach(function (button) {
        button.addEventListener('click', function () {
            var command = button.getAttribute('data-editor-command');
            if (command === 'undo') editor.UndoManager.undo();
            if (command === 'redo') editor.UndoManager.redo();
            if (command === 'delete') {
                var selected = editor.getSelected();
                if (selected) selected.remove();
            }
        });
    });
    document.querySelectorAll('[data-editor-device]').forEach(function (button) {
        button.addEventListener('click', function () {
            document.querySelectorAll('[data-editor-device]').forEach(function (item) { item.classList.remove('active'); });
            button.classList.add('active');
            editor.setDevice(button.getAttribute('data-editor-device'));
        });
    });
    document.querySelectorAll('[data-variable]').forEach(function (button) {
        button.addEventListener('click', function () {
            var variable = button.getAttribute('data-variable');
            var selected = editor.getSelected();
            if (selected && selected.is('text')) selected.append(variable);
            else editor.addComponents('<span>' + variable + '</span>');
        });
    });
    var customVariables = JSON.parse(document.getElementById('custom-variables').value || '{}');
    var variableLabels = {
        campaignMessage: '活动文案',
        promoText: '促销文案'
    };
    function addVariableButton(name) {
        var button = document.createElement('button');
        button.type = 'button';
        button.textContent = variableLabels[name] || name;
        button.title = '{{' + name + '}}';
        button.dataset.variable = '{{' + name + '}}';
        button.addEventListener('click', function () {
            var selected = editor.getSelected();
            if (selected && selected.is('text')) selected.append(button.dataset.variable);
            else editor.addComponents('<span>' + button.dataset.variable + '</span>');
        });
        document.querySelector('.custom-variable-control').before(button);
    }
    Object.keys(customVariables).forEach(addVariableButton);
    document.getElementById('add-custom-variable').addEventListener('click', function () {
        var nameInput = document.getElementById('custom-variable-name');
        var valueInput = document.getElementById('custom-variable-value');
        var name = nameInput.value.trim();
        if (!/^[A-Za-z][A-Za-z0-9_]{1,39}$/.test(name)) {
            alert('变量名必须以字母开头，只能包含字母、数字和下划线'); return;
        }
        customVariables[name] = valueInput.value;
        document.getElementById('custom-variables').value = JSON.stringify(customVariables);
        addVariableButton(name);
        nameInput.value = ''; valueInput.value = '';
    });
    document.getElementById('template-form').addEventListener('submit', function (event) {
        var html = activeEditorMode === 'source' ? sourceEditor.value.trim() : visualHtml();
        var form = event.currentTarget;
        var subject = form.querySelector('[name="subject"]').value || '';
        var text = form.querySelector('[name="text"]').value || '';
        contentConfig.unsubscribeLabel = document.getElementById('unsubscribe-label').value.trim();
        contentConfig.templateLanguage = document.getElementById('template-language').value.trim();
        document.getElementById('content-config').value = JSON.stringify(contentConfig);
        if (new Blob([subject, html, text]).size > MAX_TEMPLATE_PAYLOAD_BYTES) {
            event.preventDefault();
            alert('模板主题、正文和嵌入图片合计不能超过 18 MiB');
            return;
        }
        document.getElementById('template-html').value = html;
        var saveOverlay = document.getElementById('template-save-overlay');
        var submitButton = form.querySelector('[type="submit"]');
        submitButton.disabled = true;
        submitButton.setAttribute('aria-disabled', 'true');
        submitButton.querySelector('i').className = 'fa fa-spinner fa-spin';
        saveOverlay.hidden = false;
        document.body.classList.add('template-save-pending');
        stateLabel.textContent = '正在保存';
    });
})();
</script></body></html>
