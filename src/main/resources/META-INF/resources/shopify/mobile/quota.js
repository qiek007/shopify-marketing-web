(function (root,factory) {
    var api=factory();
    if (typeof module==='object' && module.exports) module.exports=api;
    if (root && root.document) api.init(root);
}(typeof window==='undefined'?null:window,function () {
    'use strict';
    function quotaUrl(endpoint,origin,shop) {
        var url=new URL(endpoint,origin);
        if (url.origin!==origin || !/\/stores$/.test(url.pathname)) throw new Error('Invalid quota endpoint');
        url.search='';url.hash='';
        url.searchParams.set('shop',String(shop||'').trim().toLowerCase());
        url.searchParams.set('view','mobile-quota');
        return url.href;
    }
    function install(win,root) {
        var state=root.querySelector('[data-quota-state]');
        var host=root.querySelector('[data-quota-content]');
        var refresh=root.querySelector('[data-quota-refresh]');
        if (!state || !host || !refresh) return;
        var shop=(root.dataset.shop||'').trim().toLowerCase();
        if (!shop) { state.textContent='请选择店铺以查看发送额度。';return; }
        var version=0,controller=null;
        function load() {
            var current=++version;
            if (controller) controller.abort();
            controller=win.AbortController?new win.AbortController():null;
            refresh.disabled=true;state.hidden=false;state.dataset.error='false';
            state.textContent='正在读取店铺发送额度…';host.replaceChildren();host.setAttribute('aria-busy','true');
            var options={credentials:'same-origin',cache:'no-store',headers:{Accept:'text/html'}};
            if (controller) options.signal=controller.signal;
            return win.fetch(quotaUrl(root.dataset.url,win.location.origin,shop),options).then(function (response) {
                if (current!==version) return null;
                var message;
                if (response.redirected || response.status===401) message='登录状态可能已过期，请返回应用重新进入。';
                else if (response.status===403) message='暂无权限读取当前店铺的发送额度。';
                else if (response.status<200 || response.status>=300) message='额度暂不可用，请稍后点击“刷新额度”重试。';
                var type=response.headers.get('content-type')||'';
                if (!message && type && !/\bhtml\b/i.test(type)) message='额度暂不可用，请稍后点击“刷新额度”重试。';
                if (message) {var failure=new Error(message);failure.quotaMessage=true;throw failure;}
                return response.text();
            }).then(function (html) {
                if (current!==version || html===null) return;
                var parsed=new win.DOMParser().parseFromString(html,'text/html');
                var result=parsed.querySelector('[data-mobile-quota-result]');
                if (!result || (result.dataset.shop||'').trim().toLowerCase()!==shop) {
                    var invalid=new Error('未能读取当前店铺额度，请刷新页面重试。');invalid.quotaMessage=true;throw invalid;
                }
                host.replaceChildren(win.document.importNode(result,true));
                state.hidden=result.dataset.available!=='true';
                state.textContent=state.hidden?'':'读取时间：'+new Date().toLocaleString(undefined,{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
            }).catch(function (error) {
                if (current!==version) return;
                host.replaceChildren();state.hidden=false;state.dataset.error='true';
                state.textContent=error && error.quotaMessage?error.message:'额度暂不可用，请稍后点击“刷新额度”重试。';
            }).finally(function () {
                if (current===version) {refresh.disabled=false;host.removeAttribute('aria-busy');}
            });
        }
        refresh.hidden=false;refresh.addEventListener('click',function () {load();});load();
        return {load:load};
    }
    function init(win) {var root=win.document.querySelector('[data-mobile-quota]');if(root)return install(win,root);}
    return {quotaUrl:quotaUrl,install:install,init:init};
}));
