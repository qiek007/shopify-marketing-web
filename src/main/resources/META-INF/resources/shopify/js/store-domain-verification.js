(function () {
    'use strict';
    var labels = {UNKNOWN:'尚未查询', LOADING:'正在查询', VERIFIED:'发信验证通过', PENDING:'等待验证', FAILED:'验证失败', NOT_FOUND:'供应商未登记', NOT_REQUIRED:'无需验证', UNAVAILABLE:'暂不可用'};

    var purposes = {SPF:'SPF 发信授权', DKIM:'DKIM 签名', TRACKING:'点击 / 打开追踪', RECEIVING:'收信路由', RETURN_PATH:'退信域认证', DMARC:'DMARC 策略', PROVIDER_DNS:'供应商 DNS 配置'};
    var lookupLabels = {PRESENT:'已查询到', INHERITED:'采用主域记录', MISSING:'未查到', UNAVAILABLE:'查询失败', INVALID:'记录异常'};
    function recordInfo(record, provider) {
        var host=String(record.host||'').toLowerCase(), raw=String(record.value||''), type=String(record.type||'').toUpperCase();
        var purpose=record.purpose;
        if(!Object.prototype.hasOwnProperty.call(purposes,purpose)) {
            if(host.indexOf('_dmarc.')===0||/^v=DMARC1\b/i.test(raw))purpose='DMARC';
            else if(host.indexOf('._domainkey')>=0||/^(v=DKIM1\b|k=rsa\b)/i.test(raw))purpose='DKIM';
            else if(/^v=spf1\b/i.test(raw))purpose='SPF';
            else if(type==='MX')purpose=provider==='SENDGRID'?'RETURN_PATH':'RECEIVING';
            else if(type==='CNAME'&&(/track|click|email\./i.test(host)))purpose='TRACKING';
            else if(type==='CNAME'&&(provider==='INFOBIP'||provider==='SENDGRID'))purpose='RETURN_PATH';
            else purpose='PROVIDER_DNS';
        }
        var dns=record.source==='DNS', lookup=record.lookupStatus, summary=purposes[purpose]+' / '+(dns?'DNS 查询':'供应商');
        if(Number.isInteger(record.priority))summary+=' · 优先级 '+record.priority;
        var note=record.note||'';
        if(!note&&purpose==='RECEIVING'&&provider==='MAILGUN')note='仅用于收信路由，不代表发信验证要求。';
        if(!note&&purpose==='RETURN_PATH'&&provider==='INFOBIP')note='CNAME 将 SPF、MX、A 委派给供应商，无需另加 MX。';
        if(!note&&purpose==='RETURN_PATH'&&provider==='SENDGRID')note='用于退信域认证，不是收信 MX。';
        return {purpose:purpose,dns:dns,summary:summary,note:note,
            status:dns?(lookupLabels[lookup]||'查询失败'):(record.verified?'供应商已验证':'待配置'),
            ok:!dns&&!!record.verified,
            copyValue:!!raw.trim()&&(!dns||lookup==='PRESENT'||lookup==='INHERITED')};
    }
    function scopeText(provider, records) {
        var text='发信验证状态以供应商结果为准。DNS 查询不证明实际邮件认证或 DMARC 对齐通过。';
        if(provider==='MAILGUN')text+=' Mailgun MX 仅用于收信路由。';
        if(provider==='INFOBIP')text+=' Infobip 收信需配置独立入站域；退信域 CNAME 已委派 SPF、MX、A。';
        if(provider==='SENDGRID')text+=' SendGrid MX 用于退信域认证；独立链接品牌化不属于域认证返回列表。';
        if(!records.some(function(record){return record.source==='DNS'&&recordInfo(record,provider).purpose==='DMARC';}))
            text+=' 本次响应未查询 DMARC 实际策略，请单独检查；不能据此认为全部检查已完成。';
        return text;
    }
    document.querySelectorAll('[data-store-domain-panel]').forEach(function (panel) {
        var card=panel.closest('.sender-profile'), open=card.querySelector('[data-store-domain-open]');
        if (!open) return;
        var revision=0, controller=null, csrfToken='', isBusy=false, writing=false, mustQuery=false, canVerify=false;
        function clear(node) { while(node.firstChild) node.removeChild(node.firstChild); }
        function busy(value, write) {
            isBusy=value;writing=value&&!!write;
            panel.setAttribute('aria-busy',value?'true':'false');
            panel.querySelector('[data-store-domain-loading]').hidden=!value;
            var refresh=panel.querySelector('[data-store-domain-check]');
            refresh.disabled=value; refresh.textContent=value?'查询中…':'刷新验证状态';
            panel.querySelector('[data-store-domain-verify]').disabled=value||!csrfToken||mustQuery||!canVerify;
            panel.querySelector('[data-store-domain-verify-confirm]').disabled=value||!csrfToken||mustQuery;
            panel.querySelector('[data-store-domain-verify]').textContent=writing?'验证中…':'重新验证';
        }
        function cell(row,value) { var node=document.createElement('td');node.textContent=value==null||value===''?'—':String(value);row.appendChild(node);return node; }
        function abbreviated(value,maximum) {
            var text=value==null?'':String(value);
            if(text.length<=maximum)return text;
            return text.slice(0,maximum-13)+'…'+text.slice(-12);
        }
        function render(value) {
            var status=Object.prototype.hasOwnProperty.call(labels,value.status)?value.status:'UNAVAILABLE';
            canVerify=status==='VERIFIED'||status==='PENDING'||status==='FAILED';
            var statusNode=panel.querySelector('[data-store-domain-status]');statusNode.textContent=labels[status];statusNode.className='store-domain-status status-'+status;
            var checked=value.checkedAt;
            if(checked!==null&&checked!==undefined&&checked!=='') {
                var number=Number(checked);checked=Number.isFinite(number)?new Date(number<100000000000?number*1000:number):new Date(checked);
            }
            panel.querySelector('[data-store-domain-checked]').textContent=checked&&!isNaN(checked.getTime())?'查询时间：'+checked.toLocaleString():'';
            panel.querySelector('[data-store-domain-message]').textContent=(value.message||'')+(status==='NOT_FOUND'?' 请联系平台管理员向当前邮件通道登记发件域，再按返回的 DNS 记录配置。':'');
            var body=panel.querySelector('[data-store-domain-records]');clear(body);
            var records=Array.isArray(value.dnsRecords)?value.dnsRecords:[];
            panel.querySelector('[data-store-domain-scope]').textContent=scopeText(panel.dataset.provider,records);
            records.forEach(function (record) {
                var info=recordInfo(record,panel.dataset.provider);
                var row=document.createElement('tr');cell(row,record.type);cell(row,abbreviated(record.host,32));cell(row,abbreviated(record.value,48));
                var purpose=cell(row,info.summary);purpose.className='record-purpose';
                if(info.note){var note=document.createElement('small');note.className='record-note';note.textContent=info.note;purpose.appendChild(note);}
                cell(row,info.status).className=info.ok?'record-ok':'record-pending';
                var actions=cell(row,'');actions.textContent='';
                [['复制主机',record.host],['复制值',record.value]].forEach(function (item) {
                    var button=document.createElement('button');button.type='button';button.className='action-button';button.textContent=item[0];
                    button.disabled=item[0]==='复制值'?!info.copyValue:!item[1];
                    button.addEventListener('click',function () {
                        if(button.disabled)return;
                        var feedback=panel.querySelector('[data-store-domain-copy-feedback]');
                        if(!navigator.clipboard||!navigator.clipboard.writeText) {feedback.textContent='当前浏览器无法访问剪贴板，请使用支持剪贴板的浏览器重试。';return;}
                        navigator.clipboard.writeText(item[1]||'').then(function () {feedback.textContent=item[0]+'已复制完整记录';},function () {feedback.textContent='复制失败，请允许浏览器访问剪贴板后重试。';});
                    });actions.appendChild(button);
                });body.appendChild(row);
            });panel.querySelector('[data-store-domain-table]').hidden=!(value.dnsRecords||[]).length;
        }
        function invalidate() {
            if(writing)mustQuery=true;
            revision++;if(controller)controller.abort();controller=null;csrfToken='';busy(false);
            panel.querySelector('[data-store-domain-confirm]').hidden=true;
            clear(panel.querySelector('[data-store-domain-records]'));panel.querySelector('[data-store-domain-table]').hidden=true;
            panel.querySelector('[data-store-domain-copy-feedback]').textContent='';
        }
        function publicError(message) {var error=new Error(message);error.publicMessage=message;return error;}
        async function inspect() {
            if(!panel.open||isBusy) return;
            panel.querySelector('[data-store-domain-confirm]').hidden=true;
            var requestRevision=++revision;
            if(controller)controller.abort();controller=new AbortController();var activeController=controller;
            busy(true);render({status:'LOADING',message:'正在读取当前店铺已配置发件域的状态…',dnsRecords:[]});
            try {
                var url=new URL(panel.dataset.checkUrl,window.location.href);
                url.searchParams.set('shop',panel.dataset.shop);url.searchParams.set('provider',panel.dataset.provider);
                var response=await fetch(url.href,{method:'GET',credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'},signal:activeController.signal});
                if(!response.ok)throw publicError(response.status===403?'没有权限查看当前店铺发件域状态。':response.status===409?'该店铺通道未启用或尚未配置发件域，请联系平台管理员。':'发件域查询暂不可用，服务可能尚未更新，请联系管理员。');
                var value=await response.json();
                if(!panel.open||requestRevision!==revision)return;
                if(String(value.provider||'').toUpperCase()!==panel.dataset.provider || String(value.domain||'').toLowerCase()!==panel.dataset.configuredDomain.toLowerCase())
                    throw publicError('发件设置或查询服务状态已变化，请刷新页面后重试。');
                csrfToken=response.headers&&response.headers.get('X-Store-Domain-Csrf')||'';mustQuery=false;
                if(!csrfToken)panel.querySelector('[data-store-domain-copy-feedback]').textContent='当前服务未提供重新验证授权，请刷新页面或联系管理员更新服务。';
                render(value);
            } catch (failure) {
                if(!panel.open||requestRevision!==revision||failure.name==='AbortError')return;
                render({status:'UNAVAILABLE',message:failure.publicMessage||'发件域查询暂不可用，请稍后重试或联系管理员确认服务已更新。',dnsRecords:[]});
            } finally {if(requestRevision===revision){controller=null;busy(false);}}
        }
        function confirmVerification() {
            if(!panel.open||isBusy||!csrfToken||mustQuery||!canVerify)return;
            panel.querySelector('[data-store-domain-confirm]').hidden=false;
            var confirm=panel.querySelector('[data-store-domain-verify-confirm]');
            if(confirm.focus)confirm.focus();
        }
        async function verify() {
            var confirmation=panel.querySelector('[data-store-domain-confirm]');
            if(!panel.open||confirmation.hidden||isBusy||!csrfToken||mustQuery||!canVerify)return;
            confirmation.hidden=true;
            var requestRevision=++revision;controller=new AbortController();var activeController=controller;
            busy(true,true);render({status:'LOADING',message:'正在请求供应商检查当前已配置发件域，不会修改 DNS 或创建新域…',dnsRecords:[]});
            try {
                var url=new URL(panel.dataset.checkUrl,window.location.href);url.searchParams.set('shop',panel.dataset.shop);
                var response=await fetch(url.href,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json','Content-Type':'application/json','X-Store-Domain-Csrf':csrfToken},body:JSON.stringify({provider:panel.dataset.provider}),signal:activeController.signal});
                if(!response.ok)throw publicError(response.status===403?'验证授权已失效，请先刷新查询状态后再重试。':'重新验证请求结果未能确认，供应商可能仍在处理。请先刷新查询状态，再决定是否重试。');
                var value=await response.json();
                if(!panel.open||requestRevision!==revision)return;
                if(String(value.provider||'').toUpperCase()!==panel.dataset.provider||String(value.domain||'').toLowerCase()!==panel.dataset.configuredDomain.toLowerCase())throw publicError('发件配置已变化，请先刷新查询状态。');
                mustQuery=false;render(value);
            }catch(failure){
                if(!panel.open||requestRevision!==revision)return;
                mustQuery=true;
                render({status:'UNAVAILABLE',message:failure.publicMessage||'重新验证请求结果未能确认，供应商可能仍在处理。请先刷新查询状态，再决定是否重试。',dnsRecords:[]});
            }finally{if(requestRevision===revision){controller=null;busy(false);}}
        }
        open.addEventListener('click',function () {if(open.disabled)return;invalidate();if(!panel.open)panel.showModal();inspect();});
        panel.querySelector('[data-store-domain-check]').addEventListener('click',inspect);
        panel.querySelector('[data-store-domain-verify]').addEventListener('click',confirmVerification);
        panel.querySelector('[data-store-domain-verify-confirm]').addEventListener('click',verify);
        panel.querySelector('[data-store-domain-verify-cancel]').addEventListener('click',function(){panel.querySelector('[data-store-domain-confirm]').hidden=true;});
        panel.querySelectorAll('[data-store-domain-close]').forEach(function (button) {button.addEventListener('click',function () {invalidate();panel.close();});});
        panel.addEventListener('close',invalidate);panel.addEventListener('cancel',invalidate);
        panel.addEventListener('click',function (event) {if(event.target===panel){invalidate();panel.close();}});
    });
}());
