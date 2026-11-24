(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory;
 else {var panel=root.document.querySelector('[data-deleted-customers]');if(panel)factory(panel,{
  confirm:root.confirm.bind(root),fields:function(form){return new URLSearchParams(new FormData(form)).toString();},
  read:function(url,options){var embedded=panel.dataset.embeddedWorkspace==='true'||!!root.DidaShoplineWorkspace;
   if(embedded){if(!root.ShopifyEmbeddedRequests)throw new Error('嵌入身份暂不可用，请重新打开页面。');return root.ShopifyEmbeddedRequests.fetch(url,options);}return root.fetch(url,options);}
 });}
}(typeof window==='undefined'?this:window,function(panel,env){
 'use strict';
 var feedback=panel.querySelector('[data-restore-feedback]');
 function message(text,error){feedback.hidden=false;feedback.textContent=text;feedback.classList.toggle('error',!!error);}
 async function restore(form){
  var button=form.querySelector('[type=submit]');if(button.disabled)return;
  if(!env.confirm('恢复这位客户并接续原有历史？原有退订和抑制状态不会解除。'))return;
  button.disabled=true;button.setAttribute('aria-busy','true');
  try {
   var response=await env.read(form.action,{method:'POST',credentials:'same-origin',headers:{Accept:'application/json','Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:env.fields(form)});
   var result=await response.json();if(!response.ok){message(result.message||'客户暂不能恢复，请刷新后核对。',true);return;}
   message(result.message||'客户已恢复，可返回客户列表查看。',false);
   var row=form.closest('[data-deleted-row]');if(row)row.remove();
   var count=panel.querySelector('[data-deleted-count]');if(count)count.textContent=String(Math.max(0,Number(count.textContent)-1));
   var empty=panel.querySelector('[data-deleted-empty]');if(empty&&!panel.querySelector('[data-deleted-row]'))empty.hidden=false;
  }catch(uncertain){message('恢复结果尚未确认，请刷新列表核对，不要重复提交。',true);}
  finally {button.disabled=false;button.removeAttribute('aria-busy');}
 }
 panel.querySelectorAll('[data-customer-restore]').forEach(function(form){form.addEventListener('submit',function(event){event.preventDefault();event.stopPropagation();restore(form);});});
 return {restore:restore};
}));
