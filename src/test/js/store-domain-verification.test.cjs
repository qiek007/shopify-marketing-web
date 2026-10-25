const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../../main/resources/META-INF/resources');
function harness(module){
 const file=path.join(root,'shopify/js/store-domain-verification.js');
 assert.ok(fs.existsSync(file),'Store-domain query script must exist');
 class E {
  constructor(){this.children=[];this.listeners={};this.hidden=false;this.disabled=false;this.textContent='';this.dataset={};this.open=false;}
  addEventListener(name,callback){(this.listeners[name]??=[]).push(callback);}
  fire(name,event={}){for(const fn of this.listeners[name]||[])fn(event);}
  set innerHTML(value){throw Error('HTML injection sink forbidden');}
  get firstChild(){return this.children[0]||null;}
  appendChild(child){this.children.push(child);return child;}
  removeChild(child){this.children.splice(this.children.indexOf(child),1);}
  setAttribute(){} showModal(){this.open=true;} close(){this.open=false;this.fire('close');}
 }
 const nodes=new Map(),get=s=>{if(!nodes.has(s))nodes.set(s,new E());return nodes.get(s);};
 const panel=new E();panel.dataset={checkUrl:'/app/stores/sender-domain-verification',shop:'shop.example',provider:'INFOBIP',configuredDomain:'mail.example.com'};
 panel.querySelector=get;panel.querySelectorAll=s=>s==='[data-store-domain-close]'?[get('close')]:[];
 const card={querySelector:get};panel.closest=()=>card;
 const calls=[],resolvers=[];let held=false,response={schemaVersion:1,provider:'INFOBIP',domain:'mail.example.com',status:'VERIFIED',checkedAt:'2026-10-24T00:00:00Z',message:'已验证',dnsRecords:[{type:'TXT',host:'mail.example.com',value:'<img src=x onerror=attack()>',verified:true}]};
 const copied=[];
 const context={document:{querySelectorAll:()=>[panel],createElement:()=>new E()},window:{location:{href:'http://localhost/app/stores'},setTimeout},navigator:{clipboard:{writeText:async value=>copied.push(value)}},URL,AbortController,Date,Number,String,Array,
  fetch:async(url,options)=>{calls.push({url,options});if(held)await new Promise(r=>resolvers.push(r));return {ok:!response.httpStatus,status:response.httpStatus||200,headers:{get:()=> 'csrf-test'},json:async()=>response};}};
 get('[data-store-domain-confirm]').hidden=true;
 vm.runInNewContext(fs.readFileSync(file,'utf8'),context);
 return {panel,get,calls,copied,hold:()=>{held=true;},release:()=>{held=false;resolvers.splice(0).forEach(r=>r());},respond:value=>{response=value;},allText:()=>[...nodes.values()].flatMap(n=>[n,...n.children,...n.children.flatMap(c=>c.children),...n.children.flatMap(c=>c.children.flatMap(x=>x.children))]).map(n=>n.textContent).join(' ')};
}
const tick=()=>new Promise(setImmediate);
for(const module of ['public']){
 test(`${module}: long DNS labels are shortened while copy preserves complete host and value`,async()=>{
  const h=harness(module),host='smtp._domainkey.email.long-example-store.example',value='k=rsa; p='+ 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQ'.repeat(8);
  h.respond({provider:'INFOBIP',domain:'mail.example.com',status:'VERIFIED',dnsRecords:[{type:'TXT',host,value,verified:true}]});
  h.get('[data-store-domain-open]').fire('click');await tick();
  const row=h.get('[data-store-domain-records]').children[0];
  assert.ok(row.children[1].textContent.length<host.length);assert.ok(row.children[1].textContent.includes('…'));
  assert.ok(row.children[2].textContent.length<=48);assert.ok(row.children[2].textContent.includes('…'));
  assert.ok(!h.allText().includes(value));
  row.children[4].children[0].fire('click');row.children[4].children[1].fire('click');await tick();
  assert.deepEqual(h.copied,[host,value]);
 });
 test(`${module}: visible supplier confirmation can be canceled without any POST`,async()=>{
  const h=harness(module);h.get('[data-store-domain-open]').fire('click');await tick();
  h.get('[data-store-domain-verify]').fire('click');
  assert.equal(h.get('[data-store-domain-confirm]').hidden,false);
  h.get('[data-store-domain-verify-cancel]').fire('click');
  assert.equal(h.get('[data-store-domain-confirm]').hidden,true);assert.equal(h.calls.filter(c=>c.options.method==='POST').length,0);
 });
 test(`${module}: confirmed supplier verification uses CSRF and sends exactly one POST on double click`,async()=>{
  const h=harness(module);h.get('[data-store-domain-open]').fire('click');await tick();h.hold();
  h.get('[data-store-domain-verify]').fire('click');h.get('[data-store-domain-verify-confirm]').fire('click');h.get('[data-store-domain-verify-confirm]').fire('click');await tick();
  const writes=h.calls.filter(c=>c.options.method==='POST');assert.equal(writes.length,1);
  assert.equal(writes[0].options.headers['X-Store-Domain-Csrf'],'csrf-test');assert.deepEqual(JSON.parse(writes[0].options.body),{provider:'INFOBIP'});
  assert.equal(new URL(writes[0].url,'http://localhost').searchParams.get('shop'),'shop.example');
  h.panel.close();h.release();await tick();assert.equal(h.panel.open,false);assert.notEqual(h.get('[data-store-domain-status]').textContent,'已验证');
 });
 test(`${module}: ambiguous POST failure requires a fresh GET before a manual retry`,async()=>{
  const h=harness(module);h.get('[data-store-domain-open]').fire('click');await tick();h.respond({httpStatus:503});
  h.get('[data-store-domain-verify]').fire('click');h.get('[data-store-domain-verify-confirm]').fire('click');await tick();
  assert.equal(h.get('[data-store-domain-verify]').disabled,true);assert.ok(h.get('[data-store-domain-message]').textContent.includes('先刷新查询状态'));
  h.get('[data-store-domain-verify]').fire('click');h.get('[data-store-domain-verify-confirm]').fire('click');await tick();
  assert.equal(h.calls.filter(c=>c.options.method==='POST').length,1);
  h.respond({provider:'INFOBIP',domain:'mail.example.com',status:'PENDING',dnsRecords:[]});
  h.get('[data-store-domain-check]').fire('click');await tick();assert.equal(h.get('[data-store-domain-verify]').disabled,false);
 });
 test(`${module}: GET query sends only shop/provider and safely renders public DNS records`,async()=>{
  const h=harness(module);h.get('[data-store-domain-open]').fire('click');await tick();
  assert.equal(h.calls.length,1);const query=new URL(h.calls[0].url,'http://localhost').searchParams;
  assert.equal(query.get('shop'),'shop.example');assert.equal(query.get('provider'),'INFOBIP');assert.equal(query.has('domain'),false);assert.equal(query.has('configVersion'),false);
  assert.equal(h.calls[0].options.method,'GET');assert.equal(h.get('[data-store-domain-status]').textContent,'已验证');
  assert.ok(h.allText().includes('<img src=x onerror=attack()>'));
 });
 test(`${module}: closing a dialog discards a late query response`,async()=>{
  const h=harness(module);h.hold();h.get('[data-store-domain-open]').fire('click');await tick();
  h.panel.close();h.release();await tick();
  assert.notEqual(h.get('[data-store-domain-status]').textContent,'已验证');
  assert.equal(h.panel.open,false);assert.equal(h.get('[data-store-domain-check]').disabled,false);
 });
 test(`${module}: mismatched domain response never populates DNS results`,async()=>{
  const h=harness(module);h.respond({provider:'INFOBIP',domain:'other.example',status:'VERIFIED',dnsRecords:[{host:'private.example',value:'other-store-data'}]});
  h.get('[data-store-domain-open]').fire('click');await tick();
  assert.equal(h.get('[data-store-domain-status]').textContent,'暂不可用');assert.ok(!h.allText().includes('other-store-data'));
 });
 for(const theme of ['shopify','shopify-theme2'])test(`${module}/${theme}: sender domain remains readonly with a permission-gated query dialog`,()=>{
  const base=path.join(root,'WEB-INF',theme),source=fs.readFileSync(path.join(base,'stores.jsp'),'utf8');
  assert.ok(source.includes('store-domain-verification.js?v=20261024-store-query'));
  assert.ok(source.includes('include file="fragments/sender-domain-verification.jspf"'));
  const fragment=fs.readFileSync(path.join(base,'fragments/sender-domain-verification.jspf'),'utf8');
  assert.ok(fragment.includes('pageEncoding="UTF-8"'));assert.ok(fragment.includes('data-store-domain-panel'));
  assert.ok(fragment.includes('刷新验证状态'));assert.ok(fragment.includes('仅重新查询状态'));
 });
}
