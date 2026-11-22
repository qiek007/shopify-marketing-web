const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const asset=path.resolve(__dirname,'../../main/resources/META-INF/resources/shopify/js/transactional-templates.js');
function library(){assert.ok(fs.existsSync(asset),'template editor script is implemented');const context={module:{exports:{}}};vm.runInNewContext(fs.readFileSync(asset,'utf8'),context);return context.module.exports;}
const fields={subject:'Verify',html:'<p>{{code}}</p>',text:'{{code}}'};
test('preview and editing remain functional when the redundant caption is absent',async()=>{
    const app=boot([{subject:'Preview',html:'<p>123456</p>',text:'123456'}],{omitCaption:true});
    app.editor.elements.subject.value='Unsaved';
    assert.doesNotThrow(()=>app.editor.listeners.input());
    const preview={disabled:false,closest(){return this;},hasAttribute(name){return name==='data-template-preview-button';}};
    await app.click(preview);
    assert.equal(app.nodes.message.textContent,'预览已更新。');
    assert.equal(app.nodes['preview-subject'].textContent,'Preview');
    assert.equal(app.editor.elements.subject.value,'Unsaved');
    assert.equal(app.publish.disabled,true);
    assert.equal(app.requests.length,1);assert.match(app.requests[0].url,/\/preview$/);
});
test('preview keeps the frame scrollable and disables only the email contents',()=>{
    const {safePreviewDocument}=library();
    const html=safePreviewDocument('<a href="https://example.invalid/verify">Verify</a><p>Long email</p>');
    assert.match(html,/<body><div inert style="display:contents">/);
    assert.match(html,/<\/div><\/body>/);
    assert.match(html,/default-src 'none'/);
    assert.match(html,/form-action 'none'/);
});
test('unsaved edits cannot be published, save enables the exact revision',()=>{const {createState}=library();const state=createState(fields,7,true);assert.equal(state.canPublish(fields),true);assert.equal(state.canPublish({...fields,text:'changed'}),false);state.saved({...fields,text:'changed'},8,true);assert.equal(state.canPublish({...fields,text:'changed'}),true);assert.equal(state.revision(),8);});
test('publish retries reuse one token and a newly saved revision gets a new token',()=>{const {createState}=library();let sequence=0;const state=createState(fields,7,true,()=>String(++sequence));assert.equal(state.token(),'1');assert.equal(state.token(),'1');state.saved(fields,8,true);assert.equal(state.token(),'2');});
test('a new language must be saved before publish and preview CSP blocks scripts and remote resources',()=>{const {createState,safePreviewDocument}=library();assert.equal(createState(fields,0,false).canPublish(fields),false);const html=safePreviewDocument('<img src="https://remote.invalid/x"><script>bad()</script>');assert.match(html,/default-src 'none'/);assert.match(html,/style-src 'unsafe-inline'/);assert.match(html,/img-src data:/);assert.match(html,/form-action 'none'/);assert.match(html,/base-uri 'none'/);assert.ok(html.indexOf('Content-Security-Policy')<html.indexOf('https://remote.invalid'));});

