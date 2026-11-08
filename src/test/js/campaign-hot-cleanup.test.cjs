const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../../main/resources/META-INF/resources/shopify/js/campaign-hot-cleanup.js'), 'utf8');
function setup(confirmed) {
  let handler, warning, requests = [];
  const button = {disabled:false, addEventListener:(_, fn) => {handler = fn;}};
  const message = {textContent:''};
  const panel = {dataset:{base:'/campaigns/detail/hot-cleanup',shop:'s',campaign:'c'},querySelector:s => s.includes('preview') ? button : message};
  const response = (body, token) => ({ok:true,json:async()=>body,headers:{get:()=>token}});
  const fetch = async (url, options) => {requests.push({url:String(url),options});return requests.length===1 ? response({expected:1908,observed:1109,hotCount:1908,fingerprint:'review',explanation:'通道接收事件 1908 / 1108'},'csrf') : response({accepted:true},null);};
  vm.runInNewContext(source,{document:{querySelectorAll:()=>[panel]},window:{location:{href:'http://localhost/'},confirm:text=>{warning=text;return confirmed;}},URL,URLSearchParams,fetch});
  return {run:()=>handler(),requests,button,message,warning:()=>warning};
}
test('cancelling the warning never submits a cleanup request',async()=>{
  const ui=setup(false);await ui.run();assert.equal(ui.requests.length,1);assert.match(ui.message.textContent,/取消/);assert.equal(ui.button.disabled,false);
});
test('confirmation submits only the reviewed fingerprint with CSRF',async()=>{
  const ui=setup(true);await ui.run();assert.equal(ui.requests.length,2);assert.match(ui.warning(),/通道接收事件 1908 \/ 1108/);assert.equal(ui.requests[1].options.method,'POST');assert.equal(ui.requests[1].options.headers['X-Hot-Cleanup-Csrf'],'csrf');assert.equal(ui.requests[1].options.body,'fingerprint=review');assert.match(ui.message.textContent,/后台/);
});
