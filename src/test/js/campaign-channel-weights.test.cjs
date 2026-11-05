const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createHarness(project, initialWeights, selectedProviders) {
    const listeners = new WeakMap();
    function element(initial = {}) {
        return Object.assign({
            value: '', disabled: false, hidden: false, textContent: '',
            addEventListener(name, callback) {
                let events = listeners.get(this);
                if (!events) { events = {}; listeners.set(this, events); }
                events[name] = callback;
            }
        }, initial);
    }
    const providers = ['INFOBIP', 'MAILGUN', 'SENDGRID'];
    const checks = providers.map(value => element({ value, checked: selectedProviders.includes(value) }));
    const rows = providers.map(provider => {
        const range = element();
        const number = element();
        const output = element();
        const row = element({
            dataset: { provider, defaultWeight: String(initialWeights[provider] ?? '') },
            querySelector(selector) {
                return {
                    '[data-channel-weight-range]': range,
                    '[data-channel-weight-number]': number,
                    '[data-channel-weight-percent]': output
                }[selector];
            }
        });
        return { row, range, number, output };
    });
    const hidden = element({ disabled: true });
    const hint = element();
    const form = element({ querySelector: selector => selector === '[data-channel-weights-json]' ? hidden : null });
    const fieldset = element({ querySelectorAll: () => checks });
    const editor = element({
        closest: selector => selector === 'form' ? form : fieldset,
        querySelectorAll: () => rows.map(item => item.row),
        querySelector: () => hint
    });
    const document = { querySelectorAll: () => [editor] };
    const script = fs.readFileSync(path.resolve(__dirname, '../../..',
        'src/main/resources/META-INF/resources/shopify/js/campaign-channel-weights.js'), 'utf8');
    vm.runInNewContext(script, { document, Array, Number, JSON, Object, String, Math });
    function emit(target, name) { listeners.get(target)[name](); }
    return { rows, checks, hidden, hint, form, emit };
}

