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

test('returning to queried customers keeps the explicit query marker without unrelated parameters', () => {
  assert.equal(navigation.listReturnUrl('/web/mobile/customers?shop=a.example&query=1&q=demo&page=3&token=secret',
    'http://localhost','/web','a.example','customers'),'/web/mobile/customers?shop=a.example&query=1&q=demo&page=3');
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


function shopMemoryFixture(user='domain:user',context='/web') {
  const storage=new Map(), events={}, formEvents={}, redirects=[];
  const select={value:'a.example',options:[{value:'a.example',text:'第一店'},{value:'b.example',text:'第二店'}]};
  const form={action:'https://example.test'+context+'/mobile/campaigns',
    querySelector:selector=>selector==='select[name=shop]'?select:null,
    addEventListener:(type,handler)=>{formEvents[type]=handler;}};
  const script={dataset:{context,user}};
  const win={document:{referrer:'',querySelector:selector=>selector==='.mobile-shop'?form:null},
    location:{href:'https://example.test'+context+'/mobile/campaigns?shop=a.example',origin:'https://example.test',replace:url=>redirects.push(url)},
    localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},
    performance:{getEntriesByType:()=>[{type:'navigate'}]},addEventListener:(type,handler)=>{events[type]=handler;}};
  const key='mobile-last-shop:'+JSON.stringify([context,user]);
  return {win,script,select,storage,events,formEvents,redirects,key};
}
test('mobile entry restores a previously visited shop only while it remains accessible', () => {
  const f=shopMemoryFixture();f.storage.set(f.key,'b.example');
  assert.equal(navigation.initShopMemory(f.win,f.script),true);
  assert.deepEqual(f.redirects,['/web/mobile/campaigns?shop=b.example']);
  assert.equal(f.storage.get(f.key),'b.example');
  const missing=shopMemoryFixture();missing.storage.set(missing.key,'removed.example');
  assert.equal(navigation.initShopMemory(missing.win,missing.script),false);
  assert.deepEqual(missing.redirects,[]);
  assert.equal(missing.storage.get(missing.key),'a.example');
});
test('shop memory is scoped by account and application and saves manual selections', () => {
  const f=shopMemoryFixture();navigation.initShopMemory(f.win,f.script);
  assert.equal(f.storage.get(f.key),'a.example');
  f.select.value='b.example';f.formEvents.submit();
  assert.equal(f.storage.get(f.key),'b.example');
  f.select.value='a.example';f.events.pageshow();
  assert.equal(f.storage.get(f.key),'a.example');
  f.storage.set(f.key,'b.example');f.script.dataset.user='domain:another';
  navigation.initShopMemory(f.win,f.script);
  assert.deepEqual(f.redirects,[]);
  assert.equal(f.storage.get('mobile-last-shop:'+JSON.stringify(['/web','domain:another'])),'a.example');
  f.script.dataset.user='domain:user';f.script.dataset.context='/other';
  navigation.initShopMemory(f.win,f.script);
  assert.deepEqual(f.redirects,[]);
});
test('shop memory keeps internal navigation, records, filters and history on their original shop', () => {
  for (const [path,referrer,type] of [
    ['/web/mobile/campaigns?shop=a.example','https://example.test/web/mobile/dashboard?shop=a.example','navigate'],
    ['/web/mobile/campaigns/detail?shop=a.example&campaignId=c1','','navigate'],
    ['/web/mobile/campaigns/editor?shop=a.example','','navigate'],
    ['/web/mobile/customers/detail?shop=a.example&customerId=x','','navigate'],
    ['/web/mobile/campaigns?shop=a.example&q=hello','','navigate'],
    ['/web/mobile/campaigns?shop=a.example#mobile-list-return','','navigate'],
    ['/web/mobile/campaigns?shop=a.example','','reload'],
    ['/web/mobile/campaigns?shop=a.example','','back_forward']
  ]) {
    const f=shopMemoryFixture();f.storage.set(f.key,'b.example');f.win.location.href='https://example.test'+path;
    f.win.document.referrer=referrer;f.win.performance.getEntriesByType=()=>[{type}];
    assert.equal(navigation.initShopMemory(f.win,f.script),false);
    assert.deepEqual(f.redirects,[],path);
  }
});
test('store access changes and unavailable local storage never block navigation', () => {
  const f=shopMemoryFixture();
  f.win.localStorage={getItem:()=>{throw Error('blocked');},setItem:()=>{throw Error('blocked');},removeItem:()=>{throw Error('blocked');}};
  assert.doesNotThrow(()=>navigation.initShopMemory(f.win,f.script));
  f.select.value='b.example';assert.doesNotThrow(()=>f.formEvents.submit());
  const anonymous=shopMemoryFixture(':');assert.equal(navigation.initShopMemory(anonymous.win,anonymous.script),false);
  assert.equal(anonymous.storage.size,0);
});
