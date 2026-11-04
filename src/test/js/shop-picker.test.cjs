const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function pickerHarness(module) {
    const events = {};
    const navigations = [];
    const values = [['乙店', 'b.example'], ['甲店', 'a.example']];
    let form;
    class Element {
        constructor() { this.attributes = {}; this.children = []; this.hidden = false; this.textContent = ''; }
        setAttribute(key, value) { this.attributes[key] = value; }
        getAttribute(key) { return this.attributes[key] ?? null; }
        append(...children) { this.children.push(...children); }
        appendChild(child) { this.children.push(child); }
        replaceChildren() { this.children = []; }
        focus() { this.focused = true; }
        closest(selector) {
            if (selector === '[data-shop-switcher]') return form;
            if (selector === '[data-shop-picker-option]' && this.attributes['data-shop-picker-option']) return this;
            if (selector === '[data-shop-picker-trigger]' && this === trigger) return this;
            if (selector === '[data-shop-switcher-search]' && this === input) return this;
            return null;
        }
    }
    const options = values.map(([name, value]) => ({
        value, textContent: name, hidden: false, disabled: false,
        getAttribute(key) { return key === 'data-shop-name' ? name : null; }
    }));
    const select = { options, value: 'b.example', closest: () => form, appendChild(option) {
        options.splice(options.indexOf(option), 1); options.push(option);
    }};
    options.forEach(option => Object.defineProperty(option, 'selected', { get: () => option.value === select.value }));
    const picker = new Element(); picker.classList = { add() {} };
    const trigger = new Element(); trigger.hidden = true;
    const panel = new Element(); panel.hidden = true;
    const label = new Element();
    const input = new Element(); input.value = '';
    const list = new Element();
    const empty = new Element(); empty.hidden = true;
    const elements = {
        '[data-shop-picker]': picker, '[data-shop-switcher-select]': select,
        '[data-shop-picker-trigger]': trigger, '[data-shop-picker-panel]': panel,
        '[data-shop-picker-label]': label, '[data-shop-switcher-search]': input,
        '[data-shop-picker-options]': list, '[data-shop-search-empty]': empty
    };
    form = { querySelector: selector => selector === '[data-shop-picker-option]' ? list.children[0] : elements[selector],
        getAttribute: () => 'shop-test', contains: element => Object.values(elements).includes(element) };
    const document = { currentScript: { getAttribute: () => '/app' }, getElementById: () => null,
        querySelector: selector => selector === '[data-shop-switcher]' ? form : elements[selector],
        querySelectorAll: () => [], createElement: () => new Element(),
        addEventListener: (event, handler) => { events[event] = handler; } };
    const window = { fetch() {}, DOMParser: function () {}, AbortController,
        location: { href: 'http://localhost/app/campaigns/detail?shop=b.example', origin: 'http://localhost',
            pathname: '/app/campaigns/detail', assign: url => navigations.push(url) },
        localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, addEventListener() {} };
    const source = fs.readFileSync(path.resolve(__dirname, '../../..',
        'src/main/resources/META-INF/resources/shopify/js/console-navigation.js'), 'utf8');
    vm.runInNewContext(source, { window, document, URL, Intl, AbortController, Array, Promise });
    return { events, select, trigger, panel, label, input, list, empty, navigations };
}

for (const module of ['public']) {
    test(`${module}: searchable picker keeps selection, filters by domain and navigates`, () => {
        const h = pickerHarness(module);
        assert.equal(h.label.textContent, '乙店');
        assert.equal(h.select.value, 'b.example');
        assert.equal(h.trigger.hidden, false);
        h.events.click({ target: h.trigger });
        assert.equal(h.panel.hidden, false);
        assert.equal(h.input.focused, true);
        h.input.value = 'a.example';
        h.events.input({ target: h.input });
        assert.equal(h.list.children.length, 1);
        assert.equal(h.list.children[0].children[0].textContent, '甲店');
        assert.equal(h.select.value, 'b.example');
        h.events.click({ target: h.list.children[0] });
        assert.match(h.navigations[0], /\/campaigns\?shop=a.example$/);
    });

    test(`${module}: unmatched search and Escape restore the options`, () => {
        const h = pickerHarness(module);
        h.events.click({ target: h.trigger });
        h.input.value = 'missing';
        h.events.input({ target: h.input });
        assert.equal(h.list.children.length, 0);
        assert.equal(h.empty.hidden, false);
        h.events.keydown({ target: h.input, key: 'Escape' });
        assert.equal(h.panel.hidden, true);
        assert.equal(h.input.value, '');
        assert.equal(h.list.children.length, 2);
        assert.equal(h.empty.hidden, true);
    });
}
