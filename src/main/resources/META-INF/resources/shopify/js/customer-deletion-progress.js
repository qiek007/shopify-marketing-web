(function(root,factory){
    if(typeof module==='object'&&module.exports)module.exports=factory;
    else {var panel=root.document.querySelector('[data-customer-deletion-job]');if(panel)root.CustomerDeletionProgress=factory(panel,{
        fetch:root.fetch.bind(root),setTimeout:root.setTimeout.bind(root),clearTimeout:root.clearTimeout.bind(root),confirm:root.confirm.bind(root),
        notify:function(name,detail){root.document.dispatchEvent(new CustomEvent(name,{detail:detail}));}
    });}
}(typeof window==='undefined'?this:window,function(panel,env){
    'use strict';
    var current=null,timer=null,sequence=0,finishedKey='',retrying=false,readFailures=0;
    function node(key){return panel.querySelector('[data-delete-job-'+key+']');}
    function text(key,value){var target=node(key);if(target)target.textContent=String(value);}
    function url(action,id){var p=new URLSearchParams({shop:panel.dataset.shop});if(id)p.set('jobId',id);return panel.dataset.base+'/'+action+'?'+p.toString();}
    function schedule(delay){env.clearTimeout(timer);if(current&&current.active)timer=env.setTimeout(refresh,delay);}
    function show(job){
        if(!job||!job.jobId)return;
        var total=Number(job.total),succeeded=Number(job.succeeded),failed=Number(job.failed);
        if(![total,succeeded,failed].every(function(n){return Number.isSafeInteger(n)&&n>=0;})||succeeded+failed>total)throw new Error('Invalid deletion progress');
        sequence++;env.clearTimeout(timer);current=Object.assign({},job,{total:total,succeeded:succeeded,failed:failed,pending:total-succeeded-failed,active:['QUEUED','RUNNING'].includes(job.status)});
        panel.hidden=false;
        var labels={QUEUED:current.errorCode?'等待自动重试':'等待后台处理',RUNNING:'正在分批删除',COMPLETED:'删除完成',PARTIAL_FAILED:'部分客户删除失败'};
        text('status',labels[current.status]||'正在核对任务状态');text('total',total);text('succeeded',succeeded);text('failed',failed);text('pending',current.pending);
        var percent=total===0?100:Math.floor((succeeded+failed)*100/total);node('progress').value=percent;text('processed','已处理 '+(succeeded+failed)+' / '+total+'（'+percent+'%）');
        text('message',current.errorMessage||(current.active?'目标名单已固定，后台会分批处理；刷新页面可继续查看进度。':'已完成批次已保留，失败项可单独重试。'));
        if(job.updatedAt)text('updated','更新时间：'+new Date(job.updatedAt).toLocaleString('zh-CN',{hour12:false,timeZone:'Asia/Shanghai'}));
        node('retry').hidden=!(current.status==='PARTIAL_FAILED'&&failed>0);node('retry').disabled=retrying;
        env.notify('customer-deletion-job-state',{active:current.active,jobId:current.jobId});
        if(!current.active){var key=current.jobId+':'+current.status+':'+succeeded+':'+failed;if(key!==finishedKey){finishedKey=key;env.notify('customer-deletion-finished',{jobId:current.jobId,status:current.status,succeeded:succeeded,failed:failed});}}
        schedule(2000);
    }
    function safeMessage(payload){return payload&&/^(DELETION_[A-Z_]+|INVALID_REQUEST)$/.test(payload.code||'')&&typeof payload.message==='string'?payload.message.slice(0,300):null;}
    async function read(action,id){
        var request=++sequence;
        try {
            var response=await env.fetch(url(action,id),{method:'GET',credentials:'same-origin',headers:{Accept:'application/json'}});
            var payload=await response.json();if(!response.ok){var rejected=new Error('Progress unavailable');rejected.userMessage=safeMessage(payload);throw rejected;}if(request!==sequence)return;readFailures=0;
            if(payload.job)show(payload.job);else if(!current)panel.hidden=true;
        }catch(error){
            if(request!==sequence)return;
            if(error.userMessage){panel.hidden=false;text('message',error.userMessage);if(!current){text('status','删除任务暂不可用');text('processed','任务尚未开始');node('retry').hidden=true;}}
            else if(current)text('message','暂时无法读取进度，任务可能仍在后台执行，正在重连。');
            if(!error.userMessage||(current&&current.active)){env.clearTimeout(timer);timer=env.setTimeout(function(){read(action,id);},Math.min(30000,5000*Math.pow(2,Math.min(3,readFailures++))));}
        }
    }
    function refresh(){return current?read('status',current.jobId):refreshLatest();}
    function refreshLatest(){return read('latest');}
    async function retry(){
        if(retrying||!current||current.status!=='PARTIAL_FAILED'||current.failed<1)return;
        if(!env.confirm('仅重试这次任务失败的 '+current.failed+' 位客户，已完成的客户不会重复处理。是否继续？'))return;
        retrying=true;node('retry').disabled=true;
        try {
            var payload=new URLSearchParams({shop:panel.dataset.shop,jobId:current.jobId,confirm:'RETRY_FAILED_CUSTOMERS'});
            var response=await env.fetch(panel.dataset.base+'/retry',{method:'POST',credentials:'same-origin',headers:{Accept:'application/json','Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:payload.toString()});
            var result=await response.json();if(!response.ok){var rejected=new Error('Retry not confirmed');rejected.userMessage=safeMessage(result);throw rejected;}if(result.job)show(result.job);
        }catch(error){text('message',error.userMessage||'重试请求结果暂未确认，请刷新进度核对；不会自动重复提交。');await refresh();}
        finally{retrying=false;node('retry').disabled=false;}
    }
    node('refresh').addEventListener('click',refresh);node('retry').addEventListener('click',retry);
    return {show:show,refresh:refresh,refreshLatest:refreshLatest,retry:retry,destroy:function(){sequence++;env.clearTimeout(timer);}};
}));
