const test = require('node:test');
const assert = require('node:assert/strict');
const destination = require('../../main/resources/META-INF/resources/shopify/mobile/entry.js');
const root = 'http://localhost:7050/shopify-marketing-web';

test('mobile entry retains the selected shop without repeating SSO parameters', () => {
    assert.equal(destination(root + '/?shop=demo.example&token=secret&refreshLogin=1', 'Android', '/shopify-marketing-web'),
        root + '/mobile/dashboard?shop=demo.example');
});
test('mobile campaign links retain the activity identity', () => {
    assert.equal(destination(root + '/campaigns/detail?shop=demo.example&campaignId=c1', 'iPhone', '/shopify-marketing-web'),
        root + '/mobile/campaigns/detail?shop=demo.example&campaignId=c1');
});
test('desktop and existing mobile URLs retain their pages', () => {
    assert.equal(destination(root + '/dashboard', 'Windows', '/shopify-marketing-web'), null);
    assert.equal(destination(root + '/mobile/dashboard', 'Android', '/shopify-marketing-web'), null);
});

test('customer entry retains repeated tags and behavior ranges without authentication parameters', () => {
    const result = new URL(destination(root + '/customers?shop=demo.example&tag=A&tag=B&minBehaviorCount=2&maxUniqueBehaviorCount=8&token=secret', 'Android', '/shopify-marketing-web'));
    assert.deepEqual(result.searchParams.getAll('tag'), ['A', 'B']);
    assert.equal(result.searchParams.get('minBehaviorCount'), '2');
    assert.equal(result.searchParams.get('maxUniqueBehaviorCount'), '8');
    assert.equal(result.searchParams.has('token'), false);
});

test('automation entry retains its rule filters', () => {
    const result = new URL(destination(root + '/automations?shop=demo.example&name=welcome&status=PAUSED&triggerEvent=PAGE_VIEWED&page=2', 'Android', '/shopify-marketing-web'));
    assert.equal(result.searchParams.get('name'), 'welcome');
    assert.equal(result.searchParams.get('triggerEvent'), 'PAGE_VIEWED');
    assert.equal(result.searchParams.get('page'), '2');
});


test('mobile customer entry retains explicit query intent for paged results',()=>{
  const entry=require('../../main/resources/META-INF/resources/shopify/mobile/entry.js');
  const url=new URL(entry('https://example.test/web/customers?shop=a.example&query=1&page=2','Android','/web'));
  assert.equal(url.pathname,'/web/mobile/customers');
  assert.equal(url.searchParams.get('query'),'1');assert.equal(url.searchParams.get('page'),'2');
});
