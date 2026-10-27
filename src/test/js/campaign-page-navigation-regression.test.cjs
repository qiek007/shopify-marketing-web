const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const workspace = path.resolve(__dirname, '../../main/resources/META-INF/resources');
const roots = ['public'].flatMap(module =>
  ['shopify', 'shopify-theme2'].map(theme => ({module, theme,
    label: `${module}/${theme}`,
    dir: path.join(workspace, 'WEB-INF', theme)})));
function mainHtml(source) {
  const match = source.match(/<main\b[^>]*class="console-main"[^>]*>([\s\S]*?)<\/main>/);
  assert.ok(match, 'replaceable main exists');
  return match[1];
}
function styles(source) { return [...source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n'); }
function background(css, status) {
  return css.match(new RegExp(`\\[data-campaign-status="${status}"\\]\\s*\\{[^}]*background:\\s*(#[a-f0-9]+)`, 'i'))?.[1];
}
function navigationHarness(script, campaign) {
  const docs = new Map(), events = new Map(), assigned = [], fetched = [];
  const location = new URL('http://local.test/workspace/dashboard?shop=demo');
  location.assign = value => assigned.push(value);
  const state = {main: null, sidebar: null};
  function element(html, kind) { return {html, setAttribute() {}, querySelectorAll() { return []; },
    replaceWith(next) { state[kind] = next; }}; }
  function page(html) { const main = element(mainHtml(html), 'main'), sidebar = element('', 'sidebar');
    return {title: 'Console', querySelector: s => s === '.console-main' ? main : s === '.console-sidebar' ? sidebar : null}; }
  state.main = element('<p>Dashboard</p>', 'main'); state.sidebar = element('', 'sidebar');
  const document = {currentScript: {getAttribute: () => '/workspace'}, title: 'Dashboard',
    documentElement: {classList: {toggle() {}}},
    querySelector: s => s === '.console-main' ? state.main : s === '.console-sidebar' ? state.sidebar : null,
    querySelectorAll: () => [],
    addEventListener(name, fn) { docs.set(name, [...(docs.get(name) || []), fn]); }};
  const DOMParser = class { parseFromString(html) { return page(html); } };
  const window = {location, DOMParser, AbortController, setTimeout, clearTimeout, scrollTo() {},
    history: {pushState(_state, _title, url) { location.href = url; }},
    addEventListener(name, fn) { events.set(name, fn); },
    fetch: async (url, options) => {
      fetched.push({url, options});
      return {ok: true, redirected: false, url, text: async () => new URL(url).pathname.endsWith('/campaigns')
        ? campaign : '<html><body><aside class="console-sidebar"></aside><main class="console-main"><p>Other page</p></main></body></html>'};
    }};
  vm.runInNewContext(script, {window, document, URL, DOMParser, AbortController, setTimeout, clearTimeout, console});
  return {state, assigned, fetched, async click(target) {
    const link = {href: new URL(target, location).href, target: '', classList: {add() {}, remove() {}}};
    const event = {button: 0, defaultPrevented: false, target: {closest: () => link},
      preventDefault() { this.defaultPrevented = true; }};
    for (const listener of docs.get('click') || []) listener(event);
    await new Promise(resolve => setImmediate(resolve));
  }};
}
for (const root of roots) {
  const source = fs.readFileSync(path.join(root.dir, 'campaigns.jsp'), 'utf8');
  test(`${root.label}: state palette survives first sidebar navigation and re-entry`, async () => {
    const script = fs.readFileSync(path.join(workspace, 'shopify/js/console-navigation.js'), 'utf8');
    const h = navigationHarness(script, source);
    await h.click('/workspace/campaigns?shop=demo');
    assert.equal(h.assigned.length, 0, 'no full-page fallback required');
    assert.equal(background(styles(h.state.main.html), 'PENDING_APPROVAL'), '#fef9c3', 'pending style arrives with partial page');
    assert.equal(background(styles(h.state.main.html), 'APPROVED'), '#f3e8ff');
    assert.equal(background(styles(h.state.main.html), 'COMPLETED'), '#dcfce7');
    assert.equal(background(styles(h.state.main.html), 'FAILED'), '#fee2e2');
    assert.equal(background(styles(h.state.main.html), 'ARCHIVED'), '#ede9fe');
    await h.click('/workspace/customers?shop=demo');
    assert.equal(background(styles(h.state.main.html), 'PENDING_APPROVAL'), undefined, 'page-local styles leave with the page');
    await h.click('/workspace/campaigns?shop=demo');
    assert.equal(background(styles(h.state.main.html), 'PENDING_APPROVAL'), '#fef9c3');
    assert.ok(h.fetched.every(request => request.options.cache === 'no-store'));
  });
  test(`${root.label}: every campaign state is styled for full and partial rendering`, () => {
    const css = styles(mainHtml(source));
    assert.ok(source.includes('empty campaign.displayStatus ? campaign.status : campaign.displayStatus'), 'old backend response keeps original styling');
    for (const status of ['DRAFT','PENDING_APPROVAL','APPROVED','PREPARING','SCHEDULED','RUNNING','QUEUED','PAUSED','COMPLETED','ARCHIVED','CANCELLED','FAILED'])
      assert.ok(background(css, status), `${status} available inside main`);
    assert.match(css, /campaign-time-column[^}]*white-space:\s*nowrap/);
    assert.doesNotMatch(source.slice(0, source.indexOf('</head>')), /\.campaign-status\s*\[/);
  });
}

for (const root of roots) {
  const source = fs.readFileSync(path.join(root.dir, 'campaign-editor.jsp'), 'utf8');
  test(`${root.label}: an existing draft can be deleted without saving the editor`, () => {
    assert.match(source, /<c:if test="\$\{canManageCampaigns and editorCampaign\.existing and editorCampaign\.status eq 'DRAFT'\}">\s*<button[^>]*form="campaign-draft-delete-form"/);
    assert.match(source, /<button[^>]*form="campaign-draft-delete-form"[^>]*formnovalidate[^>]*>/);
    const forms = [...source.matchAll(/<form\b[\s\S]*?<\/form>/g)];
    const remove = forms.find(m => m[0].includes('id="campaign-draft-delete-form"'));
    assert.ok(remove, 'independent delete form exists');
    assert.match(remove[0], /method="post" action="\$\{ctx\}\/campaigns\/action"/);
    assert.match(remove[0], /name="action" value="DELETE"/);
    assert.doesNotMatch(remove[0], /name="(?:name|templateId|providers|recipients)"/);
    assert.ok(source.indexOf('</form>', source.indexOf('data-campaign-editor-form')) < remove.index, 'delete form outside editor');
  });
  test(`${root.label}: delete confirmation cancels safely and accepted submit becomes busy once`, () => {
    const match = source.match(/<script\b[^>]*data-campaign-draft-delete-script[^>]*>([\s\S]*?)<\/script>/);
    assert.ok(match, 'delete handler travels with main');
    let listener, allow = false, confirmations = 0;
    const button = {disabled: false, innerHTML: 'Delete'};
    const form = {dataset: {}, setAttribute() {}, addEventListener(name, fn) { if (name === 'submit') listener = fn; }};
    vm.runInNewContext(match[1], {document: {getElementById: id => id === 'campaign-draft-delete-form' ? form : null,
      querySelector: () => button}, window: {confirm() { confirmations++; return allow; }}});
    const event = () => ({prevented: false, preventDefault() { this.prevented = true; }});
    const cancelled = event(); listener(cancelled); assert.ok(cancelled.prevented); assert.equal(button.disabled, false);
    allow = true; const accepted = event(); listener(accepted); assert.equal(accepted.prevented, false);
    assert.equal(button.disabled, true); assert.match(button.innerHTML, /fa-spinner/);
    const duplicate = event(); listener(duplicate); assert.ok(duplicate.prevented); assert.equal(confirmations, 2);
  });
}
