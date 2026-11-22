(function () {
    'use strict';
    function fingerprint(fields) { return JSON.stringify([fields.subject, fields.html, fields.text]); }
    function createState(initial, initialRevision, initialExists, tokenFactory) {
        var baseline = fingerprint(initial), revision = Number(initialRevision) || 0, exists = initialExists, publicationToken;
        return {
            dirty: function (fields) { return fingerprint(fields) !== baseline; },
            canPublish: function (fields) { return exists && fingerprint(fields) === baseline; },
            revision: function () { return revision; },
            saved: function (fields, nextRevision, nextExists) {
                if (revision !== Number(nextRevision)) publicationToken = undefined;
                baseline = fingerprint(fields); revision = Number(nextRevision) || 0; exists = nextExists;
            },
            token: function () { if (!publicationToken) publicationToken = (tokenFactory || function () { return crypto.randomUUID(); })(); return publicationToken; }
        };
    }
    function safePreviewDocument(html) {
        // Keep document scrolling active; only the rendered email contents are non-interactive.
        return "<!doctype html><html><head><meta charset=\"UTF-8\"><meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; style-src 'unsafe-inline'; img-src data:; form-action 'none'; base-uri 'none'\"><meta name=\"referrer\" content=\"no-referrer\"></head><body><div inert style=\"display:contents\">" + (html || '') + '</div></body></html>';
    }
    if (typeof module !== 'undefined' && module.exports) module.exports = {createState: createState, safePreviewDocument: safePreviewDocument};
    if (typeof document === 'undefined') return;
    var root = document.querySelector('[data-template-workspace]');
    if (!root) return;
    var editor = root.querySelector('[data-template-editor]'), editable = root.dataset.canConfigure === 'true', busy = false, stale = false;
    var select = function (selector) { return root.querySelector(selector); };
    var fields = function () { return {subject: editor.elements.subject.value, html: editor.elements.html.value, text: editor.elements.text.value}; };
    var state = createState(fields(), root.dataset.revision, root.dataset.exists === 'true');
    var localeSelect = select('#template-locale'), purposeSelect = select('#template-purpose'), newLanguage = select('[data-template-new-language]');
    function normalizedLocale(value) { return String(value || '').trim().replace(/_/g, '-').toLowerCase(); }
    function syncNewLanguagePurpose() { if (newLanguage && purposeSelect) newLanguage.elements.purpose.value = purposeSelect.value; }
    function refreshLocales(workspace) {
        if (!localeSelect || !localeSelect.options || !Array.isArray(workspace.locales)) return;
        var pending = localeSelect.value, current = editor.elements.locale.value, locales = [];
        workspace.locales.forEach(function (locale) { if (typeof locale === 'string' && locale && locales.indexOf(locale) === -1) locales.push(locale); });
        if (current && locales.indexOf(current) === -1) locales.push(current);
        localeSelect.replaceChildren();
        locales.forEach(function (locale) { var option = document.createElement('option'); option.value = locale; option.textContent = locale; localeSelect.appendChild(option); });
        localeSelect.value = locales.indexOf(pending) !== -1 ? pending : current;
    }
    var statusNames = {ACTIVE: '已发布', PUBLISHED: '已发布', READY: '已就绪', FAILED: '发布失败', STALE: '草稿已有更新', PENDING: '同步中', INACTIVE: '历史版本', SUPERSEDED: '历史版本'};
    function statusLabel(status) { return statusNames[status] || status || '待发布'; }
    function message(text, error) { var node = select('[data-template-message]'); node.textContent = text; node.hidden = false; node.classList.toggle('is-error', !!error); node.setAttribute('role', error ? 'alert' : 'status'); }
    function update() {
        var dirty = state.dirty(fields());
        select('[data-template-state]').textContent = stale ? '版本已更新，请重新加载' : dirty ? '有未保存修改' : state.canPublish(fields()) ? '已保存草稿 · r' + state.revision() : '新语言草稿';
        select('[data-template-state]').classList.toggle('is-dirty', dirty);
        root.querySelectorAll('[data-template-publish], [data-template-rollback]').forEach(function (button) { button.disabled = !editable || busy || stale || !state.canPublish(fields()); });
        root.querySelectorAll('[data-template-save], [data-template-preview-button], [data-template-default]').forEach(function (button) { button.disabled = !editable || busy || (stale && !button.hasAttribute('data-template-preview-button')); });
    }
    function cell(row, text) { var node = document.createElement('td'); node.textContent = text == null ? '—' : String(text); row.appendChild(node); return node; }
    function history(versions) {
        var body = select('[data-template-history]'); body.replaceChildren();
        if (!versions || !versions.length) { var empty = document.createElement('tr'); cell(empty, '尚无发布版本。保存并发布第一个草稿后，历史将显示在这里。').colSpan = 5; body.appendChild(empty); return; }
        versions.forEach(function (version) {
            var row = document.createElement('tr'); cell(row, 'v' + version.versionNumber);
            var status = cell(row, statusLabel(version.status) + (version.active ? ' · 当前生效' : ''));
            if (version.channelBindings && version.channelBindings.length) { var line = document.createElement('div'); line.className = 'template-hint'; line.textContent = version.channelBindings.length + ' 个发送通道已同步'; status.appendChild(line); }
            cell(row, version.publishedBy); cell(row, version.publishedAt);
            var actions = cell(row, '');
            if (editable && !version.active && version.status === 'PUBLISHED') { var button = document.createElement('button'); button.type = 'button'; button.className = 'template-text-button'; button.dataset.templateRollback = version.versionId; button.dataset.versionNumber = version.versionNumber; button.textContent = '回滚到此版本'; button.disabled = true; actions.appendChild(button); }
            body.appendChild(row);
        });
    }
    function apply(workspace) {
        if (!workspace || !workspace.draft) return;
        var draft = workspace.draft;
        ['subject', 'html', 'text'].forEach(function (key) { editor.elements[key].value = draft[key] || ''; });
        state.saved(fields(), draft.revision, draft.exists === true);
        select('[data-default-locale]').textContent = workspace.defaultLocale || '';
        refreshLocales(workspace);
        history(workspace.versions);
    }
    async function request(action, extra) {
        if (!editable || busy || (stale && action !== 'preview')) return;
        busy = true; editor.querySelector('fieldset').disabled = true; update();
        var params = new URLSearchParams();
        ['shop', 'purpose', 'locale', '_transactionalTemplateCsrf'].forEach(function (key) { params.set(key, editor.elements[key].value); });
        params.set('expectedRevision', String(state.revision()));
        if (action === 'draft' || action === 'preview') Object.keys(fields()).forEach(function (key) { params.set(key, fields()[key]); });
        Object.keys(extra || {}).forEach(function (key) { params.set(key, extra[key]); });
        try {
            var response = await fetch(root.dataset.endpoint + '/' + action, {method: 'POST', credentials: 'same-origin', headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', 'Accept': 'application/json'}, body: params.toString()});
            var result; try { result = await response.json(); } catch (_) { result = null; }
            if (response.status === 409) stale = true;
            if (!response.ok) {
                // Only business-validation details are safe to expose. Never display raw 5xx bodies.
                var detail = response.status < 500 && result && typeof result.message === 'string' ? result.message.trim() : '';
                throw new Error(detail || (response.status === 409 ? '模板已被其他人更新。请重新加载页面后再操作；当前输入仍保留。' : response.status === 403 ? '操作权限或会话校验已失效，请重新打开页面。' : response.status === 401 ? '登录已失效，请重新登录。' : response.status === 400 ? '模板校验未通过，请检查主题、正文、样式和变量；当前输入仍保留。' : '模板服务暂时无法完成操作，请稍后重试；当前输入仍保留。'));
            }
            var content = action === 'preview' ? result : result && result.draft;
            var valid = content && ['subject', 'html', 'text'].every(function (key) { return typeof content[key] === 'string'; });
            if (action !== 'preview') valid = valid && Number.isSafeInteger(content.revision) && content.revision >= 0 && typeof content.exists === 'boolean';
            if (action === 'publish') valid = valid && ['PUBLISHED', 'FAILED', 'STALE'].indexOf(result.publicationStatus) !== -1;
            if (!valid) throw new Error('服务返回了无效响应，操作结果尚未确认。请重试；当前输入仍保留。');
            if (action === 'preview') {
                select('[data-preview-subject]').textContent = result.subject || '';
                select('[data-preview-text]').textContent = result.text || '';
                select('[data-template-preview]').srcdoc = safePreviewDocument(result.html);
                message('预览已更新。');
            } else {
                if (result.publicationStatus === 'STALE') stale = true;
                else apply(result);
                if (result.publicationStatus === 'FAILED' || result.publicationStatus === 'STALE') message(result.publicationStatus === 'STALE' ? '发布未生效：草稿已有更新，请重新加载后再发布。' : '发布未生效，当前生效版本保持不变。' + (result.publicationError || '请重试发布。'), true);
                else message(action === 'draft' ? '草稿已保存，发布后生效。' : action === 'default-locale' ? '默认语言已更新。' : action === 'rollback' ? '所选版本已重新发布。' : '模板已发布。');
            }
        } catch (error) { message(error.message || '网络连接中断，请重试。', true); }
        finally { busy = false; editor.querySelector('fieldset').disabled = !editable; update(); }
    }
    editor.addEventListener('input', function () { update(); });
    editor.addEventListener('submit', function (event) { event.preventDefault(); if (editor.reportValidity()) request('draft'); });
    root.addEventListener('click', function (event) {
        var button = event.target.closest('button'); if (!button || button.disabled || busy) return;
        if (button.hasAttribute('data-template-preview-button')) { if (editor.reportValidity()) request('preview'); }
        else if (button.hasAttribute('data-template-publish') && state.canPublish(fields())) {
            if (window.confirm('发布当前已保存草稿？后续邮件将使用此版本。')) request('publish', {publicationToken: state.token()});
        } else if (button.hasAttribute('data-template-rollback') && state.canPublish(fields())) {
            if (window.confirm('重新发布所选历史版本？当前用途与语言的生效内容将被替换。')) request('rollback', {versionId: button.dataset.templateRollback});
        } else if (button.hasAttribute('data-template-default')) {
            if (state.dirty(fields())) { message('请先保存当前修改，再设置默认语言。', true); return; }
            request('default-locale');
        }
    });
    if (purposeSelect) purposeSelect.addEventListener('change', syncNewLanguagePurpose);
    syncNewLanguagePurpose();
    root.querySelectorAll('[data-template-selection]').forEach(function (form) {
        form.addEventListener('submit', function (event) {
            if (busy) { event.preventDefault(); return; }
            if (form === newLanguage) {
                syncNewLanguagePurpose();
                var tag = form.elements.locale.value.trim().replace(/_/g, '-');
                if (tag.length > 35 || !/^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{2,8})*$/.test(tag)) {
                    event.preventDefault(); message('请输入有效的新语言标签，例如 ja 或 zh-CN。', true); return;
                }
                var exists = localeSelect && Array.from(localeSelect.options || []).some(function (option) { return normalizedLocale(option.value) === normalizedLocale(tag); });
                if (exists) { event.preventDefault(); message('该语言已在已有语言列表中，请从下拉框选择后打开模板。', true); return; }
                form.elements.locale.value = tag;
            }
            if (state.dirty(fields()) && !window.confirm('当前修改尚未保存。离开并打开其他模板？')) event.preventDefault();
        });
    });
    window.addEventListener('beforeunload', function (event) { if (state.dirty(fields())) { event.preventDefault(); event.returnValue = ''; } });
    select('[data-template-preview]').srcdoc = safePreviewDocument('');
    update();
}());
