const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const script = path.join(__dirname, '../../main/resources/META-INF/resources/shopify/mobile/automations.js');
const page = path.join(__dirname, '../../main/resources/META-INF/resources/WEB-INF/mobile/automations.jsp');
function api() { assert.ok(fs.existsSync(script), 'automation script must exist'); return require(script); }
const complete = {automationId:'a1', name:'欢迎', journeyType:'POST_PURCHASE', triggerEvent:'CHECKOUT_COMPLETED', waitMinutes:30, templateId:'t1', provider:'MAILGUN', exitOnPurchase:true, frequencyDays:7, couponMode:'NONE', status:'ACTIVE', utmSource:'auw', utmMedium:'email', utmCampaign:'x', utmContent:'y'};
test('editing requires all meaningful fields and preserves existing coupon values', () => {
    const a = api();
    assert.equal(a.editableDefinition(complete), true);
    assert.equal(a.editableDefinition({...complete, frequencyDays:undefined}), false);
    assert.equal(a.editableDefinition({...complete, couponMode:'AUTO_GENERATE'}), false);
    assert.equal(a.editableDefinition({...complete, couponMode:'FIXED_CODE', discountSourceId:''}), false);
    assert.equal(a.editableDefinition({...complete, couponMode:'FIXED_CODE', discountSourceId:'d1', couponValue: 3}), true);
    assert.equal(a.editableDefinition({...complete, couponValue: 0.12345678901234568}), false);
    assert.equal(a.editableDefinition({...complete, utmCampaign: {bad:true}}), false);
    assert.equal(a.editableDefinition({...complete, status:'UNKNOWN'}), false);
    assert.equal(a.editStatus('ACTIVE'), 'ACTIVE');
    assert.equal(a.editStatus('PAUSED'), 'PAUSED');
    assert.equal(a.editStatus('DRAFT'), 'PAUSED');
});
test('cancelled action remains usable and accepted action blocks duplicates', () => {
    const a = api(); let accepted = false;
    const button = {disabled:true};
    const form = {dataset:{confirmMessage:'确认？'}, querySelectorAll:() => [button], addEventListener(n,f){this[n]=f;}};
    const reset = a.guardForms([form], () => accepted);
    assert.equal(button.disabled, false);
    let e = {prevented:false, preventDefault(){this.prevented=true;}}; form.submit(e);
    assert.equal(e.prevented,true); assert.equal(button.disabled,false);
    accepted = true; e = {prevented:false, preventDefault(){this.prevented=true;}}; form.submit(e);
    assert.equal(e.prevented,false); assert.equal(button.disabled,true);
    const repeated = {prevented:false, preventDefault(){this.prevented=true;}}; form.submit(repeated);
    assert.equal(repeated.prevented,true); reset(); assert.equal(button.disabled,false);
});
test('editor cannot submit incomplete or unavailable rule data', () => {
    const a = api(); let prompts = 0;
    const button = {disabled:true};
    const form = {dataset:{confirmMessage:'确认？', requiresReady:'true', ready:'false'}, querySelectorAll:() => [button], addEventListener(n,f){this[n]=f;}};
    a.guardForms([form], () => { prompts++; return true; });
    const event = {prevented:false, preventDefault(){this.prevented=true;}};
    form.submit(event);
    assert.equal(event.prevented,true);
    assert.equal(button.disabled,false);
    assert.equal(prompts,0);
});
test('mobile page keeps full editable rule fields and defaults new rules to disabled', () => {
    assert.ok(fs.existsSync(page)); const html = fs.readFileSync(page,'utf8');
    for (const field of ['name','journeyType','triggerEvent','waitMinutes','frequencyDays','templateId','provider','couponMode','couponValue','discountSourceId','utmSource','utmMedium','utmCampaign','utmContent','exitOnPurchase','status']) assert.match(html,new RegExp('name="'+field+'"'));
    assert.match(html, /name="status"[^>]*value="PAUSED"/);
    assert.match(html, /\/mobile\/automations\/action/);
    assert.match(html, /\/automations\/detail/);
});
test('the template selector offers only published templates', () => {
    const html=fs.readFileSync(page,'utf8');
    assert.match(html, /<c:forEach items="\$\{templates\}" var="template">\s*<c:if test="\$\{template.status eq 'PUBLISHED'\}">\s*<option/);
});

