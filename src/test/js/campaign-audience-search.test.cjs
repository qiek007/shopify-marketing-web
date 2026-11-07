const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../../main/resources/META-INF/resources');
const script = fs.readFileSync(path.join(root, 'shopify/js/campaign-search-picker.js'), 'utf8');
function fixture() {
  class Element {
    constructor() { this.children=[]; this.hidden=true; this.value=''; this.textContent=''; this.attrs={}; }
    addEventListener(type, fn) { this[type]=fn; }
    setAttribute(key, value) { this.attrs[key]=value; }
    getAttribute(key) { return this.attrs[key] ?? null; }
    appendChild(child) { this.children.push(child); }
    replaceChildren() { this.children=[]; }
    dispatchEvent(event) { if(this[event.type]) this[event.type](event); }
    focus() {}
  }
  const trigger=new Element(), panel=new Element(), input=new Element(), list=new Element(), status=new Element(), label=new Element(), select=new Element();
  select.options=[{value:'',textContent:'不使用动态分群'},{value:'hk',textContent:'香港客户'},{value:'tw',textContent:'台湾客户'}]; select.value='hk';
  const picker={querySelector: s => ({'[data-picker-trigger]':trigger,'[data-picker-panel]':panel,'[data-picker-search]':input,'[data-picker-options]':list,'[data-picker-status]':status,'[data-picker-label]':label}[s]),contains:()=>true};
  const window={}; const document={createElement:()=>new Element(),addEventListener(){}};
  vm.runInNewContext(script,{window,document,Event:class {constructor(type){this.type=type;}},setTimeout,clearTimeout,Promise,Array});
  window.CampaignSearchPicker.create(picker,select,{includeEmpty:true,delay:0,load:()=>Promise.resolve(),match:(option,q)=>!q || !option.value || option.textContent.toLowerCase().includes(q.toLowerCase())});
  return {select,input,trigger,list,label,status};
}
test('searching segment options keeps selected form value and can select a match', async () => {
  const f=fixture(); f.trigger.click(); f.input.value='台湾'; f.input.input(); await new Promise(r=>setTimeout(r,20));
  assert.equal(f.select.value,'hk'); assert.deepEqual(f.list.children.map(x=>x.textContent),['不使用动态分群','台湾客户']);
  f.list.children[1].click(); assert.equal(f.select.value,'tw'); assert.equal(f.label.textContent,'台湾客户');
});
test('both themes add search fields without changing checkbox names', () => {
  for(const theme of ['shopify','shopify-theme2']) {
    const page=fs.readFileSync(path.join(root,'WEB-INF',theme,'campaign-editor.jsp'),'utf8');
    for(const marker of ['campaign-segment-picker','搜索客户分群','搜索包含标签','搜索排除标签','name="segmentId"','name="includeTags"','name="excludeTags"']) assert.ok(page.includes(marker),`${theme} missing ${marker}`);
  }
});
test('tag search filters independently and preserves checked hidden tags', () => {
  function picker() {
    const search={value:'',addEventListener(type,fn){this[type]=fn;}};
    const empty={hidden:true};
    const labels=[{textContent:'香港标签',hidden:false,checked:true},{textContent:'台湾标签',hidden:false,checked:false}];
    return {search,empty,labels,querySelector(s){return s==='[data-tag-search]'?search:empty;},querySelectorAll(){return labels;}};
  }
  const include=picker(), exclude=picker();
  const document={getElementById(){return null;},querySelectorAll(){return [include,exclude];}};
  const source=fs.readFileSync(path.join(root,'shopify/js/campaign-audience-search.js'),'utf8');
  vm.runInNewContext(source,{document,window:{},Array});
  include.search.value='台湾'; include.search.input();
  assert.equal(include.labels[0].hidden,true); assert.equal(include.labels[0].checked,true);
  assert.equal(include.labels[1].hidden,false); assert.equal(exclude.labels[0].hidden,false);
  include.search.value='不存在'; include.search.input(); assert.equal(include.empty.hidden,false);
  include.search.value=''; include.search.input(); assert.equal(include.labels[0].hidden,false);
  let prevented=false; include.search.keydown({key:'Enter',preventDefault(){prevented=true;}}); assert.equal(prevented,true);
});