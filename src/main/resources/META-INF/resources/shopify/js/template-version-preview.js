(function () {
    'use strict';
    var dialog = document.getElementById('platform-template-preview-dialog');
    if (!dialog) return;
    var frame = document.getElementById('platform-template-preview-frame');
    var subject = document.getElementById('platform-template-preview-subject');
    var preheader = document.getElementById('platform-template-preview-preheader');
    var plainText = document.getElementById('platform-template-preview-text');
    var meta = document.getElementById('platform-template-preview-meta');
    var variables = document.getElementById('platform-template-preview-variables');
    var errorBox = document.getElementById('platform-template-preview-error');
    var errorText = document.getElementById('platform-template-preview-error-text');
    var retry = document.querySelector('[data-platform-preview-retry]');
    var title = document.getElementById('platform-template-preview-title');
    var kind = document.getElementById('platform-template-preview-kind');
    var generation = 0, activeController, activeButton;

    function load(button) {
        activeButton = button;
        var current = ++generation;
        if (activeController) activeController.abort();
        var controller = new AbortController();
        activeController = controller;
        var shopTemplate = button.hasAttribute('data-shop-template-preview');
        var version = button.dataset.shopTemplateVersion || 'WORKING';
        var query = new URLSearchParams({ shop: dialog.dataset.shop });
        var endpoint = shopTemplate ? dialog.dataset.shopPreviewUrl : dialog.dataset.platformPreviewUrl;
        if (shopTemplate) {
            query.set('templateId', button.dataset.shopTemplateId);
            query.set('version', version);
        } else {
            query.set('platformTemplateId', button.dataset.platformTemplateId);
            query.set('version', button.dataset.platformTemplateVersion);
        }
        var label = !shopTemplate ? '平台通用模板' : version === 'PUBLISHED' ? '已发布版本' : '当前已保存内容';
        title.textContent = label + '预览';
        kind.textContent = shopTemplate ? '店铺邮件模板' : '平台通用模板';
        subject.textContent = '正在加载模板…';
        preheader.textContent = ''; meta.textContent = ''; variables.textContent = ''; plainText.textContent = '';
        errorBox.hidden = true; retry.hidden = true;
        frame.srcdoc = '<p style="padding:24px;color:#68757d">正在加载…</p>';
        if (!dialog.open) dialog.showModal();
        var timeoutId = window.setTimeout(function () { controller.abort(); }, 12000);
        fetch(endpoint + '?' + query.toString(), {
            credentials: 'same-origin', cache: 'no-store', redirect: 'manual', signal: controller.signal,
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
        }).then(function (response) {
            if (current !== generation) return null;
            if (response.type === 'opaqueredirect' || response.status === 401 || response.status === 403 || response.status === 302) {
                throw new Error('登录状态已失效，请重新登录后重试');
            }
            return response.text().then(function (body) {
                var payload;
                try { payload = JSON.parse(body); } catch (ignored) { }
                if (!response.ok) throw new Error(payload && (payload.message || payload.error) || '模板加载失败（HTTP ' + response.status + '）');
                if ((response.headers.get('content-type') || '').indexOf('application/json') === -1 || !payload) {
                    throw new Error('模板服务返回了无法识别的内容');
                }
                return payload;
            });
        }).then(function (template) {
            if (current !== generation || !template) return;
            if (shopTemplate && version === 'PUBLISHED' && (template.hasDraft !== false
                    || ['PUBLISHED', 'DISABLED'].indexOf(template.status) === -1)) {
                throw new Error('服务未返回独立的已发布版本，请更新核心服务后重试。');
            }
            subject.textContent = template.subjectTemplate || template.subject || '无主题';
            preheader.textContent = template.preheaderTemplate || template.preheader || '';
            meta.textContent = shopTemplate ? label + ' · ' + (template.name || '')
                : (template.category || '通用') + ' · v' + template.version + ' · ' + template.name;
            plainText.textContent = template.textTemplate || template.text || '暂无纯文本版本';
            (template.variables || []).forEach(function (variable) {
                var chip = document.createElement('span');
                chip.className = 'variable-chip'; chip.textContent = '{{' + variable + '}}'; variables.appendChild(chip);
            });
            frame.srcdoc = template.htmlTemplate || template.html || '<p style="padding:24px;color:#68757d">暂无 HTML 内容</p>';
        }).catch(function (error) {
            if (current !== generation) return;
            subject.textContent = '模板加载失败';
            errorText.textContent = error.name === 'AbortError' ? '模板加载超时，请稍后重试。' : error.message || '暂时无法加载模板';
            errorBox.hidden = false; retry.hidden = false;
            frame.srcdoc = '<p style="padding:24px;color:#b42318">暂时无法加载此版本，请稍后重试。</p>';
        }).finally(function () { window.clearTimeout(timeoutId); });
    }
    var scope = typeof dialog.closest === 'function' ? dialog.closest('main') || document : document;
    if (typeof scope._templatePreviewCleanup === 'function') scope._templatePreviewCleanup();
    function onPreviewClick(event) {
        if (dialog.isConnected === false) return;
        var button = event.target.closest('[data-platform-preview], [data-shop-template-preview]');
        if (button) { event.preventDefault(); load(button); }
    }
    scope.addEventListener('click', onPreviewClick);
    scope._templatePreviewCleanup = function () { scope.removeEventListener('click', onPreviewClick); invalidate(); };
    retry.addEventListener('click', function () { if (activeButton) load(activeButton); });
    function invalidate() { generation++; if (activeController) activeController.abort(); }
    document.querySelectorAll('[data-platform-preview-close]').forEach(function (button) {
        button.addEventListener('click', function () { invalidate(); dialog.close(); });
    });
    dialog.addEventListener('close', invalidate);
}());
