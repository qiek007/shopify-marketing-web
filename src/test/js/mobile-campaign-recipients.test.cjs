const test = require('node:test');
const assert = require('node:assert/strict');
const api = () => require('../../main/resources/META-INF/resources/shopify/mobile/campaign-recipients.js');

test('recipient requests preserve campaign identity, encode search text and allow only query fields', () => {
  const url = new URL(api().requestUrl('/web/campaigns/detail/recipients', 'https://example.test',
    'a.example', 'c&1', {q:' a+b@example.com ',provider:'MAILGUN',lifecycle:'OPENED',token:'secret'}, 2));
  assert.equal(url.searchParams.get('shop'),'a.example');
  assert.equal(url.searchParams.get('campaignId'),'c&1');
  assert.equal(url.searchParams.get('q'),'a+b@example.com');
  assert.equal(url.searchParams.get('page'),'2');
  assert.equal(url.searchParams.get('size'),'10');
  assert.equal(url.searchParams.get('view'),'mobile');
  assert.equal(url.searchParams.has('token'),false);
  assert.throws(()=>api().requestUrl('https://other.test/mobile/campaigns/detail/recipients',
    'https://example.test','a.example','c1',{},1));
});

test('recipient filters preserve supported lifecycle states and normalize bad persisted input', () => {
  assert.deepEqual(api().normalizeFilters({q:' x ',provider:'MAILGUN',lifecycle:'CLICKED'}),
    {q:'x',provider:'MAILGUN',lifecycle:'CLICKED'});
  assert.deepEqual(api().normalizeFilters({provider:'<bad>',lifecycle:'INVALID'}),
    {q:'',provider:'ALL',lifecycle:'ALL'});
});

function fixture(saved) {
  const node=()=>({listeners:{},dataset:{},textContent:'',children:[],
    addEventListener(name,fn){this.listeners[name]=fn;},setAttribute(name,value){this[name]=value;},
    removeAttribute(name){delete this[name];},replaceChildren(...children){this.children=children;},querySelectorAll(){return [];},scrollIntoView(){this.scrolled=true;}});
  const host=node(),status=node(),clear=node(),form=node();
  form.elements={q:{value:''},provider:{value:'ALL'},lifecycle:{value:'ALL'}};
  const root=node();root.dataset={url:'/web/campaigns/detail/recipients',context:'/web',shop:'a.example',campaign:'c1',user:'domain:user'};
  root.querySelector=s=>({'[data-recipient-form]':form,'[data-recipient-results]':host,'[data-recipient-state]':status,'[data-recipient-clear]':clear}[s]);
  const storage=new Map(),requests=[],pending=[];
  const key='mobile-campaign-recipients:'+JSON.stringify(['/web','domain:user','a.example','c1']);
  if(saved) storage.set(key,JSON.stringify(saved));
  const win={location:{href:'https://example.test/web/mobile/campaigns/detail?shop=a.example&campaignId=c1',origin:'https://example.test'},
    document:{importNode:n=>n},sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
    performance:{getEntriesByType:()=>[{type:'navigate'}]},requestAnimationFrame:fn=>fn(),scrollY:200,scrollTo(){},
    fetch:(url,options)=>{requests.push({url,options});return new Promise((resolve,reject)=>pending.push({resolve,reject}));},
    DOMParser:class {parseFromString(text){const result=node();Object.assign(result,JSON.parse(text));return {querySelector:()=>result};}}
  };
  const reply=(page,tag)=>({status:200,redirected:false,headers:{get:()=> 'text/html'},text:async()=>JSON.stringify({dataset:{page:String(page)},tag})});
  return {win,root,host,status,clear,form,storage,key,requests,pending,reply};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));

test('recipient filters restore per campaign, paginate and clear without losing campaign scope', async () => {
  const f=fixture({q:'hello',provider:'MAILGUN',lifecycle:'OPENED',page:3});api().install(f.win,f.root);
  assert.equal(new URL(f.requests[0].url).searchParams.get('page'),'3');
  assert.equal(f.form.elements.q.value,'hello');
  f.pending.shift().resolve(f.reply(3,'page3'));await flush();
  assert.equal(f.host.children[0].tag,'page3');
  assert.equal(f.host.scrolled,undefined);
  f.host.listeners.click({target:{closest:selector=>selector==='[data-recipient-page]'?{dataset:{recipientPage:'4'}}:null},preventDefault(){}});
  assert.equal(new URL(f.requests.at(-1).url).searchParams.get('page'),'4');
  f.pending.shift().resolve(f.reply(4,'page4'));await flush();
  assert.equal(JSON.parse(f.storage.get(f.key)).page,4);
  assert.equal(f.host.scrolled,true);
  f.clear.listeners.click();
  const url=new URL(f.requests.at(-1).url);
  assert.equal(url.searchParams.get('q'),'');assert.equal(url.searchParams.get('lifecycle'),'ALL');
  assert.equal(url.searchParams.get('page'),'1');assert.equal(url.searchParams.get('campaignId'),'c1');
});

test('a stale recipient reply or failure cannot replace the latest query', async () => {
  const f=fixture();api().install(f.win,f.root);const first=f.pending.shift();
  f.form.elements.q.value='new';f.form.listeners.submit({preventDefault(){}});const second=f.pending.shift();
  second.resolve(f.reply(1,'new'));await flush();first.resolve(f.reply(1,'old'));await flush();
  assert.equal(f.host.children[0].tag,'new');
  f.form.listeners.submit({preventDefault(){}});const oldError=f.pending.shift();
  f.form.listeners.submit({preventDefault(){}});f.pending.shift().resolve(f.reply(1,'latest'));await flush();
  oldError.reject(Error('late error'));await flush();
  assert.equal(f.host.children[0].tag,'latest');assert.doesNotMatch(f.status.textContent,/失败/);
});

test('recipient failures show actionable messages and the query can be retried', async () => {
  const f=fixture();f.win.sessionStorage={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
  api().install(f.win,f.root);f.pending.shift().resolve({status:403,redirected:false,headers:{get:()=> 'text/html'}});await flush();
  assert.match(f.status.textContent,/权限/);
  f.form.listeners.submit({preventDefault(){}});f.pending.shift().resolve(f.reply(1,'retry'));await flush();
  assert.equal(f.host.children[0].tag,'retry');assert.equal(f.host['aria-busy'],undefined);
});

test('failed new filters label retained results and lost access clears previously loaded recipients', async () => {
  const f=fixture();api().install(f.win,f.root);f.pending.shift().resolve(f.reply(1,'visible'));await flush();
  f.form.elements.q.value='another';f.form.listeners.submit({preventDefault(){}});
  f.pending.shift().resolve({status:500,redirected:false,headers:{get:()=> 'text/html'}});await flush();
  assert.equal(f.host.children[0].tag,'visible');assert.match(f.status.textContent,/上一次成功查询/);
  f.form.listeners.submit({preventDefault(){}});
  f.pending.shift().resolve({status:403,redirected:false,headers:{get:()=> 'text/html'}});await flush();
  assert.equal(f.host.children.length,0);assert.match(f.status.textContent,/权限/);
});
