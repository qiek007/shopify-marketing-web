const test = require('node:test');
const assert = require('node:assert/strict');
const { slices, ringPath, safeLanding, mount } = require('../../main/resources/META-INF/resources/shopify/js/campaign-link-clicks.js');

test('eight individual links and Other account for every matched click', () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({ key: String(i), clicks: i + 1 }));
    const segments = slices(rows);
    assert.deepEqual(segments.slice(0, 8).map(row => row.clicks), [10, 9, 8, 7, 6, 5, 4, 3]);
    assert.equal(segments[8].clicks, 3);
    assert.equal(segments[8].other, true);
    assert.equal(segments.reduce((total, row) => total + row.clicks, 0), 55);
});

test('a single nonzero link renders a complete ring and landing links are HTTP(S) only', () => {
    assert.match(ringPath(0, 1), /^M/);
    assert.doesNotMatch(ringPath(0, 1), /NaN|Infinity/);
    assert.equal(safeLanding('javascript:alert(1)'), null);
    assert.equal(safeLanding('https://user@shop.example/a'), null);
    assert.equal(safeLanding('https://shop.example/a?variant=2'), 'https://shop.example/a?variant=2');
});

test('the chart defaults to the top ranked link and keeps a manually selected link after refresh', async () => {
    class Node {
        constructor(tag, text = '') {
            this.tag = tag; this.textContent = text; this.children = []; this.handlers = {}; this.attrs = {};
            this.style = {}; this.hidden = true;
        }
        setAttribute(name, value) { this.attrs[name] = value; }
        append(...nodes) { this.children.push(...nodes); }
        replaceChildren(...nodes) { this.children = nodes; }
        addEventListener(name, handler) { this.handlers[name] = handler; }
    }
    const panel = new Node('section'), parts = new Map(), requests = [], copied = [];
    panel.dataset = { campaignLinkClicks: '/web/campaigns/link-clicks?shop=s.example&campaignId=c1' };
    panel.querySelector = selector => {
        if (!parts.has(selector)) parts.set(selector, new Node('div'));
        return parts.get(selector);
    };
    const landing = 'https://shop.example/item?variant=2';
    const destination = landing + '&utm_content=link-3';
    const firstKey = 'a'.repeat(64);
    const secondKey = 'b'.repeat(64);
    const previewSrc = '/web/campaigns/preview?shop=s.example&campaignId=c1';
    const navigations = [];
    const frame = { dataset: { previewSrc }, set src(value) { navigations.push(value); } };
    const dialog = panel.querySelector('[data-clc-link-dialog]');
    dialog.id = 'campaign-link-click-dialog';
    dialog.open = false;
    dialog.showModal = function () { this.open = true; };
    dialog.close = function () { this.open = false; };
    let links = [
        { key: secondKey, label: '了解更多', position: 4, clicks: 2, people: 2 },
        { key: 'unmatched', label: '未匹配链接', clicks: 10, people: 10 },
        { key: firstKey, label: '购买', position: 3, clicks: 4, people: 2, destination, landing }
    ];
    const win = {
        document: { createElement: tag => new Node(tag), createElementNS: (_, tag) => new Node(tag),
            getElementById: id => id === 'campaign-preview-frame' ? frame : null },
        navigator: { clipboard: { async writeText(value) { copied.push(value); } } },
        clearTimeout() {}, addEventListener() {},
        setTimeout() { assert.fail('a frozen campaign must not start polling'); },
        async fetch(url) {
            requests.push(url);
            return { ok: true, json: async () => ({ status: 'FROZEN', frozenAt: '2026-11-27T03:05:48Z',
                totalClicks: links.reduce((sum, row) => sum + row.clicks, 0), links }) };
        }
    };
    mount(win, panel);
    assert.deepEqual(requests, [panel.dataset.campaignLinkClicks]);
    await new Promise(setImmediate);
    assert.deepEqual(requests, [panel.dataset.campaignLinkClicks]);
    assert.match(parts.get('[data-clc-status]').textContent, /固化时间/);
    const label = parts.get('[data-clc-legend]').children[0].children[1];
    assert.equal(label.className, 'clc-link-label');
    assert.equal(label.title, label.textContent);
    const slices = parts.get('[data-clc-chart]').children[0].children.filter(node => node.tag === 'path');
    const slice = slices[0];
    assert.equal(slice.children[0].tag, 'title');
    assert.equal(slice.children[0].textContent, '第 3 处 · 购买 · 4 次点击 · 25%');
    assert.equal(slice.attrs['aria-label'], slice.children[0].textContent);
    const details = parts.get('[data-clc-details]');
    assert.equal(details.hidden, false);
    assert.equal(details.children[0].textContent, '第 3 处 · 购买');
    assert.deepEqual(navigations, [previewSrc + '#campaign-preview-link-' + firstKey]);
    assert.equal(details.children.length, 2, 'the raw address is not displayed');
    const summary = details.children[1];
    assert.equal(summary.className, 'clc-detail-summary');
    const [metrics, actions] = summary.children;
    assert.match(metrics.textContent, /25%$/);
    assert.equal(actions.className, 'clc-actions');
    const [open, copy] = actions.children;
    assert.equal(open.className, 'clc-action');
    assert.equal(copy.className, 'clc-action');
    assert.equal(open.href, landing);
    assert.equal(open.target, '_blank');
    assert.equal(open.rel, 'noopener noreferrer');
    copy.handlers.click();
    await new Promise(setImmediate);
    assert.deepEqual(copied, [destination]);
    slices[1].handlers.click();
    assert.equal(details.children[0].textContent, '第 4 处 · 了解更多');
    assert.equal(navigations.at(-1), previewSrc + '#campaign-preview-link-' + secondKey);
    parts.get('[data-clc-refresh]').handlers.click();
    await new Promise(setImmediate);
    assert.equal(details.children[0].textContent, '第 4 处 · 了解更多');
    assert.equal(navigations.length, 2, 'refresh keeps the preview at its current scroll position');
    assert.equal(parts.has('[data-clc-list-toggle]'), false);
    links = Array.from({ length: 10 }, (_, i) => ({ key: String(i), label: '链接 ' + i, clicks: i, people: i }));
    parts.get('[data-clc-refresh]').handlers.click();
    await new Promise(setImmediate);
    const currentLegend = parts.get('[data-clc-legend]');
    const other = currentLegend.children.at(-1);
    assert.equal(other.attrs['aria-haspopup'], 'dialog');
    other.handlers.click();
    assert.equal(dialog.open, true);
    const allLinks = parts.get('[data-clc-all-links]');
    assert.equal(allLinks.children.length, 10);
    assert.equal(allLinks.children.at(-1).children[1].textContent, '0');
    allLinks.children[0].handlers.click();
    assert.equal(dialog.open, false);
    assert.equal(details.children[0].textContent, '链接 9');
    const otherSlice = parts.get('[data-clc-chart]').children[0].children
        .filter(node => node.tag === 'path').at(-1);
    assert.equal(otherSlice.attrs['aria-haspopup'], 'dialog');
    otherSlice.handlers.click();
    assert.equal(dialog.open, true);
    dialog.close();

    links = [{ key: 'zero', label: '还没有点击', clicks: 0, people: 0 }];
    parts.get('[data-clc-refresh]').handlers.click();
    await new Promise(setImmediate);
    assert.equal(parts.get('[data-clc-chart]').hidden, true);
    assert.equal(currentLegend.hidden, false);
    currentLegend.children[0].handlers.click();
    assert.equal(allLinks.children.length, 1);
    assert.equal(details.hidden, true);
});
