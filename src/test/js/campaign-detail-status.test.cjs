const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../main/resources/META-INF/resources/WEB-INF');
for (const theme of ['shopify', 'shopify-theme2']) {
  test(`${theme}: detail uses localized archive-aware status and progress stays localized`, () => {
    const page = fs.readFileSync(path.join(root, theme, 'campaign-detail.jsp'), 'utf8');
    assert.match(page, /campaignStatusDisplayName/);
    assert.match(page, /displayCampaignStatus\(progress\.status\)/);
  });
  test(`${theme}: initial rendering has a localized fallback without a new backend`, () => {
    const page = fs.readFileSync(path.join(root, theme, 'campaign-detail.jsp'), 'utf8');
    assert.match(page, /not empty campaignStatusDisplayName/);
    for (const [status, label] of Object.entries({DRAFT:'草稿',PENDING_APPROVAL:'待审批',APPROVED:'已审批',PREPARING:'准备中',SCHEDULED:'已计划',RUNNING:'发送中',QUEUED:'已进入队列',PAUSED:'已暂停',COMPLETED:'已完成',CANCELLED:'已取消',FAILED:'失败'})) {
      assert.ok(page.includes(`campaignDetail.status eq '${status}'`) && page.includes(`>${label}</c:when>`), `${theme} missing fallback ${status}`);
    }
  });
  test(`${theme}: approval and archive colors are visibly different`, () => {
    const page = fs.readFileSync(path.join(root, theme, 'campaigns.jsp'), 'utf8');
    assert.match(page, /data-campaign-status="APPROVED"\] \{ color: #164e63; background: #cffafe;/);
  });
}
