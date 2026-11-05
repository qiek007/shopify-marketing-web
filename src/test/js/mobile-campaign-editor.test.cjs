const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
let editor;
try {
  editor = require(path.join(__dirname, '../../main/resources/META-INF/resources/shopify/mobile/campaign-editor.js'));
} catch (error) {
  if (error.code !== 'MODULE_NOT_FOUND') throw error;
}

test('requires the mobile editor implementation', () => {
  assert.ok(editor, 'mobile editor must exist');
});

test('requires explicit confirmation when no segment is selected', () => {
  assert.equal(editor.audienceAllowed('', false), false);
  assert.equal(editor.audienceAllowed('', true), true);
  assert.equal(editor.audienceAllowed('segment-1', false), true);
});

test('new activities use PC-equivalent equal weights for the selected channels', () => {
  assert.deepEqual(JSON.parse(editor.equalChannelWeights(['SENDGRID', 'MAILGUN'])), {SENDGRID: 1, MAILGUN: 1});
  assert.deepEqual(JSON.parse(editor.equalChannelWeights(['MAILGUN'])), {MAILGUN: 1});
  assert.deepEqual(JSON.parse(editor.equalChannelWeights([])), {});
});

test('channel selection updates the submitted weights', () => {
  const hidden = {value: '', disabled: true};
  const checks = [{value: 'SENDGRID', checked: true}, {value: 'MAILGUN', checked: false}];
  editor.updateChannelWeights(hidden, checks);
  assert.equal(hidden.disabled, false);
  assert.deepEqual(JSON.parse(hidden.value), {SENDGRID: 1});
  checks[1].checked = true;
  editor.updateChannelWeights(hidden, checks);
  assert.deepEqual(JSON.parse(hidden.value), {SENDGRID: 1, MAILGUN: 1});
  checks[0].checked = false;
  editor.updateChannelWeights(hidden, checks);
  assert.deepEqual(JSON.parse(hidden.value), {MAILGUN: 1});
});

test('channel weights are disabled until the mobile editor initializes', () => {
  const jsp = fs.readFileSync(path.join(__dirname, '../../main/resources/META-INF/resources/WEB-INF/mobile/campaign-editor.jsp'), 'utf8');
  assert.match(jsp, /name="channelWeightsJson"[^>]*disabled/);
  assert.match(jsp, /按选中通道等权分配批次/);
  assert.match(jsp, /id="mobile-save-campaign" disabled/);
});

test('rejects templates with product and coupon variables', () => {
  const base = {customVariables: {campaignMessage: ''}, productSourceId: '', productSlotCount: 0, referencedVariables: ['campaignMessage']};
  assert.equal(editor.templateAllowed(base), true);
  assert.equal(editor.templateAllowed({...base, productSlotCount: 12}), true, 'slot capacity alone does not mean the template uses products');
  assert.equal(editor.templateAllowed({...base, referencedVariables: ['productTitle']}), false);
  assert.equal(editor.templateAllowed({...base, referencedVariables: ['couponCode']}), false);
  assert.equal(editor.templateAllowed({...base, productSourceId: 'product-1'}), false);
  assert.equal(editor.templateAllowed({...base, referencedVariables: ['firstName', 'promoText'], customVariables: {promoText: '优惠'}}), true);
  assert.equal(editor.templateAllowed({...base, referencedVariables: ['firstName', 'promoText']}), false, 'referenced custom variable must have returned metadata');
  assert.equal(editor.templateAllowed(null), false);
});

test('latest template request wins even when responses arrive out of order', async () => {
  const pending = {};
  const states = [];
  const loader = editor.createTemplateLoader(id => new Promise((resolve, reject) => { pending[id] = {resolve, reject}; }), s => states.push(s));
  const first = loader.load('old');
  const second = loader.load('new');
  await Promise.resolve();
  pending.new.resolve({templateId: 'new', customVariables: {campaignMessage: 'new'}, productSourceId: '', productSlotCount: 0, referencedVariables: []});
  await second;
  pending.old.resolve({templateId: 'old', customVariables: {campaignMessage: 'old'}, productSourceId: '', productSlotCount: 0, referencedVariables: []});
  await first;
  assert.equal(states.at(-1).options.customVariables.campaignMessage, 'new');
  assert.equal(states.at(-1).status, 'ready');
});

