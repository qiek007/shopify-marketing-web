const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

{
 for (const theme of ['shopify','shopify-theme2']) {
  test('public/' + theme + ': syncing never enables export; actual results do', async () => {
   const root=path.resolve(__dirname,'../../main/resources/META-INF/resources/WEB-INF',theme);
   const source=fs.readFileSync(path.join(root,'campaign-detail.jsp'),'utf8');
   const fragment=fs.readFileSync(path.join(root,'fragments/campaign-recipient-results.jsp'),'utf8');
   assert.ok(fragment.indexOf("recipientReadState eq 'SYNCHRONIZING'") < fragment.indexOf('empty recipientPage.items'));
   const start=source.indexOf('function loadRecipients(page)');
   const end=source.indexOf('var recipientExportPanel',start);
   assert.ok(start>=0 && end>start);
   assert.ok(fragment.includes("recipientReadState eq 'UPDATING'"));
   assert.ok(fragment.includes("recipientReadState eq 'PARTIAL'"));
   assert.ok(fragment.includes('data-campaign-recipient-incomplete'));
   assert.ok(fragment.includes("recipientReadState eq 'CURRENT'"));
   assert.ok(fragment.includes("recipientReadReason eq 'EXPIRY_AUDIT_FAILED'"));
   assert.ok(fragment.includes('可导出当前查询快照'));
   assert.ok(fragment.includes('不阻止到期热数据清理'));
   assert.ok(fragment.includes('当前可用数据中没有匹配记录'));
   const partialEmpty=fragment.slice(fragment.indexOf('empty recipientPage.items and'),
       fragment.indexOf('<c:when test="${empty recipientPage.items}">'));
   assert.ok(partialEmpty.includes('data-campaign-recipient-page'));
   for(const scenario of ['syncing','updating','partial','current','result','failure']) {
    let enabled=true;
    const html=scenario==='syncing'?'<div data-campaign-recipient-syncing>正在同步</div>':
        ['updating','partial'].includes(scenario)?'<div data-campaign-recipient-incomplete>部分可用</div><table>rows</table>':
        scenario==='current'?'<div role="status">活动有效期内，已展示当前数据</div><table>rows</table>':'<table>rows</table>';
    const host={innerHTML:'',setAttribute(){},removeAttribute(){},querySelector(selector){
      return ['data-campaign-recipient-syncing','data-campaign-recipient-incomplete']
        .some(marker=>selector.includes(marker)&&this.innerHTML.includes(marker))?{}:null;
    }};
    const context={recipientForm:{action:'/campaigns/detail/recipients'},recipientHost:host,recipientRequest:null,
     AbortController,URLSearchParams,FormData:class{constructor(){return [];}},
     fetch:async()=>({ok:scenario!=='failure',status:scenario==='failure'?500:200,text:async()=>html}),
     markRecipientExportQueried(){enabled=true;},markRecipientExportUnqueried(){enabled=false;}};
    vm.runInNewContext(source.slice(start,end)+'\nloadRecipients(1);',context);
    await new Promise(setImmediate);
    assert.equal(enabled,scenario==='result'||scenario==='current');
    if(scenario==='failure')assert.ok(host.innerHTML.includes('执行明细加载失败'));
    else assert.equal(host.innerHTML,html);
   }
  });
 }
}
