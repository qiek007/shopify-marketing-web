package com.yskj.shopify.web.view;
import org.apache.catalina.startup.Tomcat;
import org.jsoup.Jsoup;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.junit.jupiter.api.io.TempDir;
import javax.servlet.http.*;
import java.nio.file.Path;
import java.net.URI;
import java.net.http.*;
import java.time.Duration;
import java.util.*;
import static org.assertj.core.api.Assertions.assertThat;
class SourceConnectionJspRenderingTest {
 @TempDir Path temporary;
 @Test @Timeout(60) void bothThemesShowInlineReadonlyConnectionsAndOnlyAuthorizedTests() throws Exception {
  var tomcat=new Tomcat();tomcat.setBaseDir(temporary.toString());tomcat.setPort(0);tomcat.getConnector().setProperty("address","127.0.0.1");
  var ctx=tomcat.addWebapp("/web",Path.of("src/main/resources/META-INF/resources").toAbsolutePath().toString());ctx.setParentClassLoader(getClass().getClassLoader());ctx.setContainerSciFilter("org.springframework.web.SpringServletContainerInitializer");
  Tomcat.addServlet(ctx,"fixture",new HttpServlet(){@Override protected void doGet(HttpServletRequest req,HttpServletResponse res)throws java.io.IOException,javax.servlet.ServletException{
   String mode=req.getParameter("mode"),theme=req.getParameter("theme");boolean nativeStore=mode.equals("shopify");var p=new HashMap<String,Object>();p.put("available",!mode.equals("unavailable"));p.put("sourceType",nativeStore?"SHOPIFY":mode.equals("shopline")?"SHOPLINE":"CUSTOM");p.put("sourceLabel",nativeStore?"Shopify":mode.equals("shopline")?"Shopline":"自建站");p.put("connectorKey",nativeStore?"SHOPIFY_NATIVE":mode.equals("none")?"NONE":mode.equals("shopline")?"SHOPLINE_PENDING":"AUW_V2");p.put("connectorLabel",nativeStore?"Shopify 原生连接":mode.equals("none")?"未选择连接器":mode.equals("shopline")?"Shopline（待开发）":"AUW v2");req.setAttribute("sourceProfile",p);req.setAttribute("selectedShop","custom.example");req.setAttribute("shopifyStore",nativeStore);req.setAttribute("canConfigureSender",true);req.setAttribute("customConnectionCsrf","fixture-csrf");req.setAttribute("logineduser",Map.of("lastName","测试用户","domainid","tenant","id","u"));req.setAttribute("currentStore",Map.of("shopDomain","custom.example","status","ACTIVE"));
   var c=new HashMap<String,Object>();c.put("available",!mode.equals("unavailable"));c.put("featureEnabled",true);c.put("configured",true);c.put("canTest",!mode.equals("readonly"));c.put("canConfigure",true);c.put("shopDomain","custom.example");c.put("version",1);c.put("apiBaseUrl","https://store.example/api/integration/v2/");c.put("state",mode.equals("failed")?"FAILED":"VERIFIED");c.put("lastCheckedAt","2026-10-31T08:00:00Z");if(mode.equals("failed"))c.put("lastErrorCode","SOURCE_AUTH_REJECTED");req.setAttribute("customConnection",c);
   String sync=req.getParameter("sync");if(sync!=null){var status=new HashMap<String,Object>();status.put("available",!sync.equals("unavailable"));status.put("featureEnabled",true);status.put("canManage",true);status.put("signatureState",sync.equals("stale")?"STALE":sync.equals("unverified")?"NOT_VERIFIED":"VERIFIED");status.put("syncState",sync.equals("active")?"ACTIVE":sync.equals("completed")?"COMPLETED":"IDLE");status.put("mode","FULL");status.put("resources",List.of(Map.of("resource","PRODUCT","status","COMPLETED","phase","DONE","receivedRecords",20,"appliedRecords",20),Map.of("resource","CUSTOMER","status","ACTIVE","phase","BASELINE","receivedRecords",12,"appliedRecords",10),Map.of("resource","ORDER","status","QUEUED","phase","QUEUED","receivedRecords",0,"appliedRecords",0)));req.setAttribute("customSync",status);}
   String t15=req.getParameter("t15");if(t15!=null){var automation=new HashMap<String,Object>();automation.put("available",!t15.equals("unavailable"));automation.put("featureEnabled",true);automation.put("canManage",true);automation.put("pollEnabled",true);automation.put("callbackEnabled",true);automation.put("pollIntervalSeconds",300);automation.put("baselineReady",!t15.equals("awaiting"));automation.put("awaitingBaseline",t15.equals("awaiting"));automation.put("hasPendingCallback",true);req.setAttribute("customAutomation",automation);req.setAttribute("customIdentities",Map.of("available",true,"featureEnabled",true,"canManage",true,"linkedOnPage",2,"candidateCount",3));}
   req.getRequestDispatcher("/WEB-INF/"+theme+"/stores.jsp").forward(req,res);
  }});ctx.addServletMappingDecoded("/fixture","fixture");
  try{tomcat.start();var client=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();for(String theme:List.of("shopify","shopify-theme2"))for(String mode:List.of("none","auw","shopline","failed","unavailable","readonly","shopify")){
   var response=client.send(HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+tomcat.getConnector().getLocalPort()+"/web/fixture?theme="+theme+"&mode="+mode)).timeout(Duration.ofSeconds(15)).GET().build(),HttpResponse.BodyHandlers.ofString());assertThat(response.statusCode()).as(response.body()).isEqualTo(200);var doc=Jsoup.parse(response.body());
   if(mode.equals("shopify")){assertThat(doc.select("#store-data-connection")).isEmpty();assertThat(doc.select("form[action$=/stores/sync]")).hasSize(1);continue;}
   var card=doc.getElementById("store-data-connection");assertThat(card).isNotNull();assertThat(card.text()).contains("连接器");assertThat(card.select("input[name=apiBaseUrl],input[name=apiToken],input[name=sourceStoreId],input[name=datasetEpoch],select[name=connectorKey],form[action$=/save],form[action$=/source]")).isEmpty();assertThat(doc.text()).doesNotContain("查看连接配置");
   if(mode.equals("auw")||mode.equals("failed")||mode.equals("readonly")){assertThat(card.text()).contains("https://store.example/api/integration/v2/");assertThat(card.select("form[action$=/stores/custom-connection/test] input[name=_connectionCsrf]").val()).isEqualTo("fixture-csrf");assertThat(card.select("button[disabled]").size()).isEqualTo(mode.equals("readonly")?1:0);}
   if(mode.equals("failed"))assertThat(card.text()).contains("SOURCE_AUTH_REJECTED");if(mode.equals("none"))assertThat(card.text()).contains("未选择连接器");if(mode.equals("shopline"))assertThat(card.text()).contains("待开发");
  }
   for(String theme:List.of("shopify","shopify-theme2"))for(String sync:List.of("completed","active","stale","unverified","unavailable")){
    var response=client.send(HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+tomcat.getConnector().getLocalPort()+"/web/fixture?theme="+theme+"&mode=auw&sync="+sync)).timeout(Duration.ofSeconds(15)).GET().build(),HttpResponse.BodyHandlers.ofString());assertThat(response.statusCode()).as(response.body()).isEqualTo(200);var doc=Jsoup.parse(response.body());var status=doc.selectFirst("#store-sync-status");assertThat(status).isNotNull();
    assertThat(status.select("form,button,input,select,textarea")).isEmpty();assertThat(doc.select("form[action$='/sync/trust'],form[action$='/sync/command']")).isEmpty();
    if(sync.equals("unavailable"))assertThat(status.text()).contains("管理员", "更新");
    else{assertThat(status.text()).contains("数据签名", "同步任务", "TEST", "SUPPRESS", "商品", "客户", "订单", "已处理");assertThat(status.select("tbody tr")).hasSize(3);}
    if(sync.equals("completed"))assertThat(status.text()).contains("签名验证通过", "本批同步完成").doesNotContain("尚未启用客户");
    if(sync.equals("stale"))assertThat(status.text()).contains("重新验证");
   }
   for(String theme:List.of("shopify","shopify-theme2"))for(String state:List.of("ready","awaiting","unavailable")){
    var response=client.send(HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+tomcat.getConnector().getLocalPort()+"/web/fixture?theme="+theme+"&mode=auw&t15="+state)).timeout(Duration.ofSeconds(15)).GET().build(),HttpResponse.BodyHandlers.ofString());assertThat(response.statusCode()).as(response.body()).isEqualTo(200);var doc=Jsoup.parse(response.body());
    assertThat(doc.select("#store-automation-status")).hasSize(1);assertThat(doc.select("#store-identity-status")).hasSize(1);assertThat(doc.select("#store-automation-status form,#store-automation-status input,#store-automation-status button,#store-identity-status form,#store-identity-status input,#store-identity-status button")).isEmpty();assertThat(doc.select("form[action$='/automation/save'],form[action$='/identity/command']")).isEmpty();
    if(state.equals("awaiting"))assertThat(doc.select("#store-automation-status").text()).contains("首次全量");
   }
  }finally{tomcat.stop();tomcat.destroy();}
 }
}
