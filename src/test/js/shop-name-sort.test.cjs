const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function harness(module){
 const events={},storage=new Map(),navigations=[];
 const values=[['吉客印神龙','selected'],['店铺10','ten'],['阿店铺','z-domain'],['店铺2','two'],['','zebra'],['Me-店铺','me'],['（开发）自建站','dev'],['阿店铺','a-domain']];
 const options=values.map(([name,value])=>({value,textContent:name||'Zebra',hidden:false,disabled:false,getAttribute:k=>k==='data-shop-name'?name:null}));
 const select={options,value:'selected',closest:()=>form,appendChild(option){options.splice(options.indexOf(option),1);options.push(option);}};
 for(const option of options)Object.defineProperty(option,'selected',{get:()=>option.value===select.value});
 const empty={hidden:true};const input={value:'',closest:s=>s==='[data-shop-switcher-search]'?input:form};
 const form={querySelector:s=>s==='[data-shop-switcher-select]'?select:s==='[data-shop-search-empty]'?empty:null,getAttribute:()=> 'shop-test'};
 const document={currentScript:{getAttribute:()=>'/app'},getElementById:()=>null,querySelector:s=>s==='[data-shop-switcher]'?form:s==='[data-shop-switcher-select]'?select:null,querySelectorAll:()=>[],addEventListener:(event,handler)=>{events[event]=handler;}};
 const window={fetch(){},DOMParser:function(){},AbortController,location:{href:'http://localhost/app/dashboard?shop=selected',origin:'http://localhost',pathname:'/app/dashboard',assign:url=>navigations.push(url)},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},addEventListener(){}};
 const source=fs.readFileSync(path.resolve(__dirname,'../../main/resources/META-INF/resources/shopify/js/console-navigation.js'),'utf8');
 vm.runInNewContext(source,{window,document,URL,Intl,AbortController,Array,Promise});return {select,events,input,empty,navigations};
}
{ const module='public';
 test(`${module}: shop options use Chinese name collation and natural numbers without switching shops`,()=>{
  const h=harness(module),collator=new Intl.Collator('zh-CN',{numeric:true,sensitivity:'base',ignorePunctuation:true});
  const labels=h.select.options.map(o=>o.getAttribute('data-shop-name')||o.textContent);
  assert.deepEqual(labels,[...labels].sort(collator.compare));
  const ids=h.select.options.map(o=>o.value);assert.ok(ids.indexOf('two')<ids.indexOf('ten'));
  assert.ok(ids.indexOf('a-domain')<ids.indexOf('z-domain'));
  assert.equal(h.select.value,'selected');assert.equal(h.navigations.length,0);
 });
 test(`${module}: search and clearing search retain the name order and current selection`,()=>{
  const h=harness(module),before=h.select.options.map(o=>o.value);
  h.input.value='店铺';h.events.input({target:h.input});
  assert.equal(h.select.value,'selected');assert.equal(h.select.options.find(o=>o.value==='selected').hidden,false);
  h.input.value='not-a-match';h.events.input({target:h.input});assert.equal(h.empty.hidden,false);
  h.events.keydown({target:h.input,key:'Escape'});
  assert.deepEqual(h.select.options.map(o=>o.value),before);
  assert.ok(h.select.options.every(o=>!o.hidden&&!o.disabled));
 });
}
