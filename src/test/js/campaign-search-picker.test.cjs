const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function harness(module, includeEmpty = false) {
    const handlers = new Map();
    class Element {
        constructor() { this.children = []; this.hidden = true; this.value = ''; this.attributes = {}; this.textContent = ''; }
        addEventListener(type, fn) { this[type] = fn; }
        setAttribute(name, value) { this.attributes[name] = value; }
        getAttribute(name) { return this.attributes[name] ?? null; }
        appendChild(element) { this.children.push(element); return element; }
        replaceChildren() { this.children = []; }
        focus() { this.focused = true; }
        contains(element) { return this === element || this.children.includes(element); }
        dispatchEvent(event) { if (this[event.type]) this[event.type](event); }
    }
    const trigger = new Element(), panel = new Element(), input = new Element(), list = new Element(), status = new Element(), label = new Element();
    const select = new Element();
    select.options = [{value:'', textContent: includeEmpty ? '不使用优惠券' : '选择商品后加入'}, {value:'a', textContent:'商品 A'}];
    const root = new Element();
    root.querySelector = key => ({'[data-picker-trigger]':trigger,'[data-picker-panel]':panel,'[data-picker-search]':input,'[data-picker-options]':list,'[data-picker-status]':status,'[data-picker-label]':label}[key]);
    root.contains = e => [root,trigger,panel,input,list,status,label].includes(e) || list.children.includes(e);
    const document = {createElement: () => new Element(),addEventListener: (type,fn) => handlers.set(type,fn)};
    const window = {};
    const code = fs.readFileSync(path.resolve(__dirname, '../../..', 'src/main/resources/META-INF/resources/shopify/js/campaign-search-picker.js'), 'utf8');
    vm.runInNewContext(code, {window, document, Event: class {constructor(type) {this.type=type;}}, setTimeout, clearTimeout, Promise, Array});
    return {window,root,select,trigger,panel,input,list,status,label,handlers};
}

