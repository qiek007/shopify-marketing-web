const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = path.join(__dirname, '../../main/resources/META-INF/resources/shopify/mobile/trends.js');
function api() { assert.ok(fs.existsSync(source), 'mobile trend module must exist'); return require(source); }
function days() {
    return Array.from({length: 30}, (_, i) => ({ date: `2026-10-${String(i + 1).padStart(2, '0')}`, emailSentCount: i, emailDeliveredCount: i, shopifyOrderCount: 1 }));
}
test('range summaries use the latest days and preserve zero values', () => {
    const a = api();
    const data = {ready: true, shopifyOrdersAvailable: true, days: days()};
    assert.equal(a.summarize(data, 7).sent, 182);
    assert.equal(a.summarize(data, 30).sent, 435);
    assert.equal(a.summarize(data, 7).orders, 7);
    data.days = days().map(d => ({...d, emailSentCount: 0}));
    assert.equal(a.summarize(data, 7).sent, 0);
});

test('business-service LocalDate arrays produce the same summary as web ISO dates', () => {
    const a = api();
    const iso = {ready: true, shopifyOrdersAvailable: true, days: days()};
    const arrays = {...iso, days: days().map(day => ({...day, date: day.date.split('-').map(Number)}))};
    assert.equal(a.classify(arrays), 'ready');
    assert.deepEqual(a.summarize(arrays, 7), a.summarize(iso, 7));
    assert.deepEqual(arrays.days[0].date, [2026, 10, 1]);
});

test('invalid, duplicate and disordered calendar dates still reject incomplete data', () => {
    const a = api();
    for (const date of [[2026, 2, 30], [2026, 13, 1], [2026, 10], ['2026', 10, 30], '2026-02-30', '2026-10-32', null]) {
        const data = {ready: true, days: days()};
        data.days[29].date = date;
        assert.equal(a.classify(data), 'incomplete');
    }
    const duplicate = {ready: true, days: days()};
    duplicate.days[29].date = [2026, 10, 29];
    assert.equal(a.classify(duplicate), 'incomplete');
    const reversed = {ready: true, days: days().reverse().map(day => ({...day, date: day.date.split('-').map(Number)}))};
    assert.equal(a.classify(reversed), 'incomplete');
});

test('mixed ISO and array dates across leap day stay on their calendar date', () => {
    const a = api();
    const leapDays = Array.from({length: 29}, (_, i) => ({date: [2024, 2, i + 1], emailSentCount: 0, emailDeliveredCount: 0}));
    leapDays.push({date: '2024-03-01', emailSentCount: 0, emailDeliveredCount: 0});
    const result = a.summarize({ready: true, days: leapDays}, 7);
    assert.equal(result.days.at(-2).date, '2024-02-29');
    assert.equal(result.days.at(-1).date, '2024-03-01');
});
test('missing counts and unavailable orders do not become zero', () => {
    const a = api();
    const data = {ready: true, shopifyOrdersAvailable: false, days: days()};
    data.days[29].emailDeliveredCount = null;
    data.days[28].emailSentCount = null;
    const summary = a.summarize(data, 7);
    assert.equal(summary.sent, null);
    assert.equal(summary.delivered, null);
    assert.equal(summary.orders, null);
});
test('empty, incomplete and not-ready data are distinct from a valid summary', () => {
    const a = api();
    assert.equal(a.classify({ready: false, days: []}), 'preparing');
    assert.equal(a.classify({ready: true, days: []}), 'empty');
    assert.equal(a.classify({ready: true, days: days().slice(0, 5)}), 'incomplete');
    assert.equal(a.classify({ready: true, days: days()}), 'ready');
    assert.equal(a.classify({days: []}), 'incomplete');
});
test('HTTP session and permission failures have different messages', () => {
    const a = api();
    assert.match(a.responseError(401, false, ''), /登录/);
    assert.match(a.responseError(200, true, 'text/html'), /登录/);
    assert.match(a.responseError(403, false, ''), /权限/);
    assert.match(a.responseError(500, false, ''), /暂不可用/);
    assert.equal(a.responseError(200, false, 'application/json'), null);
});
test('unexpected transport errors use a user-friendly message', () => {
    const a = api();
    assert.match(a.errorMessage(new SyntaxError('Unexpected token in JSON')), /暂不可用/);
    assert.doesNotMatch(a.errorMessage(new SyntaxError('Unexpected token in JSON')), /Unexpected/);
    const known = new Error('登录状态可能已过期，请返回应用重新进入。');
    known.isTrendError = true;
    assert.match(a.errorMessage(known), /登录/);
});

