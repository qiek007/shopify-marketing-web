const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../../main/resources/META-INF/resources');
const pages = ['public'].flatMap(module =>
    ['shopify', 'shopify-theme2'].map(theme => ({
        label: `${module}/${theme}`,
        editor: path.join(root, 'WEB-INF', theme, 'template-editor.jsp'),
        list: path.join(root, 'WEB-INF', theme, 'templates.jsp')
    })));
const read = file => fs.readFileSync(file, 'utf8');

function element(value = '') {
    const listeners = {}, classes = new Set();
    return {
        value, listeners, dataset: {}, disabled: false, hidden: true, textContent: '', attributes: {},
        addEventListener(type, fn) { listeners[type] = fn; },
        removeEventListener(type) { delete listeners[type]; },
        setAttribute(name, value) { this.attributes[name] = value; },
        scrollIntoView() {},
        classList: {
            add(name) { classes.add(name); },
            contains(name) { return classes.has(name); },
            toggle(name, enabled) { enabled ? classes.add(name) : classes.delete(name); }
        }
    };
}

function nativeUi(source, confirm = true) {
    const startMark = "document.getElementById('template-form').addEventListener('submit', function (event) {";
    const start = source.indexOf(startMark) + startMark.length;
    assert.ok(start >= startMark.length, 'native submit handler exists');
    const end = source.indexOf('\n    });', start);
    const draft = element(), sync = element(), lifecycle = element();
    draft.dataset.templateSaveMode = 'DRAFT';
    sync.dataset.templateSaveMode = 'SYNC';
    for (const button of [draft, sync]) button.querySelector = () => element();
    const fields = { saveMode: element('DRAFT'), subject: element('Subject'), preheader: element('Preview'), text: element('Text') };
    const form = element();
    form.action = 'https://console.example/app/templates/draft';
    form.elements = fields;
    form.querySelector = selector => selector === '[type="submit"]' ? draft
        : fields[(selector.match(/name="([^"]+)"/) || [])[1]];
    form.querySelectorAll = () => [draft, sync];
    const title = element(), message = element(), overlay = element(), state = element();
    overlay.querySelector = selector => /title|strong/.test(selector) ? title : message;
    const ids = { 'unsubscribe-label': element('取消订阅'), 'template-language': element('zh-CN'),
        'content-config': element('{}'), 'template-html': element(), 'template-save-overlay': overlay };
    let confirmations = 0;
    const submit = vm.runInNewContext(`(function (event) {${source.slice(start, end)}\n})`, {
        document: { getElementById: id => ids[id], body: element() },
        window: { confirm(message) { confirmations++; assert.equal(message, '保存当前内容并同步到邮件通道'); return confirm; } },
        activeEditorMode: 'source', sourceEditor: element('<p>Body</p>'), visualHtml: () => '<p>Body</p>',
        contentConfig: {}, stateLabel: state, Blob, URL, MAX_TEMPLATE_PAYLOAD_BYTES: 18 * 1024 * 1024,
        alert(message) { assert.fail(message); }
    });
    return { draft, sync, lifecycle, form, title, message, state,
        confirmations: () => confirmations,
        submit(button) {
            const event = { currentTarget: form, submitter: button, defaultPrevented: false,
                preventDefault() { this.defaultPrevented = true; } };
            submit(event);
            return event;
        } };
}

for (const page of pages) {
    test(`${page.label} exposes one DRAFT field, two actions, and independent published/draft state`, () => {
        const source = read(page.editor);
        assert.equal((source.match(/name="saveMode"/g) || []).length, 1);
        assert.match(source, /type="hidden" name="saveMode" value="DRAFT"/);
        assert.equal((source.match(/data-template-save-mode="DRAFT"/g) || []).length, 1);
        assert.equal((source.match(/data-template-save-mode="SYNC"/g) || []).length, 1);
        assert.match(source, /保存草稿/);
        assert.match(source, /同步到通道/);
        assert.match(source, /id="template-form"[^>]*action="\$\{ctx\}\/templates\/draft"/);
        assert.match(source, /data-template-save-mode="SYNC"[^>]*formaction="\$\{ctx\}\/templates"/);
        assert.match(source, /editorTemplate\.hasDraft/);
        assert.match(source, /有未同步草稿/);
        assert.match(source, /线上版本/);
        assert.match(source, /data-template-action-form/);
        const list = read(page.list);
        assert.match(list, /template\.hasDraft/);
        assert.match(list, /有未同步草稿/);
        assert.match(list, /<th>同步状态<\/th>/);
        assert.match(list, /<th>发布状态<\/th>/);
        assert.doesNotMatch(list, />线上版本</);
        assert.match(list, /data-sync-summary/);
    });

    const source = read(page.editor);
    if (!source.includes('id="email-editor-frame"')) {
        test(`${page.label} native draft has no sync confirmation and disables only editor submit buttons`, () => {
            const ui = nativeUi(source);
            ui.submit(ui.draft);
            assert.equal(ui.form.elements.saveMode.value, 'DRAFT');
            assert.equal(ui.form.action, 'https://console.example/app/templates/draft');
            assert.equal(ui.confirmations(), 0);
            assert.equal(ui.draft.disabled, true);
            assert.equal(ui.sync.disabled, true);
            assert.equal(ui.lifecycle.disabled, false);
            assert.match(ui.title.textContent, /保存草稿/);
            assert.doesNotMatch(ui.message.textContent, /同步邮件通道/);
        });
        test(`${page.label} native sync cancellation leaves both buttons usable`, () => {
            const ui = nativeUi(source, false);
            assert.equal(ui.submit(ui.sync).defaultPrevented, true);
            assert.equal(ui.confirmations(), 1);
            assert.equal(ui.draft.disabled, false);
            assert.equal(ui.sync.disabled, false);
        });
        test(`${page.label} native sync carries SYNC and an Enter submission defaults to DRAFT`, () => {
            const ui = nativeUi(source);
            ui.submit(ui.sync);
            assert.equal(ui.form.elements.saveMode.value, 'SYNC');
            assert.equal(ui.form.action, 'https://console.example/app/templates');
            assert.match(ui.title.textContent, /同步/);
            const enter = nativeUi(source);
            enter.form.elements.saveMode.value = 'SYNC';
            enter.submit(undefined);
            assert.equal(enter.form.elements.saveMode.value, 'DRAFT');
            assert.equal(enter.form.action, 'https://console.example/app/templates/draft');
            assert.equal(enter.confirmations(), 0);
        });
        test(`${page.label} native draft repairs a cached legacy publish action`, () => {
            const ui = nativeUi(source);
            ui.form.action = 'https://console.example/app/templates';
            ui.submit(ui.draft);
            assert.equal(ui.form.action, 'https://console.example/app/templates/draft');
        });
    }
}
