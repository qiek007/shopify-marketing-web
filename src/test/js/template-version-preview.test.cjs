const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const workspace = path.resolve(__dirname, '../../main/resources/META-INF/resources');
const resources = () => workspace;

for (const module of ['public']) {
  for (const theme of ['shopify', 'shopify-theme2']) {
    test(`${module}/${theme}: lists editing and published states independently`, () => {
      const page = fs.readFileSync(path.join(resources(module), 'WEB-INF', theme, 'templates.jsp'), 'utf8');
      assert.match(page, /<th>编辑状态<\/th>/);
      assert.match(page, /<th>发布状态<\/th>/);
      assert.match(page, /<table class="[^"]*template-version-list/);
      assert.match(page, /有未同步草稿/);
      assert.match(page, /data-shop-template-version="WORKING"/);
      assert.match(page, /data-shop-template-version="PUBLISHED"/);
      assert.doesNotMatch(page, /class="cell-note"><span class="status-pill neutral">草稿未同步/);
      const mainStart = page.indexOf('<main '), mainEnd = page.indexOf('</main>');
      for (const asset of ['template-versions.css', 'template-version-preview.js', 'template-sync-details.js']) {
        assert.ok(page.indexOf(asset) > mainStart && page.indexOf(asset) < mainEnd, `${asset}必须在局部导航保留的main内`);
      }
    });
    test(`${module}/${theme}: editor exposes version summaries and a guarded discard form`, () => {
      const page = fs.readFileSync(path.join(resources(module), 'WEB-INF', theme, 'template-editor.jsp'), 'utf8');
      assert.match(page, /当前编辑内容/);
      assert.match(page, /已发布版本/);
      assert.match(page, /templateVersions\.publishedAvailable/);
      assert.match(page, /value="discard-draft"/);
      assert.match(page, /name="expectedDraftToken"/);
      assert.match(page, /name="expectedPublishedToken"/);
      assert.match(page, /data-action-progress="正在恢复已发布版本"/);
      assert.match(page, /fragments\/template-preview\.jspf/);
    });
    test(`${module}/${theme}: synchronized channels with another hash are shown as mismatched`, () => {
      const fragment = fs.readFileSync(path.join(resources(module), 'WEB-INF', theme, 'fragments/template-synchronization.jsp'), 'utf8');
      assert.match(fragment, /binding\.contentHash ne templateSync\.contentHash/);
      assert.match(fragment, /版本不一致/);
      assert.match(fragment, /版本待核对/);
    });
  }
}

function setup() {
  const nodes = new Map(), documentListeners = {}, requests = [];
  function node(id) {
    if (!nodes.has(id)) nodes.set(id, {
      dataset: {}, listeners: {}, textContent: '', hidden: false, srcdoc: '', open: false,
      addEventListener(type, handler) { this.listeners[type] = handler; },
      showModal() { this.open = true; }, close() { this.open = false; },
      replaceChildren() { this.textContent = ''; }, appendChild() {}
    });
    return nodes.get(id);
  }
  const dialog = node('platform-template-preview-dialog');
  function equipFrame(frame) {
    frame.attributes={sandbox:'',referrerpolicy:'no-referrer',title:'邮件 HTML 预览',id:'platform-template-preview-frame'};
    frame.cloneNode=()=>equipFrame({srcdoc:'',removeAttribute(name){delete this.attributes[name];},replaceWith(next){
      assert.equal(dialog.open,true,'fresh iframe must be mounted after the dialog is visible');
      nodes.set('platform-template-preview-frame',next);
    }});
    frame.replaceWith=function(next){assert.equal(dialog.open,true);nodes.set('platform-template-preview-frame',next);};
    return frame;
  }
  equipFrame(node('platform-template-preview-frame'));
  dialog.dataset = { shop: 'demo.example', shopPreviewUrl: '/app/templates/preview', platformPreviewUrl: '/app/templates/platform/preview' };
  const close = node('close'), retry = node('retry');
  const document = {
    getElementById: node,
    querySelector(selector) { return selector === '[data-platform-preview-retry]' ? retry : null; },
    querySelectorAll(selector) { return selector === '[data-platform-preview-close]' ? [close] : []; },
    addEventListener(type, handler) { documentListeners[type] = handler; },
    createElement() { return node('created'); }
  };
  const file = path.join(resources('shopify-marketing-web'), 'shopify/js/template-version-preview.js');
  vm.runInNewContext(fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '', {
    document, URLSearchParams, AbortController,
    window: { setTimeout: () => 1, clearTimeout() {} },
    fetch(url, options) {
      const request = { url, options }; requests.push(request);
      return new Promise(resolve => { request.resolve = (body, status = 200) => resolve({
        ok: status >= 200 && status < 300, status, type: 'basic',
        headers: { get: () => 'application/json' }, text: async () => JSON.stringify(body), json: async () => body
      }); });
    }
  });
  function click(version, templateId = 'template') {
    assert.equal(typeof documentListeners.click, 'function', '预览按钮必须绑定版本感知的读取处理');
    const button = {
      dataset: { shopTemplateId: templateId, shopTemplateVersion: version },
      hasAttribute: attribute => attribute === 'data-shop-template-preview'
    };
    documentListeners.click({ target: { closest: selector => selector.includes('data-shop-template-preview') ? button : null }, preventDefault() {} });
  }
  return { requests, click, node, close, retry, dialog };
}
async function flush() { for (let i = 0; i < 12; i++) await Promise.resolve(); }

