const test=require('node:test');
const assert=require('node:assert/strict');
const api=()=>require('../../main/resources/META-INF/resources/shopify/mobile/quota.js');

test('quota request uses the current shop and the existing read-only mobile view',()=>{
  const url=new URL(api().quotaUrl('/app/stores?token=secret','https://example.test',' Demo.Example '));
  assert.equal(url.pathname,'/app/stores');
  assert.equal(url.searchParams.get('shop'),'demo.example');
  assert.equal(url.searchParams.get('view'),'mobile-quota');
  assert.equal(url.searchParams.has('token'),false);
  assert.throws(()=>api().quotaUrl('https://other.test/stores','https://example.test','demo.example'));
});

function fixture(shop='demo.example') {
  const node=()=>({hidden:false,disabled:false,textContent:'',dataset:{},children:[],listeners:{},
    addEventListener(name,fn){this.listeners[name]=fn;},setAttribute(name,value){this[name]=value;},
    removeAttribute(name){delete this[name];},replaceChildren(...items){this.children=items;}});
  const state=node(),host=node(),refresh=node(),root=node();
  root.dataset={shop,url:'/app/stores'};
  root.querySelector=s=>({'[data-quota-state]':state,'[data-quota-content]':host,'[data-quota-refresh]':refresh}[s]);
  const pending=[],requests=[];
  const win={document:{importNode:n=>n},location:{href:'https://example.test/app/mobile/',origin:'https://example.test'},
    fetch:(url,options)=>{requests.push({url,options});return new Promise((resolve,reject)=>pending.push({resolve,reject}));},
    DOMParser:class {parseFromString(html){return {querySelector:()=>JSON.parse(html)};}}};
  const reply=(available='true',resultShop='demo.example')=>({status:200,redirected:false,headers:{get:()=> 'text/html'},
    text:async()=>JSON.stringify({dataset:{shop:resultShop,available}})});
  return {win,root,state,host,refresh,pending,requests,reply};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));

test('quota loads separately and a failed refresh clears old balances instead of showing zero',async()=>{
  const f=fixture();api().install(f.win,f.root);
  assert.equal(f.refresh.disabled,true);assert.match(f.state.textContent,/读取/);
  assert.equal(f.requests[0].options.credentials,'same-origin');assert.equal(f.requests[0].options.cache,'no-store');
  f.pending.shift().resolve(f.reply());await flush();
  assert.equal(f.host.children.length,1);assert.match(f.state.textContent,/读取时间/);assert.equal(f.refresh.disabled,false);
  f.refresh.listeners.click();assert.equal(f.host.children.length,0);
  f.pending.shift().resolve({status:403,redirected:false,headers:{get:()=> 'text/html'}});await flush();
  assert.equal(f.host.children.length,0);assert.match(f.state.textContent,/权限/);assert.equal(f.refresh.disabled,false);
});

test('quota refuses another shop and stale responses cannot replace a newer result',async()=>{
  const f=fixture();const controller=api().install(f.win,f.root);const stale=f.pending.shift();
  controller.load();f.pending.shift().resolve(f.reply('true','another.example'));await flush();
  assert.equal(f.host.children.length,0);assert.match(f.state.textContent,/当前店铺/);
  stale.resolve(f.reply());await flush();assert.equal(f.host.children.length,0);
  controller.load();f.pending.shift().resolve(f.reply('false'));await flush();
  assert.equal(f.host.children[0].dataset.available,'false');assert.equal(f.state.hidden,true);
  assert.equal(f.refresh.disabled,false);
});

test('quota makes no request without a selected shop',()=>{
  const f=fixture('');api().install(f.win,f.root);
  assert.equal(f.requests.length,0);assert.match(f.state.textContent,/选择店铺/);
});