test('line chart separates missing values from zero and keeps gaps in each series', () => {
    const a = api();
    const chart = a.chartModel([
        {date:'2026-11-01', emailSentCount:0, emailDeliveredCount:0},
        {date:'2026-11-02', emailSentCount:100, emailDeliveredCount:null},
        {date:'2026-11-03', emailSentCount:80, emailDeliveredCount:70}
    ]);
    assert.equal(chart.upper, 100);
    assert.equal(chart.series[0].segments.length, 1);
    assert.equal(chart.series[0].segments[0].length, 3);
    assert.equal(chart.series[1].segments.length, 2);
    assert.equal(chart.series[0].points[0].y, chart.bottom);
    assert.equal(chart.series[1].points[1], null);
    assert.equal(chart.series[0].points[2].x, chart.right);
});

test('all-zero chart has a finite scale and pointer positions clamp to valid days', () => {
    const a = api();
    const chart = a.chartModel([{date:'2026-11-01',emailSentCount:0,emailDeliveredCount:0}]);
    assert.ok(Number.isFinite(chart.series[0].points[0].y));
    assert.ok(chart.upper > 0);
    assert.equal(a.nearestDay(-10, 7), 0);
    assert.equal(a.nearestDay(0.5, 7), 3);
    assert.equal(a.nearestDay(2, 7), 6);
    assert.equal(a.nearestDay(0.5, 30), 15);
});


test('chart follows the active touch and supports accessible date navigation', () => {
    class Element {
        constructor() { this.children = []; this.attributes = {}; this.listeners = {}; this.style = {}; this.offsetWidth = 135; this.offsetHeight = 70; }
        setAttribute(name, value) { this.attributes[name] = String(value); }
        appendChild(child) { this.children.push(child); }
        replaceChildren() { this.children = []; }
        addEventListener(name, handler) { this.listeners[name] = handler; }
        getBoundingClientRect() { return {left:0, top:0, width:600, height:300}; }
        setPointerCapture(id) { this.captured = id; }
    }
    const host = new Element(), readout = new Element();
    const document = {createElement: () => new Element(), createElementNS: () => new Element()};
    api().renderChart({document}, host, readout, [
        {date:'2026-11-01',emailSentCount:0,emailDeliveredCount:0},
        {date:'2026-11-02',emailSentCount:100,emailDeliveredCount:null},
        {date:'2026-11-03',emailSentCount:80,emailDeliveredCount:70}
    ]);
    const [svg, tooltip] = host.children;
    assert.match(readout.textContent, /2026-11-03/);
    assert.equal(tooltip.hidden, true);
    svg.listeners.pointerdown({pointerId:7,pointerType:'touch',clientX:72,clientY:170});
    assert.equal(svg.captured, 7);
    assert.match(readout.textContent, /2026-11-01.*发送 0.*送达 0/);
    assert.equal(tooltip.hidden, false);
    svg.listeners.pointermove({pointerId:8,pointerType:'touch',clientX:568,clientY:170});
    assert.equal(svg.attributes['aria-valuenow'], '1');
    svg.listeners.pointermove({pointerId:7,pointerType:'touch',clientX:320,clientY:170});
    assert.match(readout.textContent, /2026-11-02.*待汇总/);
    svg.listeners.pointermove({pointerId:7,pointerType:'touch',clientX:900,clientY:170});
    assert.equal(svg.attributes['aria-valuenow'], '3');
    assert.ok(parseFloat(tooltip.style.left) + tooltip.offsetWidth <= 600);
    svg.listeners.pointercancel();
    assert.equal(tooltip.hidden, true);
    svg.listeners.pointermove({pointerId:7,pointerType:'touch',clientX:72,clientY:170});
    assert.equal(svg.attributes['aria-valuenow'], '3');
    let prevented = false;
    svg.listeners.keydown({key:'Home',preventDefault:() => { prevented = true; }});
    assert.equal(prevented, true);
    assert.equal(svg.attributes['aria-valuenow'], '1');
    svg.listeners.keydown({key:'ArrowRight',preventDefault:() => {}});
    assert.equal(svg.attributes['aria-valuenow'], '2');
});