test('each preview mounts a fresh sandboxed iframe after opening the dialog', async () => {
  const f=setup(),old=f.node('platform-template-preview-frame');f.click('WORKING');
  const draft=f.node('platform-template-preview-frame');assert.notEqual(draft,old);
  assert.equal(draft.attributes.sandbox,'');assert.equal(draft.attributes.referrerpolicy,'no-referrer');
  f.requests[0].resolve({html:'<h1>Draft</h1>'});await flush();assert.equal(draft.srcdoc,'<h1>Draft</h1>');
  f.close.listeners.click();f.click('PUBLISHED');
  const published=f.node('platform-template-preview-frame');assert.notEqual(published,draft);
  f.requests[1].resolve({html:'<h1>Published</h1>',hasDraft:false,status:'PUBLISHED'});await flush();
  assert.equal(published.srcdoc,'<h1>Published</h1>');
});

test('closing a preview before its response arrives never paints a later session', async () => {
  const f=setup();f.click('WORKING');f.close.listeners.click();f.click('PUBLISHED');
  f.requests[1].resolve({html:'<h1>Published</h1>',hasDraft:false,status:'PUBLISHED'});await flush();
  f.requests[0].resolve({html:'<h1>Draft</h1>'});await flush();
  assert.equal(f.node('platform-template-preview-frame').srcdoc,'<h1>Published</h1>');
});

test('published and working previews send explicit versions without writes', async () => {
  const fixture = setup(); fixture.click('PUBLISHED');
  assert.equal(new URL(fixture.requests[0].url, 'http://local').searchParams.get('version'), 'PUBLISHED');
  assert.equal(fixture.requests[0].options.cache, 'no-store');
  assert.equal(fixture.requests[0].options.credentials, 'same-origin');
  fixture.requests[0].resolve({ subject: 'Published', html: '<p>Published</p>', hasDraft: false, status: 'PUBLISHED' }); await flush();
  assert.equal(fixture.node('platform-template-preview-subject').textContent, 'Published');
  fixture.click('WORKING');
  assert.equal(new URL(fixture.requests[1].url, 'http://local').searchParams.get('version'), 'WORKING');
  assert.ok(fixture.requests.every(request => !request.options.method || request.options.method === 'GET'));
});

test('a late draft response cannot overwrite a newer published preview', async () => {
  const fixture = setup(); fixture.click('WORKING'); fixture.click('PUBLISHED');
  assert.equal(fixture.requests[0].options.signal.aborted, true);
  fixture.requests[1].resolve({ subject: 'Published', html: '<p>Published</p>', hasDraft: false, status: 'PUBLISHED' }); await flush();
  fixture.requests[0].resolve({ subject: 'Draft', html: '<p>Draft</p>' }); await flush();
  assert.equal(fixture.node('platform-template-preview-subject').textContent, 'Published');
  assert.equal(fixture.node('platform-template-preview-frame').srcdoc, '<p>Published</p>');
});

test('a missing published version is shown as an error rather than falling back to draft', async () => {
  const fixture = setup(); fixture.click('PUBLISHED');
  fixture.requests[0].resolve({ message: '尚无已发布版本' }, 404); await flush();
  assert.equal(fixture.node('platform-template-preview-error').hidden, false);
  assert.match(fixture.node('platform-template-preview-error-text').textContent, /尚无已发布版本/);
  assert.equal(fixture.requests.length, 1);
});

test('an older backend that ignores the version parameter cannot label a draft as published', async () => {
  const fixture = setup(); fixture.click('PUBLISHED');
  fixture.requests[0].resolve({ subject: 'Draft', html: '<p>Draft</p>', hasDraft: true, status: 'PUBLISHED' }); await flush();
  assert.equal(fixture.node('platform-template-preview-error').hidden, false);
  assert.doesNotMatch(fixture.node('platform-template-preview-frame').srcdoc, /<p>Draft<\/p>/);
  assert.equal(fixture.requests.length, 1);
});
