const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const resources=path.resolve(__dirname,'../../main/resources/META-INF/resources');
const read=p=>fs.readFileSync(path.join(resources,p),'utf8');
test('classic quota summary and audit expose expiring lots',()=>{
 const store=read('WEB-INF/shopify/stores.jsp'),history=read('WEB-INF/shopify/store-quota-history.jsp');
 for(const field of ['unsubmittedReservedCount','pendingCount','expiredCount'])assert.ok(store.includes('storeEmailQuota.'+field));
 assert.ok(store.includes('/stores/quota/lots'));
 for(const marker of ['EXPIRE_AVAILABLE','EXPIRED_RELEASE','entry.lotId','entry.reservationId','entry.expiredDelta','entry.expiredAfter'])assert.ok(history.includes(marker),marker);
});
for(const theme of ['shopify','shopify-theme2'])test(theme+': new quota-lot view is read only and escapes shop links',()=>{
 const page=read('WEB-INF/'+theme+'/store-quota-lots.jsp');
 for(const marker of ['quotaLots.entries','lot.expiryDisplay','lot.availableCount','lot.pendingCount','lot.expiredCount','pageNumber','pageSize'])assert.ok(page.includes(marker),marker);
 assert.ok(!page.includes('/stores/quota/adjust'));
 assert.doesNotMatch(page,/href="[^"\n]*\$\{selectedShop\}/);
 for(const url of ['storesUrl','quotaHistoryUrl','previousLots','nextLots']){
  assert.ok(page.includes('<c:url var="'+url+'"'));
  assert.ok(page.includes('href="<c:out value=\''+String.fromCharCode(36,123)+url+'}\'/>"'));
 }
});
