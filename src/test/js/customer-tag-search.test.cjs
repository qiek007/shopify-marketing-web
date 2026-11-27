const test = require('node:test');
const assert = require('node:assert/strict');
const { bind } = require('../../main/resources/META-INF/resources/shopify/js/customer-tag-search.js');

function fixture() {
    const listeners = {}, formListeners = {}, requests = [], labels = [];
    const input = { value: '', addEventListener(name, handler) { listeners[name] = handler; },
        focus() { this.focused = true; } };
    const clear = { disabled: true, addEventListener(name, handler) { this[name] = handler; } };
    const status = { hidden: true, textContent: '' };
    const initial = { hidden: false };
    const shop = { value: 'shop.example' };
    function add(name, checked = false, untagged = false) {
        const checkbox = { value: name, checked, dataset: { untagged: String(untagged) } };
        const label = { textContent: name, hidden: false, querySelector: () => checkbox };
        labels.push(label);
        return { label, checkbox };
    }
    const options = {
        querySelector(selector) {
            return {
                '[data-customer-tag-search]': input,
                '[data-customer-tag-search-clear]': clear,
                '[data-customer-tag-search-status]': status,
                '[data-no-customer-tags]': initial
            }[selector];
        },
        querySelectorAll: () => labels
    };
    const form = {
        dataset: { customerTagsUrl: '/web/customers/tags/options' },
        querySelector: selector => selector === '.customer-tag-options' ? options : shop,
        addEventListener(name, handler) { formListeners[name] = handler; }
    };
    let timer;
    const win = {
        setTimeout(callback) { timer = callback; return 1; },
        clearTimeout() { timer = null; },
        fetch(url) { return new Promise(resolve => requests.push({ url, resolve })); }
    };
    bind(win, form, name => add(name));
    function type(value) {
        input.value = value;
        let stopped = false;
        listeners.input({ stopPropagation() { stopped = true; } });
        assert.equal(stopped, true);
        if (timer) timer();
    }
    async function resolve(index, tags) {
        requests[index].resolve({ ok: true, json: async () => tags });
        await new Promise(setImmediate);
    }
    return { add, type, resolve, labels, requests, status, initial, formListeners, listeners, input, clear };
}

test('search looks up shop tags beyond the loaded list and preserves selected filters', async () => {
    const f = fixture();
    const selected = f.add('已有标签', true);
    const untagged = f.add('无标签', false, true);
    f.type(' 远端 ');
    const url = new URL(f.requests[0].url, 'https://localhost');
    assert.equal(url.pathname, '/web/customers/tags/options');
    assert.equal(url.searchParams.get('shop'), 'shop.example');
    assert.equal(url.searchParams.get('q'), '远端');
    assert.equal(selected.label.hidden, true);
    assert.equal(selected.checkbox.checked, true);
    assert.equal(untagged.label.hidden, false);
    assert.equal(f.initial.hidden, true);
    await f.resolve(0, ['远端标签']);
    assert.equal(f.labels.at(-1).hidden, false);
    assert.equal(f.status.hidden, true);
    f.formListeners.reset();
    assert.equal(selected.label.hidden, false);
    assert.equal(selected.checkbox.checked, true);
    assert.equal(f.requests.length, 1);
});

test('a late result cannot replace the latest search and Enter does not submit the customer form', async () => {
    const f = fixture();
    f.type('旧');
    f.type('新');
    await f.resolve(1, []);
    assert.equal(f.status.textContent, '没有匹配的标签');
    await f.resolve(0, ['旧结果']);
    assert.equal(f.labels.length, 0);
    let prevented = false;
    f.listeners.keydown({ key: 'Enter', preventDefault() { prevented = true; } });
    assert.equal(prevented, true);
});

test('clear restores the list without changing the selection or accepting a pending search', async () => {
    const f = fixture();
    const selected = f.add('已选标签', true);
    assert.equal(f.clear.disabled, true);
    f.type('远端');
    assert.equal(f.clear.disabled, false);
    f.clear.click();
    assert.equal(f.input.value, '');
    assert.equal(f.input.focused, true);
    assert.equal(f.clear.disabled, true);
    assert.equal(selected.label.hidden, false);
    assert.equal(selected.checkbox.checked, true);
    await f.resolve(0, ['远端结果']);
    assert.equal(f.labels.length, 1);
    assert.equal(f.requests.length, 1);
});
