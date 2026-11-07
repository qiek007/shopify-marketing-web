const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../main/resources/META-INF/resources');
for (const module of ['public']) {
  for (const theme of ['shopify', 'shopify-theme2']) {
    test(`${module}/${theme} shows separate and conservative audit labels`, () => {
      const page = fs.readFileSync(path.join(root, 'WEB-INF', theme, 'fragments/campaign-recipient-results.jsp'), 'utf8');
      assert.ok(page.includes('邮件明细覆盖'));
      assert.ok(page.includes('通道接收核验'));
      assert.ok(page.includes('回调统计一致性'));
      assert.ok(page.includes('数量对齐，尚未逐条核验'));
      assert.ok(page.includes('recipientQuality.coverage'));
      assert.ok(page.includes('recipientQuality.callbacks'));
      assert.ok(page.includes('recipientQuality.differences'));
      assert.ok(page.includes('汇总记录'));
      assert.ok(page.includes('明细投影'));
      assert.ok(page.includes('不能单凭差异判断哪一侧有误'));
    });
  }
}
