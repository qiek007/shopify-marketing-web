const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const script = path.join(__dirname, '../../main/resources/META-INF/resources/shopify/mobile/campaign-detail.js');
const page = path.join(__dirname, '../../main/resources/META-INF/resources/WEB-INF/mobile/campaign-detail.jsp');

function subject() {
    assert.ok(fs.existsSync(script), 'mobile campaign action guard must exist');
    return require(script);
}

function fixture(message) {
    const button = { disabled: false, textContent: '执行' };
    const form = {
        dataset: { confirmMessage: message || '' },
        querySelectorAll: () => [button],
        addEventListener(type, listener) { this[type] = listener; }
    };
    const event = { prevented: false, preventDefault() { this.prevented = true; } };
    return { button, form, event };
}

test('template preview loads the activity body only when the dialog opens', () => {
    const { installTemplatePreview } = subject();
    const loads = [];
    const frame = {
        dataset: { previewSrc: '/web/campaigns/preview?shop=a.myshopify.com&campaignId=c-1' },
        hasAttribute: () => loads.length > 0,
        setAttribute(name, value) { assert.equal(name, 'src'); loads.push(value); }
    };
    const trigger = { addEventListener(type, listener) { this[type] = listener; } };
    const dialog = {
        open: false,
        querySelector: () => frame,
        showModal() { this.open = true; }
    };

    installTemplatePreview(trigger, dialog);
    assert.deepEqual(loads, []);
    trigger.click();
    assert.equal(dialog.open, true);
    assert.deepEqual(loads, [frame.dataset.previewSrc]);
    dialog.open = false;
    trigger.click();
    assert.equal(dialog.open, true);
    assert.deepEqual(loads, [frame.dataset.previewSrc]);
});

test('canceling confirmation keeps the form usable', () => {
    const { installActionGuard } = subject();
    const a = fixture('确认发送？');
    installActionGuard([a.form], () => false);
    a.form.submit(a.event);
    assert.equal(a.event.prevented, true);
    assert.equal(a.button.disabled, false);
});

test('one accepted action blocks other actions until page restoration', () => {
    const { installActionGuard } = subject();
    const a = fixture('确认暂停？');
    const b = fixture('确认取消？');
    const reset = installActionGuard([a.form, b.form], () => true);
    a.form.submit(a.event);
    assert.equal(a.event.prevented, false);
    assert.equal(a.button.disabled, true);
    assert.equal(b.button.disabled, true);
    b.form.submit(b.event);
    assert.equal(b.event.prevented, true);
    reset();
    assert.equal(a.button.disabled, false);
    assert.equal(b.button.disabled, false);
});

test('guard enables protected actions only after initialization', () => {
    const { installActionGuard } = subject();
    const a = fixture('确认发送？');
    a.button.disabled = true;
    a.form.dataset.requiresGuard = 'true';
    const reset = installActionGuard([a.form], () => true);
    assert.equal(a.button.disabled, false);
    a.form.submit(a.event);
    assert.equal(a.button.disabled, true);
    reset();
    assert.equal(a.button.disabled, false);
});

test('mobile detail exposes only state-gated actions with confirmation and retained identity', () => {
    assert.ok(fs.existsSync(page), 'mobile campaign detail page must exist');
    const html = fs.readFileSync(page, 'utf8');
    for (const action of ['SUBMIT', 'APPROVE', 'APPROVE_AND_SEND', 'SEND', 'PAUSE', 'RESUME', 'CANCEL']) {
        assert.match(html, new RegExp('name="action" value="' + action + '"'));
    }
    assert.match(html, /canManageCampaigns\s+and\s+campaignDetail\.pendingApproval/);
    assert.match(html, /canManageCampaigns\s+and\s+campaignDetail\.sendable/);
    assert.match(html, /confirmationRequiredCount\s+gt\s+0/);
    assert.match(html, /name="confirmNotSubscribed"/);
    assert.match(html, /已提交给邮件通道的邮件无法撤回/);
    assert.match(html, /name="shop"/);
    assert.match(html, /name="campaignId"/);
    assert.match(html, /\/mobile\/campaigns\/action/);
});

test('test-send entry is limited to authorized editable activities', () => {
    assert.ok(fs.existsSync(page), 'mobile campaign detail page must exist');
    const html = fs.readFileSync(page, 'utf8');
    assert.match(html, /\/mobile\/campaigns\/editor/);
    assert.match(html, /name="mode" value="test"/);
    assert.match(html, /canManageCampaigns\s+and\s+\(campaignDetail\.status eq 'DRAFT' or campaignDetail\.status eq 'PENDING_APPROVAL'\)/);
});

test('send controls show current shop, template, audience and channels for review', () => {
    assert.ok(fs.existsSync(page), 'mobile campaign detail page must exist');
    const html = fs.readFileSync(page, 'utf8');
    const review = html.match(/<dl class="md-detail-list" data-mobile-review>[\s\S]*?<\/dl>/);
    assert.ok(review, 'review details must be near campaign actions');
    for (const field of ['shopDomain', 'templateName', 'audienceSourceDisplayName', 'providers', 'includeTagsDisplayName', 'excludeTagsDisplayName']) {
        assert.ok(review[0].includes('campaignDetail.' + field), field + ' is missing from review');
    }
});

