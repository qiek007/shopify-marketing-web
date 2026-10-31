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
   var c=new HashMap<String,Object>();c.put("available",!mode.equals("unavailable"));c.put("featureEnabled",true);c.put("configured",true);c.put("canTest",!mode.equals("readonly"));c.put("canConfigure",true);c.put("shopDomain","custom.example");c.put("version",1);c.put("apiBaseUrl","https://store.example/api/integration/v2/");c.put("state",mode.equals("failed")?"FAILED":"VERIFIED");c.put("lastCheckedAt","2026-10-31T08:00:00Z");if(mode.equals("failed"))c.put("lastErrorCode","SOURCE_AUTH_REJECTED");req.setAttribute("customConnection",c);req.getRequestDispatcher("/WEB-INF/"+theme+"/stores.jsp").forward(req,res);
  }});ctx.addServletMappingDecoded("/fixture","fixture");
  try{tomcat.start();var client=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();for(String theme:List.of("shopify","shopify-theme2"))for(String mode:List.of("none","auw","shopline","failed","unavailable","readonly","shopify")){
   var response=client.send(HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+tomcat.getConnector().getLocalPort()+"/web/fixture?theme="+theme+"&mode="+mode)).timeout(Duration.ofSeconds(15)).GET().build(),HttpResponse.BodyHandlers.ofString());assertThat(response.statusCode()).as(response.body()).isEqualTo(200);var doc=Jsoup.parse(response.body());
   if(mode.equals("shopify")){assertThat(doc.select("#store-data-connection")).isEmpty();assertThat(doc.select("form[action$=/stores/sync]")).hasSize(1);continue;}
   var card=doc.getElementById("store-data-connection");assertThat(card).isNotNull();assertThat(card.text()).contains("连接器");assertThat(card.select("input[name=apiBaseUrl],input[name=apiToken],input[name=sourceStoreId],input[name=datasetEpoch],select[name=connectorKey],form[action$=/save],form[action$=/source]")).isEmpty();assertThat(doc.text()).doesNotContain("查看连接配置");
   if(mode.equals("auw")||mode.equals("failed")||mode.equals("readonly")){assertThat(card.text()).contains("https://store.example/api/integration/v2/");assertThat(card.select("form[action$=/stores/custom-connection/test] input[name=_connectionCsrf]").val()).isEqualTo("fixture-csrf");assertThat(card.select("button[disabled]").size()).isEqualTo(mode.equals("readonly")?1:0);}
   if(mode.equals("failed"))assertThat(card.text()).contains("SOURCE_AUTH_REJECTED");if(mode.equals("none"))assertThat(card.text()).contains("未选择连接器");if(mode.equals("shopline"))assertThat(card.text()).contains("待开发");
  }}finally{tomcat.stop();tomcat.destroy();}
 }
}