function mountFixture() {
    const a = api(); const requests = [];
    function node() { return {hidden:false, disabled:false, dataset:{}, textContent:'', handlers:{}, children:[], appendChild(child){this.children.push(child);}, replaceChildren(){this.children=[];}, addEventListener(n, f){this.handlers[n]=f;}, click(){this.handlers.click();}, focus(options){this.focusOptions=options;}, scrollIntoView(options){this.scrollOptions=options;}, querySelectorAll(){return [];}}; }
    const buttons = {edit:node(), view:node(), create:node(), close:node(), detailClose:node(), prev:node(), next:node(), couponSearch:node()};
    buttons.edit.dataset.id = 'old-active';
    buttons.edit.closest = () => ({dataset:{id:buttons.edit.dataset.id}});
    buttons.edit.hasAttribute = () => true;
    buttons.view.dataset.id='other';
    buttons.view.closest = () => ({dataset:{id:buttons.view.dataset.id}});
    buttons.view.hasAttribute = () => false;
    const option = (value, sender) => ({value, dataset:{sender:sender || ''}});
    const fields = {};
    for (const name of ['automationId','status','name','waitMinutes','frequencyDays','utmSource','utmMedium','utmCampaign','utmContent','couponValue','exitOnPurchase']) fields[name] = {value:'', checked:false, addEventListener(){}};
    for (const [name, values] of Object.entries({journeyType:['POST_PURCHASE'], triggerEvent:['CHECKOUT_COMPLETED'], templateId:['','t1'], provider:['','MAILGUN'], couponMode:['NONE','FIXED_CODE'], discountSourceId:['']})) fields[name] = {value:values[0], options:values.map(v=>option(v)), selectedOptions:[option('', '')], addEventListener(){}};
    const save = {disabled:true};
    const editorForm = node(); editorForm.elements=fields; editorForm.dataset={}; editorForm.querySelectorAll=()=>[save]; editorForm.querySelector=()=>save; editorForm.reset=()=>{fields.couponMode.value='NONE'; fields.status.value='PAUSED'; fields.automationId.value='';};
    const filter=node();filter.elements={q:{value:''},lifecycle:{value:'ALL'}};
    const nodes = {'[data-automation-detail]':node(), '[data-detail-content]':node(), '[data-detail-state]':node(), '[data-detail-filter]':filter, '[data-detail-name]':node(), '[data-detail-definition]':node(), '[data-detail-metrics]':node(), '[data-detail-ga4]':node(), '[data-detail-journeys]':node(), '[data-journey-page]':node(), '[data-automation-editor]':node(), '[data-automation-editor-form]':editorForm, '[data-automation-new]':buttons.create, '[data-detail-close]':buttons.detailClose, '[data-journey-prev]':buttons.prev, '[data-journey-next]':buttons.next, '[data-editor-close]':buttons.close, '[data-coupon-search]':buttons.couponSearch, '[data-editor-error]':node(), '[data-editor-title]':node(), '[data-editor-status]':node(), '[data-sender-preview]':node(), '[data-coupon-fields]':node()};
    const root = node(); root.dataset={shop:'demo',detailUrl:'/automations/detail',createUrl:'/mobile/automations',updateUrl:'/mobile/automations/update'};
    root.querySelector = selector => nodes[selector];
    root.querySelectorAll = selector => selector === '[data-automation-action]' ? [editorForm] : selector === '[data-automation-view], [data-automation-edit]' ? [buttons.edit, buttons.view] : [];
    const win={document:{querySelector:()=>root,createElement:()=>node()}, confirm:()=>true, addEventListener(){}, fetch(url){return new Promise((resolve,reject)=>requests.push({url,resolve,reject}));}};
    a.mount(win);
    return {buttons, requests, editorForm, editor:nodes['[data-automation-editor]'], error:nodes['[data-editor-error]'], detail:nodes['[data-automation-detail]'], content:nodes['[data-detail-content]'], filter};
}
function response(definition) { return {status:200, ok:true, redirected:false, headers:{get:()=> 'application/json'}, json:async()=>({definition, journeys:{items:[],page:1,totalPages:2}})}; }
async function drain() { await new Promise(resolve => setImmediate(resolve)); }
test('late edit response cannot replace a newly opened creation form', async () => {
    const f=mountFixture(); f.buttons.edit.click(); f.buttons.create.click();
    assert.equal(f.editorForm.action,'/mobile/automations');
    f.requests[0].resolve(response(complete)); await drain();
    assert.equal(f.editorForm.action,'/mobile/automations');
    assert.equal(f.editorForm.elements.automationId.value,'');
    assert.equal(f.editorForm.elements.status.value,'PAUSED');
});
test('late edit failure cannot reopen or alter a closed creation form', async () => {
    const f=mountFixture(); f.buttons.edit.click(); f.buttons.create.click(); f.buttons.close.click();
    f.requests[0].reject(new Error('old failure')); await drain();
    assert.equal(f.editor.hidden,true);
    assert.equal(f.editorForm.dataset.ready,'false');
});
test('switching to a detail view invalidates the pending editor and hides its form', async () => {
    const f=mountFixture(); f.buttons.edit.click(); f.buttons.view.click();
    f.requests[0].resolve(response(complete)); await drain();
    assert.equal(f.editor.hidden,true);
    assert.equal(f.editorForm.dataset.ready,'false');
});
test('later edit request wins when two rule responses arrive out of order', async () => {
    const f=mountFixture(); f.buttons.edit.click(); f.buttons.edit.dataset.id='newer'; f.buttons.edit.click();
    f.requests[1].resolve(response({...complete,automationId:'newer',name:'新规则'})); await drain();
    f.requests[0].resolve(response({...complete,automationId:'old-active',name:'旧规则'})); await drain();
    assert.equal(f.editorForm.elements.automationId.value,'newer');
    assert.equal(f.editorForm.elements.name.value,'新规则');
});
test('an existing rule with an unavailable template is kept read-only', async () => {
    const f=mountFixture(); f.buttons.edit.click();
    f.requests[0].resolve(response({...complete,templateId:'unpublished'})); await drain();
    assert.equal(f.editor.hidden,false);
    assert.equal(f.editorForm.hidden,true);
    assert.equal(f.editorForm.dataset.ready,'false');
    assert.match(f.error.textContent,/不可用/);
});