function boot(responses,options={}){
    function node(){return {textContent:'',disabled:false,hidden:false,dataset:{},children:[],attributes:new Set(),classList:{toggle(){}},listeners:{},setAttribute(k){this.attributes.add(k);},hasAttribute(k){return this.attributes.has(k);},addEventListener(k,fn){this.listeners[k]=fn;},appendChild(n){this.children.push(n);},replaceChildren(){this.children=[];},closest(){return this;}};}
    const names=['state','message','save-hint','default-locale','history','preview-subject','preview-text','preview-caption','preview'];const nodes={};for(const name of names)nodes[name]=node();
    const save=node(),preview=node(),publish=node(),rollback=node(),defaultButton=node();publish.attributes.add('data-template-publish');preview.attributes.add('data-template-preview-button');rollback.attributes.add('data-template-rollback');rollback.dataset.templateRollback='version1';
    const editor=node(),fieldset=node();editor.elements={};for(const [k,v] of Object.entries({...fields,shop:'shop.example',purpose:'CODE',locale:'en',_transactionalTemplateCsrf:'csrf'}))editor.elements[k]={value:v};editor.reportValidity=()=>true;editor.querySelector=()=>fieldset;
    const selection=node(),newLanguage=node(),localeSelect=node(),purposeSelect=node(),root=node();
    localeSelect.value='en';purposeSelect.value='CODE';
    for(const value of ['en','zh-CN']){const option=node();option.value=value;option.textContent=value;localeSelect.appendChild(option);}
    Object.defineProperty(localeSelect,'options',{get:()=>localeSelect.children});
    selection.elements={purpose:purposeSelect,locale:localeSelect};
    newLanguage.elements={purpose:{value:'CODE'},locale:{value:''}};newLanguage.attributes.add('data-template-new-language');
    root.dataset={canConfigure:'true',revision:'7',exists:'true',endpoint:'/stores/transactional-email/templates'};
    root.querySelector=s=>s==='[data-template-editor]'?editor:s==='[data-template-selection]'?selection:nodes[s.replace(/^\[data-(?:template-|preview-)/,'').replace(/\]$/,'')];
    root.querySelector=s=>({'[data-template-editor]':editor,'[data-template-selection]':selection,'[data-template-state]':nodes.state,'[data-template-message]':nodes.message,'[data-template-save-hint]':nodes['save-hint'],'[data-default-locale]':nodes['default-locale'],'[data-template-history]':nodes.history,'[data-preview-subject]':nodes['preview-subject'],'[data-preview-text]':nodes['preview-text'],'[data-preview-caption]':options.omitCaption?null:nodes['preview-caption'],'[data-template-preview]':nodes.preview,'[data-template-new-language]':newLanguage,'#template-locale':localeSelect,'#template-purpose':purposeSelect})[s];
    root.querySelectorAll=s=>s==='[data-template-selection]'?[selection,newLanguage]:s.includes('rollback')?[publish,rollback]:[save,preview,defaultButton];
    const requests=[];const context={module:{exports:{}},document:{querySelector:()=>root,createElement:node},window:{confirm:()=>options.confirm!==false,addEventListener(){}},crypto:{randomUUID:(()=>{let n=0;return ()=>'uuid-'+ ++n;})()},URLSearchParams,fetch:async(url,options)=>{requests.push({url,params:new URLSearchParams(options.body)});const result=responses.shift();if(result instanceof Error)throw result;return {ok:!result.httpStatus || result.httpStatus < 400,status:result.httpStatus || 200,json:async()=>{if(result.invalidJson)throw new SyntaxError('not JSON');return result;}};}};
    vm.runInNewContext(fs.readFileSync(asset,'utf8'),context);
    return {nodes,editor,publish,rollback,requests,selection,newLanguage,localeSelect,purposeSelect,submitSelection:form=>{let prevented=false;const handler=form.listeners.submit;if(typeof handler!=='function')return {handled:false,prevented};handler({currentTarget:form,preventDefault(){prevented=true;}});return {handled:true,prevented};},click:async button=>{root.listeners.click({target:button});await new Promise(setImmediate);}};
}
function workspace(status,revision=7){return {defaultLocale:'en',draft:{...fields,revision,exists:true},versions:[],publicationStatus:status};}
test('new language is a separate GET navigation and follows the selected purpose without altering the editor',()=>{
    const app=boot([]);app.purposeSelect.value='LINK';app.newLanguage.elements.locale.value=' ja ';
    const result=app.submitSelection(app.newLanguage);
    assert.equal(result.handled,true);assert.equal(result.prevented,false);
    assert.equal(app.newLanguage.elements.purpose.value,'LINK');
    assert.equal(app.newLanguage.elements.locale.value,'ja');
    assert.equal(app.editor.elements.locale.value,'en');assert.equal(app.editor.elements.purpose.value,'CODE');
    assert.equal(app.requests.length,0);
});
test('both language forms guard unsaved content when navigation is cancelled',()=>{
    for(const formName of ['selection','newLanguage']){
        const app=boot([],{confirm:false});app.editor.elements.subject.value='Unsaved';app.editor.listeners.input();
        app.localeSelect.value='zh-CN';app.newLanguage.elements.locale.value='ja';
        const result=app.submitSelection(app[formName]);
        assert.equal(result.handled,true);assert.equal(result.prevented,true);
        assert.equal(app.editor.elements.subject.value,'Unsaved');assert.equal(app.editor.elements.locale.value,'en');
        assert.equal(app.requests.length,0);
    }
});
test('new-language form rejects blank or existing tags without saving anything',()=>{
    for(const tag of ['','  ','zh-CN',' zh_cn ','en','bad/tag','x','e'.repeat(36)]){
        const app=boot([]);app.newLanguage.elements.locale.value=tag;
        const result=app.submitSelection(app.newLanguage);
        assert.equal(result.handled,true);assert.equal(result.prevented,true);
        assert.match(app.nodes.message.textContent,/语言/);assert.equal(app.requests.length,0);
    }
});
test('saving refreshes the full language list while keeping the actual editor context',async()=>{
    const result={...workspace(undefined,8),locale:'en',locales:['en','zh-CN','ja']};
    const app=boot([result]);app.localeSelect.value='zh-CN';
    app.editor.listeners.submit({preventDefault(){}});await new Promise(setImmediate);
    assert.deepEqual(app.localeSelect.options.map(o=>o.value),['en','zh-CN','ja']);
    assert.equal(app.localeSelect.value,'zh-CN');assert.equal(app.editor.elements.locale.value,'en');
    assert.equal(app.requests[0].params.get('locale'),'en');
});
test('both language forms stay on the current editor while a write is pending',async()=>{
    let finish;const pending=new Promise(resolve=>{finish=resolve;});
    const app=boot([pending]);await app.click(app.publish);
    app.newLanguage.elements.locale.value='ja';
    assert.equal(app.submitSelection(app.selection).prevented,true);
    assert.equal(app.submitSelection(app.newLanguage).prevented,true);
    assert.equal(app.editor.elements.locale.value,'en');
    finish(workspace('PUBLISHED',8));await new Promise(setImmediate);
    assert.equal(app.requests.length,1);
});
test('preview posts current unsaved content without saving and uses isolated srcdoc with text-only subject',async()=>{const app=boot([{subject:'<img onerror=bad()>',html:'<p>123456</p>',text:'123456'}]);app.editor.elements.subject.value='Unsaved';app.editor.listeners.input();const preview={disabled:false,closest(){return this;},hasAttribute(name){return name==='data-template-preview-button';}};await app.click(preview);assert.equal(app.requests.length,1);assert.match(app.requests[0].url,/\/preview$/);assert.equal(app.requests[0].params.get('subject'),'Unsaved');assert.equal(app.nodes['preview-subject'].textContent,'<img onerror=bad()>');assert.match(app.nodes.preview.srcdoc,/default-src 'none'/);assert.equal(app.publish.disabled,true);});
test('failed publication remains visible and a retry reuses publication token',async()=>{const app=boot([workspace('FAILED'),workspace('PUBLISHED',8)]);await app.click(app.publish);assert.match(app.nodes.message.textContent,/发布未生效/);assert.doesNotMatch(app.nodes.message.textContent,/模板已发布/);await app.click(app.publish);assert.equal(app.requests[0].params.get('publicationToken'),app.requests[1].params.get('publicationToken'));assert.equal(app.nodes.message.textContent,'模板已发布。');});
test('stale publication preserves current inputs and disables publish and rollback until reload',async()=>{const other=workspace('STALE',8);other.draft.subject='Someone else';const app=boot([other]);await app.click(app.publish);assert.match(app.nodes.message.textContent,/草稿已有更新/);assert.equal(app.editor.elements.subject.value,'Verify');assert.equal(app.publish.disabled,true);assert.equal(app.rollback.disabled,true);});

