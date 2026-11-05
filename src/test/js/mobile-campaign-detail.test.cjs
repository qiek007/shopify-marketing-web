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