test('event labels use the established Chinese names and preserve unknown values', () => {
    const a=api();
    for (const [event,label] of Object.entries({PAGE_VIEWED:'浏览页面',CLICKED:'点击页面',PRODUCT_VIEWED:'查看商品',SEARCH_SUBMITTED:'提交搜索',PRODUCT_ADDED_TO_CART:'加入购物车',CHECKOUT_STARTED:'开始结账',CHECKOUT_COMPLETED:'完成结账'})) assert.equal(a.eventLabel(event),label);
    assert.equal(a.eventLabel('NEW_EVENT'),'NEW_EVENT');
    const html=fs.readFileSync(page,'utf8');
    assert.equal((html.match(/event eq 'PAGE_VIEWED'/g)||[]).length,2);
});

test('journey times format numeric seconds and milliseconds in the requested timezone', () => {
    const a=api();
    assert.equal(a.formatTime(1700000000,'en-US','UTC'),a.formatTime(1700000000000,'en-US','UTC'));
    assert.match(a.formatTime(1700000000,'en-US','UTC'),/2023/);
    assert.match(a.formatTime(0,'en-US','UTC'),/1970/);
    assert.equal(a.formatTime(null,'en-US','UTC'),'—');
    assert.equal(a.formatTime(undefined,'en-US','UTC'),'—');
    assert.equal(a.formatTime('invalid','en-US','UTC'),'—');
});