test('HTTP 200 HTML or missing workspace is not reported as successful and keeps retry token',async()=>{for(const invalid of [{invalidJson:true},{}]){const app=boot([invalid,workspace('PUBLISHED',8)]);await app.click(app.publish);assert.doesNotMatch(app.nodes.message.textContent,/模板已发布/);assert.match(app.nodes.message.textContent,/未确认|无效/);assert.equal(app.editor.elements.subject.value,'Verify');await app.click(app.publish);assert.equal(app.requests[0].params.get('publicationToken'),app.requests[1].params.get('publicationToken'));assert.equal(app.nodes.message.textContent,'模板已发布。');}});

test('rollback accepts a complete workspace without publicationStatus',async()=>{const app=boot([workspace(undefined,8)]);await app.click(app.rollback);assert.equal(app.nodes.message.textContent,'所选版本已重新发布。');assert.equal(app.requests[0].params.get('versionId'),'version1');});

test('history only offers rollback for successfully published inactive versions',async()=>{const result=workspace('PUBLISHED',8);result.versions=[{versionId:'failed',versionNumber:1,status:'FAILED',active:false},{versionId:'stale',versionNumber:2,status:'STALE',active:false},{versionId:'published',versionNumber:3,status:'PUBLISHED',active:false},{versionId:'active',versionNumber:4,status:'PUBLISHED',active:true}];const app=boot([result]);await app.click(app.publish);const buttons=app.nodes.history.children.flatMap(row=>row.children[4].children);assert.equal(buttons.length,1);assert.equal(buttons[0].dataset.templateRollback,'published');});
test('validation errors show exact safe details and keep unsaved fields and retry tokens',async()=>{
    const detail='HTML 元素 <table> 的样式不支持属性「position」。';
    const app=boot([{httpStatus:400,message:detail},{httpStatus:409,message:'草稿修订号已变化，请刷新后重试。'}]);
    app.editor.elements.html.value='<p style="position:fixed">{{code}}</p>';app.editor.listeners.input();
    const preview={disabled:false,closest(){return this;},hasAttribute(name){return name==='data-template-preview-button';}};
    await app.click(preview);assert.equal(app.nodes.message.textContent,detail);
    assert.equal(app.editor.elements.html.value,'<p style="position:fixed">{{code}}</p>');
    assert.equal(app.publish.disabled,true);
    const conflict=boot([{httpStatus:409,message:'草稿修订号已变化，请刷新后重试。'}]);
    await conflict.click(conflict.publish);assert.equal(conflict.nodes.message.textContent,'草稿修订号已变化，请刷新后重试。');
    assert.equal(conflict.editor.elements.subject.value,'Verify');assert.equal(conflict.publish.disabled,true);
});
test('internal server failures do not expose raw response messages and retain publication token',async()=>{
    const app=boot([{httpStatus:500,message:'SECRET_PROVIDER_BODY SQL password=secret'},workspace('PUBLISHED',8)]);
    await app.click(app.publish);assert.doesNotMatch(app.nodes.message.textContent,/SECRET_PROVIDER_BODY|password=| SQL /);
    await app.click(app.publish);assert.equal(app.requests[0].params.get('publicationToken'),app.requests[1].params.get('publicationToken'));
});