test('today uses only the final business-calendar day and preserves pending delivery counts', () => {
    const data = {ready:true,shopifyOrdersAvailable:true,days:days()};
    const today = api().summarize(data, 1);
    assert.ok(today);
    assert.equal(today.days.length, 1);
    assert.equal(today.days[0].date, '2026-10-30');
    assert.equal(today.sent, 29);
    assert.equal(today.delivered, 29);
    assert.equal(today.orders, 1);
    data.days[29].emailSentCount = 0;
    data.days[29].emailDeliveredCount = null;
    assert.equal(api().summarize(data, 1).sent, 0);
    assert.equal(api().summarize(data, 1).delivered, null);
});

test('smooth curves pass through every point without overshooting peaks or zero', () => {
    const points = [{x:0,y:100},{x:10,y:0},{x:20,y:60},{x:30,y:60},{x:40,y:10}];
    const path = api().smoothPath(points);
    assert.match(path, /^M0,100 C/);
    assert.doesNotMatch(path, /NaN|Infinity|L/);
    const curves = path.slice(path.indexOf('C')).split('C').slice(1);
    assert.equal(curves.length, points.length - 1);
    curves.forEach((curve, i) => {
        const values = curve.trim().split(/[ ,]+/).map(Number);
        assert.equal(values.length, 6);
        assert.deepEqual(values.slice(4), [points[i+1].x, points[i+1].y]);
        for (let step=0; step<=20; step++) {
            const t=step/20, u=1-t;
            const y=u*u*u*points[i].y + 3*u*u*t*values[1] + 3*u*t*t*values[3] + t*t*t*values[5];
            assert.ok(y >= Math.min(points[i].y, points[i+1].y)-1e-9);
            assert.ok(y <= Math.max(points[i].y, points[i+1].y)+1e-9);
        }
    });
    assert.equal(api().smoothPath([{x:10,y:20}]), 'M10,20');
    assert.equal(api().smoothPath([]), '');
});


function hourlyData() {
    return {date:'2026-11-09',timeZone:'Asia/Shanghai',generatedAt:'2026-11-09T04:20:00Z',hours:
        Array.from({length:24},(_,i)=>({date:'2026-11-09T'+String(i).padStart(2,'0')+':00:00+08:00',label:String(i).padStart(2,'0')+':00',
            future:i>12,emailSentCount:i>12?null:i,emailDeliveredCount:i>12?null:i}))};
}
test('hourly summaries count elapsed hours and keep future hours out of totals', () => {
    const data = hourlyData(), summary = api().summarizeHourly(data);
    assert.ok(summary);
    assert.equal(summary.sent,78);
    assert.equal(summary.delivered,78);
    assert.equal(summary.hours.length,24);
    data.hours[10].emailDeliveredCount = null;
    assert.equal(api().summarizeHourly(data).delivered,null);
});
test('hourly summaries reject daily responses, duplicate hours and false future zeroes', () => {
    assert.equal(api().summarizeHourly({ready:true,days:days()}),null);
    const duplicate=hourlyData();duplicate.hours[1].date=duplicate.hours[0].date;
    assert.equal(api().summarizeHourly(duplicate),null);
    const incomplete=hourlyData();incomplete.hours.pop();incomplete.hours.pop();
    assert.equal(api().summarizeHourly(incomplete),null);
    const future=hourlyData();future.hours[23].emailSentCount=0;
    assert.equal(api().summarizeHourly(future),null);
});