test('does not allow submitting options for a different template', async () => {
  const states = [];
  const loader = editor.createTemplateLoader(() => Promise.resolve({templateId: 'other', customVariables: {}, productSourceId: '', productSlotCount: 12, referencedVariables: []}), s => states.push(s));
  await loader.load('selected');
  assert.notEqual(states.at(-1).status, 'ready');
});

test('template request failure keeps the form unavailable', async () => {
  const states = [];
  const loader = editor.createTemplateLoader(() => Promise.reject(new Error('offline')), s => states.push(s));
  await loader.load('template');
  assert.equal(states.at(-1).status, 'error');
});

test('existing campaign test send carries its request token and restricts permitted states', () => {
  const jsp = fs.readFileSync(path.join(__dirname, '../../main/resources/META-INF/resources/WEB-INF/mobile/campaign-editor.jsp'), 'utf8');
  assert.match(jsp, /editorCampaign\.status eq 'DRAFT'.*editorCampaign\.status eq 'PENDING_APPROVAL'/);
  assert.doesNotMatch(jsp, /editorCampaign\.status eq 'APPROVED'/);
  assert.match(jsp, /action="\$\{ctx\}\/mobile\/campaigns\/test-send"/);
  assert.match(jsp, /name="requestToken" value="\$\{campaignTestRequestToken\}"/);
  assert.match(jsp, /editorCampaign\.providerSelections\[setting\.provider\]/);
});

test('mobile campaign links encode shop and activity parameters', () => {
  const jsp = fs.readFileSync(path.join(__dirname, '../../main/resources/META-INF/resources/WEB-INF/mobile/campaign-editor.jsp'), 'utf8');
  assert.match(jsp, /<c:url var="mobileCampaignListUrl" value="\/mobile\/campaigns">/);
  assert.match(jsp, /<c:param name="shop" value="\$\{selectedShop\}"\s*\/>/);
  assert.match(jsp, /<c:param name="campaignId" value="\$\{editorCampaign\.campaignId\}"\s*\/>/);
});

test('test-send blocks duplicate submissions and requires a refresh after returning to a submitted page', () => {
  const handlers = {};
  const button = {disabled: true, textContent: '发送测试邮件'};
  const message = {textContent: ''};
  const form = {querySelector: () => button, addEventListener: (name, fn) => { handlers[name] = fn; }};
  const guard = editor.installTestSendGuard(form, message);
  assert.equal(button.disabled, false);
  let prevented = false;
  handlers.submit({preventDefault() { prevented = true; }});
  assert.equal(prevented, false);
  assert.equal(button.disabled, true);
  handlers.submit({preventDefault() { prevented = true; }});
  assert.equal(prevented, true);
  guard.restore();
  assert.equal(button.disabled, true);
  assert.match(message.textContent, /刷新/);
});

test('test-send page renders escaped recent recipient status without a wide table', () => {
  const jsp = fs.readFileSync(path.join(__dirname, '../../main/resources/META-INF/resources/WEB-INF/mobile/campaign-editor.jsp'), 'utf8');
  assert.ok(/items="\$\{campaignTestSendHistory\}"/.test(jsp));
  assert.ok(/<c:out value="\$\{testItem\.recipientEmail\}"\s*\/>/.test(jsp));
  assert.ok(/<c:out value="\$\{testItem\.sendStatusDisplayName\}"\s*\/>/.test(jsp));
  assert.ok(/<c:out value="\$\{testItem\.deliveryStatusDisplayName\}"\s*\/>/.test(jsp));
});
