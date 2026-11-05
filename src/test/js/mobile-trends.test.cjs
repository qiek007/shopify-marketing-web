const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = path.join(__dirname, '../../main/resources/META-INF/resources/shopify/mobile/trends.js');
function api() { assert.ok(fs.existsSync(source), 'mobile trend module must exist'); return require(source); }
function days() {
    return Array.from({length: 30}, (_, i) => ({ date: `2026-10-${String(i + 1).padStart(2, '0')}`, emailSentCount: i, emailDeliveredCount: i, shopifyOrderCount: 1 }));
}
test('range summaries use the latest days and preserve zero values', () => {
    const a = api();
    const data = {ready: true, shopifyOrdersAvailable: true, days: days()};
    assert.equal(a.summarize(data, 7).sent, 182);
    assert.equal(a.summarize(data, 30).sent, 435);
    assert.equal(a.summarize(data, 7).orders, 7);
    data.days = days().map(d => ({...d, emailSentCount: 0}));
    assert.equal(a.summarize(data, 7).sent, 0);
});
test('missing counts and unavailable orders do not become zero', () => {
    const a = api();
    const data = {ready: true, shopifyOrdersAvailable: false, days: days()};
    data.days[29].emailDeliveredCount = null;
    data.days[28].emailSentCount = null;
    const summary = a.summarize(data, 7);
    assert.equal(summary.sent, null);
    assert.equal(summary.delivered, null);
    assert.equal(summary.orders, null);
});
test('empty, incomplete and not-ready data are distinct from a valid summary', () => {
    const a = api();
    assert.equal(a.classify({ready: false, days: []}), 'preparing');
    assert.equal(a.classify({ready: true, days: []}), 'empty');
    assert.equal(a.classify({ready: true, days: days().slice(0, 5)}), 'incomplete');
    assert.equal(a.classify({ready: true, days: days()}), 'ready');
    assert.equal(a.classify({days: []}), 'incomplete');
});
test('HTTP session and permission failures have different messages', () => {
    const a = api();
    assert.match(a.responseError(401, false, ''), /登录/);
    assert.match(a.responseError(200, true, 'text/html'), /登录/);
    assert.match(a.responseError(403, false, ''), /权限/);
    assert.match(a.responseError(500, false, ''), /暂不可用/);
    assert.equal(a.responseError(200, false, 'application/json'), null);
});
test('unexpected transport errors use a user-friendly message', () => {
    const a = api();
    assert.match(a.errorMessage(new SyntaxError('Unexpected token in JSON')), /暂不可用/);
    assert.doesNotMatch(a.errorMessage(new SyntaxError('Unexpected token in JSON')), /Unexpected/);
    const known = new Error('登录状态可能已过期，请返回应用重新进入。');
    known.isTrendError = true;
    assert.match(a.errorMessage(known), /登录/);
});
