const test = require('node:test');
const assert = require('node:assert/strict');
const navigation = require('../../main/resources/META-INF/resources/shopify/mobile/navigation.js');

test('shop search matches both names and domains without modifying the available shops', () => {
  const shops = [{id: 'a.example', name: '示例店'}, {id: 'b.example', name: '第二店'}];
  assert.deepEqual(navigation.matchingShops(shops, ' 示例 '), [shops[0]]);
  assert.deepEqual(navigation.matchingShops(shops, 'B.EXAMPLE'), [shops[1]]);
  assert.deepEqual(navigation.matchingShops(shops, 'missing'), []);
  assert.equal(shops.length, 2);
});

test('list returns preserve the shop, filters and page while removing unrelated parameters', () => {
  const url = navigation.listReturnUrl('/web/mobile/campaigns?shop=a.example&q=hello&status=DRAFT&page=2&token=secret', 'http://localhost', '/web', 'a.example');
  assert.equal(url, '/web/mobile/campaigns?shop=a.example&q=hello&status=DRAFT&page=2');
});

test('list returns reject other origins, non-list routes and other shops', () => {
  for (const value of ['https://other.example/web/mobile/campaigns?shop=a.example', '/web/mobile/campaigns/action?shop=a.example', '/web/mobile/campaigns?shop=b.example', 'javascript:alert(1)']) {
    assert.equal(navigation.listReturnUrl(value, 'http://localhost', '/web', 'a.example'), null);
  }
});

test('customer returns retain repeated tags and paging without mixing activity lists', () => {
  assert.equal(navigation.listReturnUrl('/web/mobile/customers?shop=a.example&tag=A&tag=B&page=3&token=secret',
    'http://localhost', '/web', 'a.example', 'customers'), '/web/mobile/customers?shop=a.example&tag=A&tag=B&page=3');
  assert.equal(navigation.listReturnUrl('/web/mobile/campaigns?shop=a.example',
    'http://localhost', '/web', 'a.example', 'customers'), null);
});

test('date filters allow an open range but reject reversed dates', () => {
  assert.equal(navigation.dateRangeValid('2026-11-02', '2026-11-01'), false);
  assert.equal(navigation.dateRangeValid('2026-11-01', '2026-11-01'), true);
  assert.equal(navigation.dateRangeValid('', '2026-11-01'), true);
});

test('customer previews retain only the current shop and customer on the customer detail route', () => {
  assert.equal(navigation.customerPreviewUrl('/web/mobile/customers/detail?shop=a.example&customerId=c%26x&token=secret',
    'http://localhost', '/web', 'a.example'), '/web/mobile/customers/detail?shop=a.example&customerId=c%26x');
  for (const value of ['https://other.example/web/mobile/customers/detail?shop=a.example&customerId=c1',
    '/web/mobile/customers/detail?shop=b.example&customerId=c1', '/web/mobile/customers?shop=a.example&customerId=c1',
    '/web/mobile/customers/detail?shop=a.example']) {
    assert.equal(navigation.customerPreviewUrl(value, 'http://localhost', '/web', 'a.example'), null);
  }
});
