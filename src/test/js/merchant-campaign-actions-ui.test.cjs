const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const workspace = path.resolve(__dirname, '../../main/resources/META-INF/resources');
const roots = ['public'].flatMap(module =>
  ['shopify', 'shopify-theme2'].map(theme => ({
    label: `${module}/${theme}`,
    directory: path.join(workspace, 'WEB-INF', theme)
  })));

function read(root, name) {
  return fs.readFileSync(path.join(root.directory, name), 'utf8');
}

function actionForm(source, action) {
  return [...source.matchAll(/<form\b[\s\S]*?<\/form>/g)]
    .map(match => match[0]).find(form => form.includes(`name="action" value="${action}"`));
}

function assertPendingHandler(source) {
  assert.match(source, /querySelectorAll\('form\[data-merchant-action-form\]'\)/);
  assert.match(source, /addEventListener\('submit'/);
  assert.match(source, /dataset\.submitting === 'true'/);
  assert.match(source, /window\.confirm\(message\)/);
  assert.match(source, /event\.preventDefault\(\)/);
  assert.match(source, /button\.disabled = true/);
  assert.match(source, /fa-spinner fa-spin/);
}

for (const root of roots) {
  test(`${root.label}: campaign list shows direct execution and validity times`, () => {
    const source = read(root, 'campaigns.jsp');
    assert.match(source, /<th class="campaign-time-column">执行时间<\/th>/);
    assert.match(source, /<th class="campaign-time-column">有效截止时间<\/th>/);
    for (const field of ['startedAt', 'validUntil']) {
      assert.match(source, new RegExp(`<time[^>]*data-browser-time="<c:out value='\\$\\{campaign\\.${field}\\}'/>"[^>]*data-browser-time-format="date-time"`));
    }
    assert.match(source, /未执行/);
    assert.match(source, /执行后确定/);
    assert.match(source, /\.campaign-time-column[^}]*white-space:\s*nowrap/);
    assert.match(source, /\.campaign-list-table-wrap[^}]*overflow-x:\s*auto/);
    assert.doesNotMatch(source, /(?:validUntil[\s\S]{0,60}(?:plusHours|7200000)|colspan="6")/);
  });

  test(`${root.label}: campaign list limits withdrawal to its creator and supports copy`, () => {
    const source = read(root, 'campaigns.jsp');
    assert.match(source, /<c:if test="\$\{canManageCampaigns and \(campaign\.status eq 'PENDING_APPROVAL' or campaign\.status eq 'APPROVED'\) and not empty campaign\.createdBy and campaign\.createdBy eq logineduser\.id\}">\s*<form[^>]*data-merchant-action-form/);
    const withdraw = actionForm(source, 'WITHDRAW');
    assert.ok(withdraw, 'withdraw form exists');
    assert.match(withdraw, /method="post" action="\$\{ctx\}\/campaigns\/action"/);
    assert.match(withdraw, /data-confirm-message="撤回后返回草稿并清除冻结受众，发送前需重新审批"/);
    assert.match(withdraw, /data-pending-label="撤回中…"/);
    const copy = actionForm(source, 'COPY');
    assert.ok(copy, 'copy form exists');
    assert.match(source, /<c:if test="\$\{canManageCampaigns\}">\s*<form[^>]*data-merchant-action-form[^>]*data-pending-label="复制中…"/);
    assert.match(copy, /method="post" action="\$\{ctx\}\/campaigns\/action"/);
    assert.doesNotMatch(copy, /data-confirm-message/);
    assert.ok(actionForm(source, 'SUBMIT'), 'existing submission is preserved');
    assertPendingHandler(source);
  });

  test(`${root.label}: campaign detail uses the withdrawal permission model`, () => {
    const source = read(root, 'campaign-detail.jsp');
    assert.match(source, /<c:if test="\$\{canWithdrawCampaign\}">\s*<form[^>]*data-merchant-action-form/);
    const withdraw = actionForm(source, 'WITHDRAW');
    assert.ok(withdraw, 'withdraw form exists');
    assert.match(withdraw, /data-confirm-message="撤回后返回草稿并清除冻结受众，发送前需重新审批"/);
    assert.match(withdraw, /data-pending-label="撤回中…"/);
    for (const existing of ['SUBMIT', 'APPROVE', 'REJECT']) {
      assert.ok(actionForm(source, existing), `${existing} remains available`);
    }
    assertPendingHandler(source);
  });

  test(`${root.label}: segment deletion is confirmed and limited to campaign managers`, () => {
    const source = read(root, 'segments.jsp');
    assert.match(source, /<c:if test="\$\{canManageCampaigns\}">\s*<form[^>]*method="post" action="\$\{ctx\}\/segments\/delete"[^>]*data-merchant-action-form/);
    assert.match(source, /data-confirm-message="仅删除分组，不删除客户，已有活动快照保留"/);
    assert.match(source, /name="shop" value="\$\{segment\.shopDomain\}"/);
    assert.match(source, /name="segmentId" value="\$\{segment\.segmentId\}"/);
    assert.match(source, /data-pending-label="删除中…"/);
    assertPendingHandler(source);
  });
}
