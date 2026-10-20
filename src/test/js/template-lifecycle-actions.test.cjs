const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setup() {
    function element() {
        const listeners = {};
        const attributes = {};
        const classes = new Set();
        return {
            listeners, attributes, disabled: false, hidden: true,
            textContent: '', className: '',
            addEventListener(type, handler) { listeners[type] = handler; },
            setAttribute(name, value) { attributes[name] = value; },
            removeAttribute(name) { delete attributes[name]; },
            classList: {
                add(value) { classes.add(value); },
                remove(value) { classes.delete(value); },
                toggle(value, enabled) {
                    if (enabled) classes.add(value);
                    else classes.delete(value);
                }
            },
            fire(type) {
                const event = {
                    defaultPrevented: false,
                    preventDefault() { this.defaultPrevented = true; }
                };
                listeners[type](event);
                return event;
            }
        };
    }
    const title = element(), message = element(), progress = element();
    const progressLabel = element(), cancel = element(), confirm = element();
    const icon = element(), label = element(), dialog = element();
    progress.querySelector = () => progressLabel;
    confirm.querySelector = selector => selector === 'i' ? icon : label;
    const nodes = {
        '[data-template-action-title]': title,
        '[data-template-action-message]': message,
        '[data-template-action-progress]': progress,
        '[data-template-action-cancel]': cancel,
        '[data-template-action-confirm]': confirm
    };
    dialog.querySelector = selector => nodes[selector];
    dialog.showModal = () => { dialog.open = true; };
    dialog.close = () => { dialog.open = false; };
    const forms = ['disable', 'delete'].map(action => {
        const form = element();
        form.dataset = {
            actionTitle: action === 'disable' ? '确认禁用模板' : '确认删除模板',
            actionMessage: '确认操作说明',
            actionProgress: action === 'disable' ? '正在禁用模板' : '正在删除模板'
        };
        form.querySelector = () => ({ value: action });
        form.submissions = 0;
        form.submit = () => { form.submissions++; };
        return form;
    });
    const timers = [];
    const source = fs.readFileSync(path.resolve(__dirname,
        '../../main/resources/META-INF/resources/shopify/js/template-lifecycle-actions.js'), 'utf8');
    vm.runInNewContext(source, {
        document: {
            getElementById: () => dialog,
            querySelectorAll: () => forms
        },
        window: { setTimeout: callback => timers.push(callback) }
    });
    return { forms, dialog, title, progress, confirm, cancel, icon, timers };
}

test('canceling confirmation never submits a template action', () => {
    const ui = setup();
    assert.equal(ui.forms[0].fire('submit').defaultPrevented, true);
    assert.equal(ui.dialog.open, true);
    ui.cancel.fire('click');
    assert.equal(ui.dialog.open, false);
    ui.confirm.fire('click');
    assert.equal(ui.timers.length, 0);
    assert.equal(ui.forms[0].submissions, 0);
});

for (const [index, action] of ['disable', 'delete'].entries()) {
    test(`${action} shows pending animation before exactly one submission`, () => {
        const ui = setup();
        const form = ui.forms[index];
        assert.equal(form.fire('submit').defaultPrevented, true);
        assert.equal(ui.title.textContent, form.dataset.actionTitle);
        ui.confirm.fire('click');
        assert.equal(ui.progress.hidden, false);
        assert.equal(ui.confirm.disabled, true);
        assert.equal(ui.confirm.attributes['aria-busy'], 'true');
        assert.equal(ui.icon.className, 'fa fa-spinner fa-spin');
        assert.equal(form.submissions, 0);
        assert.equal(ui.dialog.fire('cancel').defaultPrevented, true);
        assert.equal(form.fire('submit').defaultPrevented, true);
        assert.equal(ui.forms[1 - index].fire('submit').defaultPrevented, true);
        ui.confirm.fire('click');
        assert.equal(ui.timers.length, 1);
        ui.timers.shift()();
        assert.equal(form.submissions, 1);
        assert.equal(ui.forms[1 - index].submissions, 0);
    });
}