test('scheduled times enforce the inclusive time window and reject daylight-saving gaps or overlaps', () => {
    const { scheduleInstant } = subject();
    const scheduleWindow = require('../../main/resources/META-INF/resources/shopify/js/campaign-schedule-window.js');
    const original = process.env.TZ;
    process.env.TZ = 'America/New_York';
    try {
        const now = new Date('2026-01-01T14:00:00Z');
        const input = {};
        scheduleWindow.initialize(input, null, now.getTime());
        assert.equal(input.min, '2026-01-01T10:00');
        assert.equal(input.value, input.min);
        const partialMinute = new Date('2026-01-01T14:00:01Z');
        scheduleWindow.initialize(input, null, partialMinute.getTime());
        assert.equal(input.min, '2026-01-01T10:01');
        assert.equal(input.value, input.min);
        assert.equal(scheduleInstant(input.value, partialMinute).value, '2026-01-01T15:01:00.000Z');
        assert.match(scheduleInstant('2026-01-01T10:00', partialMinute).error, /60 分钟后至 30 天内/);
        assert.equal(scheduleInstant('2026-01-01T10:00', now).value, '2026-01-01T15:00:00.000Z');
        assert.equal(scheduleInstant('2026-01-31T09:00', now).value, '2026-01-31T14:00:00.000Z');
        assert.match(scheduleInstant('2026-01-01T09:59', now).error, /60 分钟后至 30 天内/);
        assert.match(scheduleInstant('2026-01-31T09:01', now).error, /60 分钟后至 30 天内/);
        assert.match(scheduleInstant('2026-03-08T02:30', new Date('2026-03-07T12:00:00Z')).error, /夏令时/);
        assert.match(scheduleInstant('2026-11-01T01:30', new Date('2026-10-31T12:00:00Z')).error, /夏令时/);
        assert.ok(scheduleInstant('', now).error);
    } finally { process.env.TZ = original; }
});

test('invalid schedule does not confirm, submit or lock controls; valid schedule sends UTC', () => {
    const { installActionGuard } = subject();
    const a = fixture('确认定时？');
    let prompts = 0;
    const local = { value: '', addEventListener() {}, setCustomValidity(value) { this.error = value; }, reportValidity() {} };
    a.form.dataset.scheduleAction = 'true';
    a.form.elements = {scheduleLocal: local, scheduledAt: {value: ''}};
    installActionGuard([a.form], () => { prompts++; return true; });
    assert.ok(local.min && local.max && local.value < local.max);
    assert.equal(local.value, local.min);
    local.value = '';
    a.form.submit(a.event);
    assert.equal(a.event.prevented, true);
    assert.equal(a.button.disabled, false);
    assert.equal(prompts, 0);
    const next = { prevented:false, preventDefault() { this.prevented = true; } };
    local.value = local.max;
    a.form.submit(next);
    assert.equal(next.prevented, false);
    assert.equal(a.form.elements.scheduledAt.value, new Date(local.value).toISOString());
    assert.equal(a.button.disabled, true);
});

test('blank rejection reasons are rejected before confirmation and do not lock controls', () => {
    const { installActionGuard } = subject();
    const a = fixture('确认驳回？');
    let prompts = 0;
    a.form.dataset.rejectAction = 'true';
    a.form.elements = {reason: {value:'   ', addEventListener() {}, setCustomValidity(value) { this.error = value; }, reportValidity() {}}};
    installActionGuard([a.form], () => { prompts++; return true; });
    a.form.submit(a.event);
    assert.equal(a.event.prevented, true);
    assert.equal(a.button.disabled, false);
    assert.equal(prompts, 0);
});

test('mobile controls include withdrawal, rejection and scheduled actions', () => {
    const html = fs.readFileSync(page, 'utf8');
    assert.match(html, /canWithdrawCampaign/);
    assert.match(html, /name="action" value="WITHDRAW"/);
    assert.match(html, /name="action" value="REJECT"/);
    assert.match(html, /name="reason"[^>]*required/);
    assert.match(html, /name="action" value="\$\{campaignDetail.status eq 'SCHEDULED' \? 'RESCHEDULE' : 'SCHEDULE'\}"/);
    assert.match(html, /name="action" value="CANCEL_SCHEDULE"/);
    assert.match(html, /name="scheduledAt"/);
    assert.match(html, /campaignStatusDisplayName eq ["']已归档["']/);
});

test('mobile status palette matches PC including derived archived status', () => {
    const cssPath = path.join(__dirname, '../../main/resources/META-INF/resources/shopify/mobile/status.css');
    const pcPath = path.join(__dirname, '../../main/resources/META-INF/resources/WEB-INF/shopify-theme2/campaign-detail.jsp');
    const css = fs.readFileSync(cssPath, 'utf8');
    const pc = fs.readFileSync(pcPath, 'utf8');
    for (const status of ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PREPARING', 'SCHEDULED', 'RUNNING', 'QUEUED', 'PAUSED', 'ARCHIVED', 'COMPLETED', 'CANCELLED', 'FAILED']) {
        const pcRule = pc.match(new RegExp('#campaign-current-status\\[data-campaign-status="' + status + '"\\]\\s*\\{\\s*color:\\s*(#[0-9a-f]+);\\s*background:\\s*(#[0-9a-f]+)', 'i'));
        const mobileRule = css.match(new RegExp('\\.mobile-status\\[data-campaign-status="' + status + '"\\],\\s*\\.md-detail-status\\[data-campaign-status="' + status + '"\\]\\s*\\{\\s*color:\\s*(#[0-9a-f]+);\\s*background:\\s*(#[0-9a-f]+)', 'i'));
        assert.ok(pcRule && mobileRule, status + ' rule must exist');
        assert.equal(mobileRule[1], pcRule[1], status + ' foreground');
        assert.equal(mobileRule[2], pcRule[2], status + ' background');
    }
});