test('customer links escape shop and customer identifiers and omit links without an ID', () => {
    const a=api(); const doc={createElement(tag){return {tagName:tag,textContent:'',href:''};}};
    const link=a.customerElement(doc,'/ctx/mobile/customers/detail','shop.test','id&next=/bad','<Customer>');
    const url=new URL(link.href,'https://example.test');
    assert.equal(link.tagName,'a'); assert.equal(link.textContent,'<Customer>');
    assert.equal(url.pathname,'/ctx/mobile/customers/detail');
    assert.equal(url.searchParams.get('customerId'),'id&next=/bad');
    assert.equal(url.searchParams.get('shop'),'shop.test');
    const missing=a.customerElement(doc,'/ctx/mobile/customers/detail','shop.test',null,'Anonymous');
    assert.equal(missing.tagName,'strong'); assert.equal(missing.textContent,'Anonymous');
});

test('closing the creation editor returns focus to the create button', () => {
    const f=mountFixture(); f.buttons.create.click(); f.buttons.close.click();
    assert.equal(f.editor.hidden,true);
    assert.deepEqual(f.buttons.create.focusOptions,{preventScroll:true});
    assert.deepEqual(f.buttons.create.scrollOptions,{block:'center',behavior:'smooth'});
});
test('closing details returns focus to the view button', () => {
    const f=mountFixture(); f.buttons.view.click(); f.buttons.detailClose.click();
    assert.deepEqual(f.buttons.view.focusOptions,{preventScroll:true});
    assert.deepEqual(f.buttons.view.scrollOptions,{block:'center',behavior:'smooth'});
});
test('closing an editor returns focus to the rule edit button', async () => {
    const f=mountFixture(); f.buttons.edit.click(); f.requests[0].resolve(response(complete)); await drain(); f.buttons.close.click();
    assert.deepEqual(f.buttons.edit.focusOptions,{preventScroll:true});
    assert.deepEqual(f.buttons.edit.scrollOptions,{block:'center',behavior:'smooth'});
});
test('returning focus remains usable when an older WebView rejects options', () => {
    const f=mountFixture(); let focusFallback=false, scrollFallback=false;
    f.buttons.create.focus=options=>{if(options)throw new TypeError('options unsupported'); focusFallback=true;};
    f.buttons.create.scrollIntoView=options=>{if(options)throw new TypeError('options unsupported'); scrollFallback=true;};
    f.buttons.create.click(); f.buttons.close.click();
    assert.equal(focusFallback,true); assert.equal(scrollFallback,true);
});

test('editing another rule hides the previously loaded detail and its content', async () => {
    const f=mountFixture(); f.buttons.view.dataset.id='A'; f.buttons.view.click();
    f.requests[0].resolve(response({...complete,automationId:'A'})); await drain();
    assert.equal(f.detail.hidden,false); assert.equal(f.content.hidden,false);
    f.buttons.edit.dataset.id='B'; f.buttons.edit.click();
    assert.equal(f.detail.hidden,true); assert.equal(f.content.hidden,true);
    assert.equal(new URL(f.requests[1].url,'https://example.test').searchParams.get('automationId'),'B');
});

test('a newly opened rule resets journey filters while query and paging retain them', async () => {
    const f=mountFixture(); f.buttons.view.dataset.id='A'; f.buttons.view.click();
    f.requests[0].resolve(response({...complete,automationId:'A'})); await drain();
    f.filter.elements.q.value='alice'; f.filter.elements.lifecycle.value='DELIVERED';
    f.filter.handlers.submit({preventDefault(){}});
    let query=new URL(f.requests[1].url,'https://example.test').searchParams;
    assert.equal(query.get('q'),'alice'); assert.equal(query.get('lifecycle'),'DELIVERED');
    f.requests[1].resolve(response({...complete,automationId:'A'})); await drain();
    f.buttons.next.click(); query=new URL(f.requests[2].url,'https://example.test').searchParams;
    assert.equal(query.get('q'),'alice'); assert.equal(query.get('lifecycle'),'DELIVERED'); assert.equal(query.get('page'),'2');
    f.buttons.view.dataset.id='B'; f.buttons.view.click();
    query=new URL(f.requests[3].url,'https://example.test').searchParams;
    assert.equal(query.get('automationId'),'B'); assert.equal(query.get('q'),''); assert.equal(query.get('lifecycle'),'ALL');
});
