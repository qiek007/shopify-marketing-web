const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
let segment;
try { segment = require('../../main/resources/META-INF/resources/shopify/mobile/segments.js'); }
catch (error) { if (error.code !== 'MODULE_NOT_FOUND') throw error; }

test('rule controls explain minimum groups and conditions and enforce the twenty rule limit', () => {
  function group(count) {
    const buttons = {h2: {textContent: ''}, '.remove-group': {}, '.add-group-rule': {}};
    const rows = Array.from({length: count}, () => {
      const remove = {};
      return {remove, querySelector: () => remove};
    });
    return {buttons, rows, querySelector: name => buttons[name], querySelectorAll: () => rows};
  }
  const first = group(1), add = {};
  let items = [first];
  const host = {querySelectorAll: name => name === '.segment-rule-group' ? items : items.flatMap(g => g.rows)};
  segment.updateRuleControls(host, add);
  assert.equal(first.buttons['.remove-group'].disabled, true);
  assert.equal(first.rows[0].remove.disabled, true);
  assert.equal(add.disabled, false);
  items = [first, group(1)];
  segment.updateRuleControls(host, add);
  assert.equal(first.buttons['.remove-group'].disabled, false);
  assert.equal(items[1].buttons.h2.textContent, '条件组 2');
  items = [group(20)];
  segment.updateRuleControls(host, add);
  assert.equal(add.disabled, true);
  assert.equal(items[0].buttons['.add-group-rule'].disabled, true);
  assert.equal(items[0].rows[0].remove.disabled, false);
});

test('existing behavior rules are editable only when all structure is understood', () => {
  assert.ok(segment);
  const rule = {activity:'EMAIL_OPENED',fromDate:null,toDate:null,minTotalCount:1,maxTotalCount:null,minUniqueCount:null,maxUniqueCount:null};
  assert.equal(segment.safeBehaviorValue(JSON.stringify(rule)), true);
  assert.equal(segment.safeBehaviorValue(JSON.stringify({...rule, extra: 'must-preserve'})), false);
  assert.equal(segment.safeBehaviorValue('{broken'), false);
  assert.equal(segment.safeBehaviorValue(JSON.stringify({...rule, activity:'UNKNOWN'})), false);
});

test('only explicit rule edits trigger synchronization', () => {
  const state = segment.createRuleState('BEHAVIOR_METRIC', 'EXISTS', '{"extra":"keep"}');
  assert.deepEqual(state.submission(), {field:'BEHAVIOR_METRIC',operator:'EXISTS',value:'{"extra":"keep"}'});
  state.update('EMAIL', 'CONTAINS', 'example');
  assert.deepEqual(state.submission(), {field:'EMAIL',operator:'CONTAINS',value:'example'});
});

test('mobile views preserve group arrays and use a read-only preview fragment', () => {
  const base = path.join(__dirname, '../../main/resources/META-INF/resources/WEB-INF/mobile');
  const editor = fs.readFileSync(path.join(base, 'segment-editor.jsp'), 'utf8');
  const preview = fs.readFileSync(path.join(base, 'fragments/segment-preview-results.jsp'), 'utf8');
  for (const field of ['groupIds','groupMatchModes','ruleGroupIds','fields','operators','values']) assert.ok(editor.includes('name="'+field+'"'));
  assert.ok(editor.includes('segment-behavior-metric.js'));
  assert.ok(preview.includes('segmentPreview.matchedCount'));
  assert.ok(preview.includes('customer.eligibilityLabel'));
  assert.ok(preview.includes("customer.consentState eq 'NOT_SUBSCRIBED'"));
  assert.ok(!preview.includes('method="post"'));
});

test('new rule initializes default operator without syncing existing rules', () => {
  const base = path.join(__dirname, '../../main/resources/META-INF/resources/WEB-INF/mobile');
  const editor = fs.readFileSync(path.join(base, 'segment-editor.jsp'), 'utf8');
  const script = fs.readFileSync(path.join(__dirname, '../../main/resources/META-INF/resources/shopify/mobile/segments.js'), 'utf8');
  assert.ok(editor.includes('data-new-rule="true"'));
  assert.ok(script.includes("row.dataset.newRule === 'true'"));
  assert.ok(editor.includes('segment-behavior-options.jspf'));
  assert.ok(editor.includes('data-segment-options-grouped="true"'));
});

test('unknown behavior JSON is locked and keeps the original rule on attempted edit', () => {
  const fields = {value:'BEHAVIOR_METRIC'}, operators = {value:'EXISTS'}, values = {value:'{"activity":"EMAIL_OPENED","future":"keep"}',readOnly:false};
  const row = {dataset:{}, querySelector(selector) { return selector.includes('fields') ? fields : selector.includes('operators') ? operators : values; }};
  const state = segment.createRuleState(fields.value, operators.value, values.value);
  assert.equal(segment.lockUnknownRule(row), true);
  assert.equal(values.readOnly, true);
  fields.value = 'EMAIL'; operators.value = 'NE';
  segment.restoreLockedRule(row, state);
  assert.equal(fields.value, 'BEHAVIOR_METRIC');
  assert.equal(operators.value, 'EXISTS');
  assert.equal(values.value, '{"activity":"EMAIL_OPENED","future":"keep"}');
});

test('preview rejects unexpected login or non-fragment html', () => {
  assert.equal(segment.isPreviewHtml('<section class="ms-result"><h2>受众预览</h2></section>'), true);
  assert.equal(segment.isPreviewHtml('<html><title>登录</title></html>'), false);
});

test('opening a metric editor alone preserves exact original rule during preview or save', () => {
  const state = segment.createRuleState('BEHAVIOR_METRIC', 'EXISTS', '{"activity":"EMAIL_OPENED","minTotalCount":1}');
  const field = {value:'BEHAVIOR_EMAIL_OPENED'}, operator = {value:'EXISTS'}, value = {value:'{"activity":"EMAIL_OPENED","fromDate":null,"minTotalCount":1}'};
  const row = {dataset:{},querySelector(selector) { return selector.includes('fields') ? field : selector.includes('operators') ? operator : value; }};
  assert.deepEqual(segment.submissionForRow(row,state), state.submission());
  row.dataset.dirty = 'true';
  assert.deepEqual(segment.submissionForRow(row,state), {field:field.value,operator:operator.value,value:value.value});
});

test('existing enum options use matching Chinese labels without changing the selected value', () => {
  const original = {value:'EMAIL', textContent:'EMAIL', dataset:{originalOption:'true'}, hidden:true};
  const known = {value:'EMAIL', textContent:'邮箱', dataset:{}, hidden:false};
  const select = {value:'EMAIL', querySelectorAll: () => [original, known]};
  segment.labelOriginalOption(select);
  assert.equal(original.textContent, '邮箱');
  assert.equal(select.value, 'EMAIL');
  const originalOperator = {value:'EQ', textContent:'EQ', dataset:{originalOption:'true'}, hidden:true};
  segment.labelOriginalOption({value:'EQ', querySelectorAll: () => [originalOperator, {value:'EQ', textContent:'等于', dataset:{}, hidden:false}]});
  assert.equal(originalOperator.textContent, '等于');
  const future = {value:'FUTURE', textContent:'FUTURE', dataset:{originalOption:'true'}, hidden:true};
  segment.labelOriginalOption({value:'FUTURE', querySelectorAll: () => [future, known]});
  assert.equal(future.textContent, 'FUTURE');
});
