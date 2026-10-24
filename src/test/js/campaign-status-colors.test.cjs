const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../main/resources/META-INF/resources');
const statuses = ['DRAFT','PENDING_APPROVAL','APPROVED','PREPARING','SCHEDULED','RUNNING','QUEUED','PAUSED','COMPLETED','CANCELLED','FAILED'];
function luminance(hex) {
  const rgb = hex.match(/[a-f0-9]{2}/gi).map(channel => {
    const value = parseInt(channel, 16) / 255;
    return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
  });
  return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
}
{ const module = 'public';
  for (const theme of ['shopify', 'shopify-theme2']) {
    const file = path.join(root, 'WEB-INF', theme, 'campaigns.jsp');
    const source = fs.readFileSync(file, 'utf8');
    test(`${module}/${theme}: every campaign status has a distinct readable palette`, () => {
      assert.equal(statuses.length, 11);
      const pairs = new Set();
      for (const status of statuses) {
        const pattern = new RegExp('\\.status-table \\.campaign-status\\[data-campaign-status="' + status + '"\\] \\{ color: (#[a-f0-9]{6}); background: (#[a-f0-9]{6}); \\}');
        const match = source.match(pattern);
        assert.ok(match, `Missing scoped status style: ${status}`);
        const contrast = (luminance(match[2]) + .05) / (luminance(match[1]) + .05);
        assert.ok(contrast >= 4.5, `${status} text contrast is ${contrast}`);
        pairs.add(match[1] + match[2]);
      }
      assert.equal(pairs.size, statuses.length);
    });
    test(`${module}/${theme}: status text and scheduled send time remain intact`, () => {
      assert.ok(source.includes('class="status-pill campaign-status" data-campaign-status="<c:out value=\'${campaign.status}\'/>"'));
      assert.ok(source.includes('<c:out value="${campaign.statusDisplayName}"/>'));
      assert.ok(source.includes("campaign.status eq 'SCHEDULED' and not empty campaign.scheduledAt"));
      assert.ok(source.includes('定时发送：'));
      assert.ok(!source.includes('class="status-pill neutral"><c:out value="${campaign.statusDisplayName}"/>'));
    });
  }
}
