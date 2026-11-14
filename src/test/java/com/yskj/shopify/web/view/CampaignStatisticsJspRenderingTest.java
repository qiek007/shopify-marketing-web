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
import java.util.*;
import static org.assertj.core.api.Assertions.assertThat;
class CampaignStatisticsJspRenderingTest {
 @TempDir Path temporary;
 @Test @Timeout(90) void bothThemesRenderRealStatisticsOnlyWhenReadyAndSupportOlderBackends() throws Exception {
  var tomcat=new Tomcat();tomcat.setBaseDir(temporary.toString());tomcat.setPort(0);tomcat.getConnector().setProperty("address","127.0.0.1");
  var ctx=tomcat.addWebapp("/web",Path.of("src/main/resources/META-INF/resources").toAbsolutePath().toString());ctx.setParentClassLoader(getClass().getClassLoader());ctx.setContainerSciFilter("org.springframework.web.SpringServletContainerInitializer");
  Tomcat.addServlet(ctx,"fixture",new HttpServlet(){@Override protected void doGet(HttpServletRequest req,HttpServletResponse res)throws java.io.IOException,javax.servlet.ServletException{
   String mode=req.getParameter("mode");boolean ready=List.of("INCREMENTAL","FROZEN","FROZEN_CONTROL","legacy").contains(mode);boolean savedLegacy=mode.startsWith("SAVED_LEGACY");
   var summary=new HashMap<String,Object>();for(String key:List.of("audience","recipients","accepted"))summary.put(key,291644);
   for(String key:List.of("pending","failed","unknown","complained"))summary.put(key,0);
   summary.put("delivered",222656);summary.put("opened",6516);summary.put("clicked",2006);summary.put("openedRecipients",5691);summary.put("clickedRecipients",641);
   summary.put("orders",2);summary.put("convertedRecipients",1);summary.put("netRevenue","42.50");summary.put("bounced",68773);summary.put("unsubscribed",17);summary.put("unsubscribedRecipients",16);summary.put("progressPercent",100);
   boolean partial=mode.startsWith("FROZEN_PARTIAL")||savedLegacy;
    boolean finance=ready||(partial&&!savedLegacy&&!mode.equals("FROZEN_PARTIAL_NO_FINANCE"));
    if(!mode.equals("legacy")){
     summary.put("statisticsStatus",partial?"FROZEN_PARTIAL":mode.equals("FROZEN_CONTROL")?"FROZEN":mode);summary.put("statisticsReady",ready);summary.put("statisticsPartial",partial);
     summary.put("sendingStatisticsAvailable",ready||mode.equals("INITIALIZING"));summary.put("outcomeStatisticsAvailable",ready||(partial&&!savedLegacy));
     summary.put("eventStatisticsAvailable",ready||partial);summary.put("financialStatisticsAvailable",finance);summary.put("riskTotalAvailable",ready);
    }
    if(partial){summary.put("orders",0);summary.put("convertedRecipients",0);summary.put("netRevenue","0.0000");summary.remove("openedRecipients");summary.remove("clickedRecipients");summary.remove("unsubscribedRecipients");}
    if(savedLegacy){
     boolean siteD=mode.equals("SAVED_LEGACY_SITED"),zero=mode.equals("SAVED_LEGACY_ZERO"),missing=mode.equals("SAVED_LEGACY_MISSING");
     summary.put("savedLegacyEvents",missing?Map.of("available",false):Map.of("delivered",zero?0:siteD?185:21475,"bounced",zero?0:siteD?4:438,"converted",0));
     summary.put("opened",zero?0:siteD?27:8289);summary.put("clicked",zero?0:siteD?367:1649);summary.put("unsubscribed",zero||siteD?0:34);summary.put("preservedEventStatistics",true);
     if(!mode.equals("SAVED_LEGACY_NO_FREEZE")&&!missing){summary.put("openedRecipients",zero?0:siteD?19:3797);summary.put("clickedRecipients",zero?0:siteD?20:154);}
     if(mode.equals("SAVED_LEGACY_OCT_17")){
      summary.putAll(Map.of("audience",81,"accepted",81,"opened",98,"clicked",0,"unsubscribed",1,"openedRecipients",34,"clickedRecipients",0));
      summary.put("savedLegacyEvents",Map.of("delivered",79,"bounced",2,"converted",0));
     }
    }
    if(mode.equals("FROZEN_CONTROL")){summary.putAll(Map.of("audience",960,"accepted",960,"delivered",959,"bounced",1,"opened",118,"openedRecipients",96,"clicked",456,"clickedRecipients",37,"unsubscribed",1,"unsubscribedRecipients",1));summary.put("orders",0);summary.put("convertedRecipients",0);summary.put("netRevenue","0.0");}
   var detail=new HashMap<String,Object>();detail.put("shopDomain","store.example");detail.put("campaignId","cmp");detail.put("name","测试活动");detail.put("status","COMPLETED");detail.put("summary",summary);detail.put("jobs",List.of());detail.put("providers",List.of("INFOBIP"));detail.put("audienceReady",true);detail.put("snapshotStatus","READY");detail.put("ga4Evaluation",Map.of("configured",false,"showMetrics",false,"status","NOT_CONNECTED"));
    if(partial&&!mode.equals("FROZEN_PARTIAL_NO_JOBS")){detail.put("legacySendingProgress",Map.of("total",291644,"processed",291644,"accepted",291644,"progressPercent",100));detail.put("jobs",List.of(Map.of("jobId","job-1","status","COMPLETED","provider","INFOBIP","total",291644,"processed",291644,"accepted",291644,"progressPercent",100)));}
   req.setAttribute("campaignDetail",detail);req.setAttribute("campaignFilter",Map.of("search","","provider","ALL","lifecycle","ALL","page",1,"pageSize",10));req.setAttribute("logineduser",Map.of("lastName","测试用户","domainid","tenant","id","user"));req.setAttribute("selectedShop","store.example");req.setAttribute("campaignActors",Map.of());
   req.getRequestDispatcher("/WEB-INF/"+req.getParameter("theme")+"/campaign-detail.jsp").forward(req,res);
  }});ctx.addServletMappingDecoded("/fixture","fixture");
  try {tomcat.start();var client=HttpClient.newHttpClient();
   for(String theme:List.of("shopify","shopify-theme2","mobile"))for(String mode:List.of("INCREMENTAL","FROZEN","FROZEN_CONTROL","INITIALIZING","ARCHIVE_PENDING","legacy","FROZEN_PARTIAL","FROZEN_PARTIAL_NO_FINANCE","FROZEN_PARTIAL_NO_JOBS","SAVED_LEGACY_US","SAVED_LEGACY_SITED","SAVED_LEGACY_ZERO","SAVED_LEGACY_MISSING","SAVED_LEGACY_NO_FREEZE","SAVED_LEGACY_OCT_17")) {
    // Match browser requests so JSTL resolves a formatting locale instead of echoing the raw Number.
    var response=client.send(HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+tomcat.getConnector().getLocalPort()+"/web/fixture?theme="+theme+"&mode="+mode)).header("Accept-Language","zh-CN,zh;q=0.9").build(),HttpResponse.BodyHandlers.ofString());
    assertThat(response.statusCode()).as(response.body()).isEqualTo(200);var doc=Jsoup.parse(response.body());boolean ready=List.of("INCREMENTAL","FROZEN","FROZEN_CONTROL","legacy").contains(mode);
    boolean savedLegacy=mode.startsWith("SAVED_LEGACY");
    if(savedLegacy){
     boolean missing=mode.equals("SAVED_LEGACY_MISSING"),zero=mode.equals("SAVED_LEGACY_ZERO"),siteD=mode.equals("SAVED_LEGACY_SITED");
     var delivered=theme.equals("mobile")?doc.select(".md-detail-metric").get(2):doc.selectFirst("#campaign-delivered").parent();
     if(mode.equals("SAVED_LEGACY_OCT_17")) {
      var metrics=theme.equals("mobile")?doc.select(".md-detail-metric"):doc.select(".campaign-kpi-grid article");
      assertThat(delivered.text()).contains("79 次","34 人 / 98 次","0 人 / 0 次");
      assertThat(metrics.get(3).text()).contains("0 次","历史未记录");
      assertThat(metrics.get(4).text()).contains("风险反馈（历史事件口径）","3 次","退信记录 2 次","退订事件 1 次");
      assertThat(doc.text()).doesNotContain("统计正在后台准备");
      continue;
     }
     var conversion=theme.equals("mobile")?doc.select(".md-detail-metric").get(3):doc.selectFirst("#campaign-orders").parent();
     var risk=theme.equals("mobile")?doc.select(".md-detail-metric").get(4):doc.selectFirst("#campaign-risk").parent();
     assertThat(doc.text()).contains("已显示历史保留统计").doesNotContain("统计正在后台准备");
     assertThat(delivered.selectFirst("strong").text()).isEqualTo(missing?"—":(zero?"0":siteD?"185":"21475")+" 次");
     assertThat(conversion.selectFirst("strong").text()).isEqualTo(missing?"—":"0 次");
     if(!missing){assertThat(delivered.text()).contains("送达累计记录","历史事件口径","去重送达人数历史未记录");assertThat(conversion.text()).contains("原转化记录","订单、客户及金额历史未记录").doesNotContain("0 单");assertThat(risk.selectFirst("strong").text()).isEqualTo((zero?"0":siteD?"4":"472")+" 次");assertThat(risk.text()).contains("原退信记录","投诉 0 次","退订事件","去重人数历史未记录");}
     if(mode.equals("SAVED_LEGACY_US"))assertThat(delivered.text()).contains("3797 人 / 8289 次","154 人 / 1649 次");
     if(siteD)assertThat(delivered.text()).contains("19 人 / 27 次","20 人 / 367 次");
     if(mode.equals("SAVED_LEGACY_NO_FREEZE"))assertThat(delivered.text()).contains("打开 历史未记录 / 8289 次","点击 历史未记录 / 1649 次");
     continue;
    }
    if(theme.equals("mobile")){if(mode.equals("FROZEN_CONTROL")){assertThat(doc.select(".md-detail-metric").get(2).text()).contains("959","96 人 / 118 次","37 人 / 456 次");assertThat(doc.select(".md-detail-metric").get(3).text()).contains("0 单");}continue;}
    if(mode.equals("FROZEN_CONTROL")){assertThat(doc.selectFirst("#campaign-delivered").text()).isEqualTo("959");assertThat(doc.selectFirst("#campaign-delivery-rate").text()).as(theme+" "+doc.selectFirst("#campaign-delivery-rate").outerHtml()).contains("99.9%","959 / 960");assertThat(doc.selectFirst("#campaign-risk").text()).isEqualTo("2");assertThat(doc.selectFirst("#campaign-orders").text()).isEqualTo("0 单");continue;}
    boolean partial=mode.startsWith("FROZEN_PARTIAL");
    assertThat(doc.selectFirst("#campaign-delivered").text()).isEqualTo(ready||partial?"222656":"—");
    assertThat(doc.selectFirst("#campaign-orders").text()).isEqualTo(ready?"2 单":partial&&!mode.equals("FROZEN_PARTIAL_NO_FINANCE")?"0 单":"—");
    assertThat(doc.selectFirst("#campaign-statistics-state").hasAttr("hidden")).isEqualTo(ready);
    if(!ready)assertThat(doc.selectFirst("#campaign-statistics-state").text()).contains(partial?"已显示原固化统计，缺失字段标为历史未记录":mode.equals("ARCHIVE_PENDING")?"未找到完整历史固化统计":"统计正在后台准备");
    if(partial){assertThat(doc.selectFirst("#campaign-delivery-note").text()).contains("6516 次","2006 次");assertThat(doc.selectFirst("#campaign-risk-note").text()).contains("退信 68773","退订事件 17");assertThat(doc.selectFirst("#campaign-risk").text()).isEqualTo("68790");assertThat(doc.selectFirst("#campaign-risk-label").text()).contains("历史事件口径");assertThat(doc.selectFirst("#campaign-risk-note").text()).contains("历史未记录去重人数");}
    if(partial&&!mode.equals("FROZEN_PARTIAL_NO_JOBS")){assertThat(doc.selectFirst("#campaign-send-note").text()).contains("原最终任务计数","291644 / 291644").doesNotContain("失败","未知");assertThat(doc.selectFirst("#campaign-delivery-rate").text()).contains("原最终任务计数");}
    assertThat(doc.selectFirst("#campaign-send-progress").text()).isEqualTo(mode.equals("ARCHIVE_PENDING")||mode.equals("FROZEN_PARTIAL_NO_JOBS")?"—":"100%");
   }
  } finally {tomcat.stop();tomcat.destroy();}
 }
}