for (const project of ['public']) {
    for (const theme of ['shopify', 'shopify-theme2']) {
        test(`${project}/${theme}: each channel card keeps weight controls outside the checkbox label`, () => {
            const jsp = fs.readFileSync(path.resolve(__dirname, '../../..',
                'src/main/resources/META-INF/resources/WEB-INF', theme, 'campaign-editor.jsp'), 'utf8');
            const section = jsp.slice(jsp.indexOf('<fieldset class="channel-selector">'),
                jsp.indexOf('</fieldset>', jsp.indexOf('<fieldset class="channel-selector">')));
            assert.match(section, /class="channel-option-card"/);
            assert.match(section, /<label class="channel-option">[\s\S]*?<\/label>\s*<div class="channel-weight-row"/);
            assert.equal((section.match(/items="\$\{senderSettings\}"/g) || []).length, 1);
        });
    }
    test(project + ' defaults selected channels to equal weights and adjusts their ratio', () => {
        const h = createHarness(project, {}, ['INFOBIP', 'MAILGUN']);
        assert.equal(h.hidden.disabled, false);
        assert.deepEqual(JSON.parse(h.hidden.value), { INFOBIP: 1, MAILGUN: 1 });
        assert.equal(h.rows[0].output.textContent, '50%');
        assert.equal(h.rows[1].output.textContent, '50%');
        assert.equal(h.rows[2].row.hidden, true);
        h.rows[1].range.value = '3';
        h.emit(h.rows[1].range, 'input');
        assert.deepEqual(JSON.parse(h.hidden.value), { INFOBIP: 1, MAILGUN: 3 });
        assert.equal(h.rows[0].output.textContent, '25%');
        assert.equal(h.rows[1].output.textContent, '75%');
    });

    test(project + ' restores saved weights, excludes unchecked channels and rejects invalid input', () => {
        const h = createHarness(project, { INFOBIP: 7, MAILGUN: 21 }, ['INFOBIP', 'MAILGUN']);
        assert.equal(h.rows[1].number.value, '21');
        assert.equal(h.rows[1].range.max, '10');
        assert.equal(h.rows[1].number.max, '100');
        assert.equal(h.rows[1].range.disabled, true);
        assert.deepEqual(JSON.parse(h.hidden.value), { INFOBIP: 7, MAILGUN: 21 });
        assert.match(h.hint.textContent, /历史.*1.*10/);
        h.checks[0].checked = false;
        h.emit(h.checks[0], 'change');
        assert.deepEqual(JSON.parse(h.hidden.value), { MAILGUN: 21 });
        assert.equal(h.rows[0].number.disabled, true);
        assert.equal(h.rows[1].output.textContent, '100%');
        h.rows[1].number.value = '11';
        h.emit(h.rows[1].number, 'input');
        assert.equal(h.rows[1].number.max, '10');
        assert.equal(h.hidden.value, 'invalid');
        h.rows[1].number.value = '3';
        h.emit(h.rows[1].number, 'input');
        assert.deepEqual(JSON.parse(h.hidden.value), { MAILGUN: 3 });
        assert.equal(h.rows[1].range.disabled, false);
        h.checks[0].checked = true;
        h.emit(h.checks[0], 'change');
        assert.deepEqual(JSON.parse(h.hidden.value), { INFOBIP: 7, MAILGUN: 3 });
    });

    test(project + ' retains a historical weight on unrelated save and channel reselection', () => {
        const h = createHarness(project, { INFOBIP: 21, MAILGUN: 3 }, ['INFOBIP', 'MAILGUN']);
        h.emit(h.form, 'submit');
        assert.equal(h.rows[0].number.max, '100');
        assert.deepEqual(JSON.parse(h.hidden.value), { INFOBIP: 21, MAILGUN: 3 });
        h.checks[0].checked = false;
        h.emit(h.checks[0], 'change');
        assert.deepEqual(JSON.parse(h.hidden.value), { MAILGUN: 3 });
        h.checks[0].checked = true;
        h.emit(h.checks[0], 'change');
        assert.equal(h.rows[0].number.value, '21');
        assert.equal(h.rows[0].range.disabled, true);
        assert.deepEqual(JSON.parse(h.hidden.value), { INFOBIP: 21, MAILGUN: 3 });
        h.rows[0].number.value = '';
        h.emit(h.rows[0].number, 'input');
        assert.equal(h.rows[0].number.max, '10');
        assert.equal(h.hidden.value, 'invalid');
        h.rows[0].number.value = '11';
        h.emit(h.rows[0].number, 'input');
        assert.equal(h.hidden.value, 'invalid');
        h.rows[0].number.value = '1';
        h.emit(h.rows[0].number, 'input');
        assert.equal(h.rows[0].range.disabled, false);
        assert.deepEqual(JSON.parse(h.hidden.value), { INFOBIP: 1, MAILGUN: 3 });
    });

    test(project + ' sets every channel input range to 1–10 and rejects zero and non-integers', () => {
        const h = createHarness(project, {}, ['INFOBIP', 'MAILGUN', 'SENDGRID']);
        for (const row of h.rows) {
            assert.equal(row.range.min, '1');
            assert.equal(row.range.max, '10');
            assert.equal(row.number.min, '1');
            assert.equal(row.number.max, '10');
        }
        h.rows[0].number.value = '0';
        h.emit(h.rows[0].number, 'input');
        assert.equal(h.hidden.value, 'invalid');
        h.rows[0].number.value = '1.5';
        h.emit(h.rows[0].number, 'input');
        assert.equal(h.hidden.value, 'invalid');
        h.rows[0].number.value = '10';
        h.emit(h.rows[0].number, 'input');
        assert.deepEqual(JSON.parse(h.hidden.value), { INFOBIP: 10, MAILGUN: 1, SENDGRID: 1 });
    });
}