test('hourly summaries reject a future slot marked as elapsed', () => {
    const data = hourlyData();data.hours[13].future=false;
    assert.equal(api().summarizeHourly(data),null);
});

class TrendTestElement {
    constructor() { this.children=[];this.attributes={};this.listeners={};this.style={};this.dataset={};this.offsetWidth=135;this.offsetHeight=70; }
    setAttribute(name,value) { this.attributes[name]=String(value); }
    appendChild(child) { this.children.push(child); }
    replaceChildren() { this.children=[]; }
    addEventListener(name,handler) { this.listeners[name]=handler; }
    getBoundingClientRect() { return {left:0,top:0,width:600,height:300}; }
}
test('today loads real hourly data, ignores stale replies, and recovers to daily views', async () => {
    const root=new TrendTestElement(), nodes={};
    for (const name of ['state','content','totals','chart','selection','period','meta','help']) nodes[name]=new TrendTestElement();
    root.dataset={shop:'demo.myshopify.com',trendUrl:'/dashboard/trends',hourlyUrl:'/dashboard/trends/hourly'};
    const buttons=[1,7,30].map(range=>{const button=new TrendTestElement();button.dataset.mobileRange=String(range);return button;});
    root.querySelector=selector=>nodes[selector.match(/data-mobile-trend-(.+)]/)[1]];
    root.querySelectorAll=()=>buttons;
    const document={querySelector:()=>root,createElement:()=>new TrendTestElement(),createElementNS:()=>new TrendTestElement()};
    const pending=[], requests=[];
    const response=(body,status=200)=>({status,redirected:false,headers:{get:()=> 'application/json'},json:()=>Promise.resolve(body)});
    const win={document,fetch:(url,options)=>{
        requests.push({url,options});
        if (!url.includes('/hourly')) return Promise.resolve(response({ready:true,days:days()}));
        return new Promise(resolve=>pending.push(resolve));
    }};
    const flush=()=>new Promise(resolve=>setImmediate(resolve));
    api().mount(win);await flush();
    assert.equal(buttons[0].attributes['aria-pressed'],'true');
    assert.equal(buttons[1].attributes['aria-pressed'],'false');
    assert.equal(nodes.chart.hidden,true);
    assert.match(requests.at(-1).url,/trends\/hourly\?shop=demo.myshopify.com/);
    assert.equal(requests.at(-1).options.cache,'no-store');
    buttons[1].listeners.click();pending.shift()(response(hourlyData()));await flush();
    assert.equal(nodes.chart.children[0].attributes['aria-valuemax'],'7');
    buttons[0].listeners.click();pending.shift()(response(hourlyData()));await flush();
    assert.equal(nodes.chart.hidden,false);
    assert.match(nodes.period.textContent,/今天.*按小时/);
    const svg=nodes.chart.children[0];
    assert.equal(svg.attributes['aria-valuemax'],'24');
    assert.equal(svg.attributes['aria-valuenow'],'13');
    assert.match(nodes.selection.textContent,/12:00.*发送 12/);
    svg.listeners.keydown({key:'End',preventDefault:()=>{}});
    assert.match(nodes.selection.textContent,/23:00.*未到该时段/);
    buttons[2].listeners.click();
    assert.equal(nodes.chart.children[0].attributes['aria-valuemax'],'30');
    buttons[0].listeners.click();pending.shift()(response({},500));await flush();
    assert.equal(nodes.chart.hidden,true);
    assert.match(nodes.selection.textContent,/暂不可用/);
    buttons[1].listeners.click();assert.equal(nodes.chart.hidden,false);
    assert.equal(nodes.chart.children[0].attributes['aria-valuemax'],'7');
});
