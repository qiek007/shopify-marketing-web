const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../main/resources/META-INF/resources');
for (const module of ['public']) {
  for (const theme of ['shopify', 'shopify-theme2']) {
    test(`${module}/${theme} distinguishes unsubscribe people from event counts`, () => {
      const page = fs.readFileSync(path.join(root, 'WEB-INF', theme, 'campaign-detail.jsp'), 'utf8');
      assert.ok(page.includes('summary.unsubscribedRecipients'));
      assert.ok(page.includes('退订人数'));
      assert.ok(page.includes('待核验'));
    });
  }
}
