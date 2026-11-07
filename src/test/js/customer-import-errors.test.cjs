const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../../main/resources/META-INF/resources');
function fixture(fetchImpl) {
  const listeners = {};
  const body = { textContent: '', replaceChildren(...nodes) { this.nodes = nodes; } };
  const meta = { textContent: '' };
  const close = { addEventListener(type, fn) { listeners.close = fn; } };
  const dialog = { open: false, querySelector(s) { return s === '[data-error-content]' ? body : s === '[data-error-meta]' ? meta : close; }, showModal() { this.open = true; }, close() { this.open = false; }, addEventListener(type, fn) { listeners[type] = fn; } };
  const doc = { querySelector(s) { return s === '[data-import-error-dialog]' ? dialog : null; }, addEventListener(type, fn) { listeners[type] = fn; } };
  const extracted = { marker: 'rendered errors', querySelector: () => ({ textContent: '作业 job-1，最多显示前 100 条。' }) };
  class DOMParser { parseFromString() { return { querySelector: () => extracted }; } }
  const context = { document: doc, window: { location: { href: 'http://localhost/customers/imports?shop=x&page=2' } }, fetch: fetchImpl, DOMParser, URL, console };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'shopify/js/customer-import-errors.js'), 'utf8'), context);
  return { listeners, dialog, body, extracted, meta };
}

test('click loads selected errors in a modal without navigating', async () => {
  let requested;
  const f = fixture(async url => { requested = url; return { ok: true, text: async () => '<html></html>' }; });
  let prevented = false;
  const anchor = { href: 'http://localhost/customers/imports?shop=x&jobId=job-1&page=2' };
  await f.listeners.click({ target: { closest: () => anchor }, preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(f.dialog.open, true);
  assert.equal(requested, anchor.href);
  assert.equal(f.body.nodes[0], f.extracted);
  assert.equal(f.meta.textContent, '作业 job-1，最多显示前 100 条。');
  f.listeners.close();
  assert.equal(f.dialog.open, false);
});

test('shows a useful message when error data cannot be loaded', async () => {
  const f = fixture(async () => { throw new Error('offline'); });
  await f.listeners.click({ target: { closest: () => ({ href: 'http://localhost/error' }) }, preventDefault() {} });
  assert.equal(f.dialog.open, true);
  assert.match(f.body.textContent, /加载失败/);
});

test('both themes expose modal and escaped error rows', () => {
  for (const theme of ['shopify', 'shopify-theme2']) {
    const page = fs.readFileSync(path.join(root, 'WEB-INF', theme, 'customer-imports.jsp'), 'utf8');
    for (const marker of ['data-import-errors-link', 'data-import-error-dialog', 'data-import-errors-result', 'data-error-content', 'data-error-meta', 'data-import-error-meta', 'customer-import-errors.js', '<c:out value="${error.errorMessage}"/>']) assert.ok(page.includes(marker), `${theme} missing ${marker}`);
  }
});