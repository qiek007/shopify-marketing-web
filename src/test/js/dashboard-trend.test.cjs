const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../../main/resources/META-INF/resources');
const tick=()=>new Promise(setImmediate);
function harness(module){
 class E{
  constructor(name){this.name=name;this.children=[];this.attributes={};this.listeners={};this.dataset={};this.style={};this.hidden=false;this.textContent='';this.clientWidth=1200;this.clientHeight=500;this.offsetHeight=220;}
  appendChild(child){this.children.push(child);return child;}
  replaceChildren(){this.children=[];}
  setAttribute(key,value){this.attributes[key]=value;}
  hasAttribute(key){return key==='data-trend-default-collapsed';}
  addEventListener(key,fn){this.listeners[key]=fn;}
  getBoundingClientRect(){return {left:0,top:0,width:1600};}
 }
 const nodes=new Map(),get=s=>{if(!nodes.has(s))nodes.set(s,new E(s));return nodes.get(s);};
 const panel=new E('root');panel.dataset={shop:'shop.example',trendUrl:'/dashboard/trends'};panel.querySelector=get;
 const days=Array.from({length:30},(_,i)=>({date:'2026-10-'+String(i+1).padStart(2,'0'),emailSentCount:20,emailDeliveredCount:15,emailOpenedCount:8,emailClickedCount:3,emailUnsubscribedCount:i===0?null:1,shopifyOrderCount:2,shopifyOrderAmount:10,ga4PurchaseRevenue:6}));
 vm.runInNewContext(fs.readFileSync(path.join(root,'shopify/js/dashboard-trend.js'),'utf8'),{
  document:{querySelector:()=>panel,createElement:name=>new E(name),createElementNS:(_,name)=>new E(name)},fetch:async()=>({ok:true,json:async()=>({ready:true,timeZone:'Asia/Shanghai',shopifyOrdersAvailable:true,shopifyCurrency:'USD',ga4Currency:'USD',ga4Connected:true,days})}),Intl,Number,String,Date,Math,encodeURIComponent
 });
 return {get,days};
}
for(const module of ['public'])test(`${module}: renders engagement curves, matching daily values and unknown coverage`,async()=>{
 const h=harness(module);await tick();await tick();
 const svg=h.get('[data-trend-svg]'),paths=svg.children.filter(n=>n.name==='path');
 assert.equal(paths.length,8);
 const rows=h.get('[data-trend-rows]').children;
 assert.equal(rows[0].children.length,9);
 assert.deepEqual(rows[0].children.slice(5).map(c=>c.textContent),['15','8','3','1']);
 assert.equal(rows[29].children[8].textContent,'待汇总');
 svg.listeners.pointermove({clientX:1475,clientY:40});
 const tooltip=h.get('[data-trend-tooltip]').textContent;
 assert.ok(tooltip.includes('邮件送达 15'));assert.ok(tooltip.includes('邮件打开人数 8'));assert.ok(tooltip.includes('邮件点击人数 3'));assert.ok(tooltip.includes('邮件退订 1'));
 assert.ok(h.get('[data-trend-context]').textContent.includes('待汇总'));
});
