const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
{ const module = 'public';
  for (const theme of ['shopify', 'shopify-theme2']) {
    test(`${module}/${theme}: release action is wider and keeps icon spacing`, () => {
      const source = fs.readFileSync(path.resolve(__dirname, '../../main/resources/META-INF/resources/WEB-INF', theme, 'suppressions.jsp'), 'utf8');
      assert.ok(/\.filter-actions \.secondary-button\[data-suppression-release\]\s*\{[^}]*min-width:\s*150px;[^}]*gap:\s*8px;[^}]*white-space:\s*nowrap;/.test(source), 'Scoped width and spacing style is required');
      assert.ok(source.includes('type="button" data-suppression-release><i class="fa fa-unlock-alt"></i><span>移出抑制名单</span>'));
      assert.ok(source.includes('data-suppression-release-form'));
      assert.ok(source.includes("releaseDialog.showModal()"));
    });
  }
}