for (const module of ['public']) {
    test(`${module}: picker opens, searches, and selects without submitting the form`, async () => {
        const h = harness(module); let query = null; let selected = null;
        h.select.addEventListener('change', () => { selected = h.select.value; });
        h.window.CampaignSearchPicker.create(h.root, h.select, {load: q => {query=q; return Promise.resolve();}, includeEmpty:false, delay:0});
        h.trigger.click(); assert.equal(h.panel.hidden, false); assert.equal(h.input.focused, true);
        h.input.value='shoe'; h.input.input(); await new Promise(resolve => setTimeout(resolve,10));
        assert.equal(query,'shoe'); assert.equal(h.list.children.length,1);
        h.list.children[0].click(); assert.equal(selected,'a'); assert.equal(h.panel.hidden,true);
    });
    test(`${module}: discount may be cleared and Escape closes`, () => {
        const h = harness(module,true); h.select.value='a';
        h.window.CampaignSearchPicker.create(h.root,h.select,{load:()=>Promise.resolve(),includeEmpty:true,delay:0});
        h.trigger.click(); assert.equal(h.list.children.length,2);
        h.list.children[0].click(); assert.equal(h.select.value,'');
        h.trigger.click(); let prevented=false; h.input.keydown({key:'Escape',preventDefault(){prevented=true;}});
        assert.equal(prevented,true); assert.equal(h.panel.hidden,true);
    });
    test(`${module}: pending search clears old options and ignores stale completion`, async () => {
        const h = harness(module); const pending = [];
        h.window.CampaignSearchPicker.create(h.root,h.select,{load:q=>new Promise(resolve=>pending.push({q,resolve})),includeEmpty:false,delay:0});
        h.trigger.click(); h.input.value='old'; h.input.input(); assert.equal(h.list.children.length,0);
        await new Promise(resolve => setTimeout(resolve,10));
        h.input.value='new'; h.input.input(); await new Promise(resolve => setTimeout(resolve,10));
        assert.equal(pending.length,2);
        h.select.options=[{value:'',textContent:'选择商品后加入'},{value:'n',textContent:'新结果'}];
        pending[1].resolve(); await new Promise(resolve => setImmediate(resolve));
        assert.equal(h.list.children[0].textContent,'新结果');
        pending[0].resolve(); await new Promise(resolve => setImmediate(resolve));
        assert.equal(h.list.children[0].textContent,'新结果');
    });
    test(`${module}: search failure is visible and Enter does not submit`, async () => {
        const h = harness(module);
        h.window.CampaignSearchPicker.create(h.root,h.select,{load:()=>Promise.reject(new Error('failure')),includeEmpty:false,delay:0});
        h.trigger.click(); h.input.value='x'; h.input.input(); await new Promise(resolve => setTimeout(resolve,10));
        assert.equal(h.status.textContent,'查询失败，请重试');
        let prevented=false; h.input.keydown({key:'Enter',preventDefault(){prevented=true;}});
        assert.equal(prevented,true); assert.equal(h.select.value,'');
    });
    test(`${module}: no matching discount keeps clear choice and shows message`, async () => {
        const h = harness(module,true);
        h.window.CampaignSearchPicker.create(h.root,h.select,{load:()=>{h.select.options=[{value:'',textContent:'不使用优惠券'}]; return Promise.resolve();},includeEmpty:true,delay:0});
        h.trigger.click(); h.input.value='missing'; h.input.input(); await new Promise(resolve => setTimeout(resolve,10));
        assert.equal(h.list.children.length,1); assert.equal(h.status.textContent,'没有匹配结果'); assert.equal(h.status.hidden,false);
    });
    test(`${module}: Enter selects a matching discount instead of clearing it`, async () => {
        const h = harness(module,true); let selected=null;
        h.select.addEventListener('change', () => {selected=h.select.value;});
        h.window.CampaignSearchPicker.create(h.root,h.select,{load:()=>Promise.resolve(),includeEmpty:true,delay:0});
        h.trigger.click(); h.input.value='商品'; h.input.input(); await new Promise(resolve => setTimeout(resolve,10));
        h.input.keydown({key:'Enter',preventDefault(){}});
        assert.equal(selected,'a'); assert.equal(h.panel.hidden,true);
    });
    test(`${module}: Enter on no matches keeps the selected discount`, async () => {
        const h = harness(module,true); h.select.value='a'; let changes=0;
        h.select.addEventListener('change', () => {changes++;});
        const retained={value:'a',textContent:'当前已选 A',getAttribute:key=>key==='data-picker-retained'?'true':null};
        h.window.CampaignSearchPicker.create(h.root,h.select,{load:()=>{h.select.options=[{value:'',textContent:'不使用优惠券'},retained]; return Promise.resolve();},includeEmpty:true,delay:0});
        h.trigger.click(); h.input.value='missing'; h.input.input(); await new Promise(resolve => setTimeout(resolve,10));
        h.input.keydown({key:'Enter',preventDefault(){}});
        assert.equal(h.select.value,'a'); assert.equal(changes,0);
    });
    test(`${module}: choosing a product clears its search before reopening`, async () => {
        const h=harness(module);
        h.window.CampaignSearchPicker.create(h.root,h.select,{load:()=>Promise.resolve(),includeEmpty:false,delay:0});
        h.trigger.click(); h.input.value='shoe'; h.input.input(); await new Promise(resolve => setTimeout(resolve,10));
        h.list.children[0].click(); h.trigger.click();
        assert.equal(h.input.value,'');
    });
}

for (const module of ['public']) for (const theme of ['shopify','shopify-theme2']) {
    test(`${module}/${theme}: editing preserves fields and guards out-of-order results`, () => {
        const jsp=fs.readFileSync(path.resolve(__dirname,'../../..','src/main/resources/META-INF/resources/WEB-INF',theme,'campaign-editor.jsp'),'utf8');
        assert.match(jsp,/name="productSourceIds"/); assert.match(jsp,/name="discountSourceId"/);
        assert.match(jsp,/MAX_PRODUCTS = 12/); assert.match(jsp,/lookupVersion !== productLookupVersion/);
        assert.match(jsp,/lookupVersion !== discountLookupVersion/);
        assert.doesNotMatch(jsp,/campaign-(?:product|discount)-search-button/);
        assert.match(jsp,/campaign-channel-weights\.js\?v=20261105-range10/);
    });
}
