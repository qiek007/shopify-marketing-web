const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
let customer;
try { customer = require('../../main/resources/META-INF/resources/shopify/mobile/customers.js'); }
catch (error) { if (error.code !== 'MODULE_NOT_FOUND') throw error; }
const view = name => fs.readFileSync(path.join(__dirname, '../../main/resources/META-INF/resources/WEB-INF/mobile', name), 'utf8');

test('customer filter labels describe the event date and matching unique count', () => {
  assert.ok(customer, 'mobile customers behavior must exist');
  assert.deepEqual(customer.filterInfo('VIEWED'), {date: '浏览日期范围', hint: '按客户浏览商品的发生时间筛选', countable: true, unique: '去重商品数'});
  assert.equal(customer.filterInfo('ORDERED').unique, '去重订单数');
  assert.equal(customer.filterInfo('EMAIL_OPENED').unique, '去重邮件数');
  assert.equal(customer.filterInfo('EMAIL_DELIVERED_NOT_OPENED').countable, false);
  assert.equal(customer.filterInfo('').date, '最近活动日期范围');
});

test('count inputs are disabled when their activity type is not countable', () => {
  let fields = [{hidden: false, querySelectorAll: () => [{disabled: false}]}];
  let controls = [{disabled: false}, {disabled: false}];
  fields[0].querySelectorAll = () => controls;
  customer.setCountFields(fields, false);
  assert.equal(fields[0].hidden, true);
  assert.ok(controls.every(input => input.disabled));
  customer.setCountFields(fields, true);
  assert.equal(fields[0].hidden, false);
  assert.ok(controls.every(input => !input.disabled));
});

test('selecting untagged excludes other tag values from the submitted query', () => {
  const fields = [{disabled: false}, {disabled: false}];
  customer.setTagFields(fields, true);
  assert.ok(fields.every(input => input.disabled));
  customer.setTagFields(fields, false);
  assert.ok(fields.every(input => !input.disabled));
});

test('timeline date range must be ordered and no more than 400 inclusive days', () => {
  assert.equal(customer.timelineRangeError('2026-11-08', '2026-11-01'), '开始日期不能晚于结束日期');
  assert.equal(customer.timelineRangeError('2025-01-01', '2026-02-05'), '时间线查询范围不能超过 400 天');
  assert.equal(customer.timelineRangeError('2026-01-01', '2026-01-30'), '');
});

test('list exposes a store-preserving reset link and detail exposes an independent timeline form', () => {
  const list = view('customers.jsp'), detail = view('customer-detail.jsp');
  assert.ok(/清空筛选/.test(list));
  assert.ok(/id="mobile-customer-timeline-filter"/.test(detail));
  assert.ok(/shopify\/mobile\/customers\.js/.test(detail));
});

test('mobile list and detail are read-only and escape user-provided content', () => {
  const list = view('customers.jsp'), detail = view('customer-detail.jsp');
  assert.ok(/<c:out value="\$\{customer\.displayName\}"\s*\/>/.test(list));
  assert.ok(/<c:out value="\$\{customerDetail\.customer\.email\}"\s*\/>/.test(detail));
  assert.ok(/<c:out value="\$\{activity\.description\}"\s*\/>/.test(detail));
  assert.ok(!/method="post"/i.test(list + detail));
  assert.ok(/timelineWindow\.unavailable/.test(detail));
  assert.ok(/behaviorFilterAvailable/.test(list));
});

test('customer consent labels include recognized states and escaped fallback', () => {
  for (const jsp of [view('customers.jsp'), view('customer-detail.jsp')]) {
    for (const state of ['SUBSCRIBED', 'NOT_SUBSCRIBED', 'UNSUBSCRIBED', 'UNKNOWN']) {
      assert.ok(jsp.includes("eq '" + state + "'"), state + ' must be translated');
    }
    for (const label of ['已订阅', '未订阅', '已退订', '未知']) assert.ok(jsp.includes(label));
    assert.ok(/<c:otherwise><c:out value="\$\{[^}]*consentState\}"/.test(jsp));
  }
});

test('advanced filters expand when any advanced value is present and mobile assets are versioned', () => {
  const list = view('customers.jsp');
  assert.ok(/<details[^>]*<c:if test="\$\{[^}]*customerFilter\.fromDate[^}]*customerFilter\.maxUniqueBehaviorCount[^}]*\}"[^>]*>open<\/c:if>/.test(list));
  for (const jsp of [list, view('customer-detail.jsp')]) {
    assert.ok(jsp.includes('mobile.css?v=20261108-customers2'));
    assert.match(jsp, /customers\.css\?v=[\w-]+/);
    assert.ok(jsp.includes('customers.js?v=20261108-customers2'));
  }
});

test('detail distinguishes displayed orders and incomplete timeline from total data', () => {
  const detail = view('customer-detail.jsp');
  assert.ok(detail.includes('最近订单（最多 100 笔）'));
  assert.ok(detail.includes('当前记录未全部展示'));
  assert.ok(detail.includes('请使用电脑端查看更多'));
  assert.ok(!detail.includes('缩小日期范围查看其他记录'));
});
