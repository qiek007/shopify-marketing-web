package com.yskj.shopify.web.view;

import org.apache.catalina.startup.Tomcat;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.junit.jupiter.api.io.TempDir;
import javax.servlet.http.*;
import java.nio.file.Path;
import java.net.URI;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import static org.assertj.core.api.Assertions.assertThat;

class CampaignListContextJspRenderingTest {
    @TempDir Path temporary;
    static final String SEARCH="春季 A&B \"<tag>";
    static String encoded(String value){return URLEncoder.encode(value,StandardCharsets.UTF_8);}
    static Map<String,String> parameters(String href){
        var result=new LinkedHashMap<String,String>();String query=URI.create(href).getRawQuery();
        if(query!=null)for(String pair:query.split("&")){String[] p=pair.split("=",2);result.put(URLDecoder.decode(p[0],StandardCharsets.UTF_8),URLDecoder.decode(p.length>1?p[1]:"",StandardCharsets.UTF_8));}
        return result;
    }
    @Test @Timeout(120)
    void keepsOriginPageAndFiltersAcrossListDetailAndRefreshWithoutArbitraryReturnUrls() throws Exception {
        var tomcat=new Tomcat();tomcat.setBaseDir(temporary.toString());tomcat.setPort(0);
        tomcat.getConnector().setProperty("address","127.0.0.1");tomcat.getConnector().setURIEncoding("UTF-8");
        var ctx=tomcat.addWebapp("/web",Path.of("src/main/resources/META-INF/resources").toAbsolutePath().toString());
        ctx.setParentClassLoader(getClass().getClassLoader());ctx.setContainerSciFilter("org.springframework.web.SpringServletContainerInitializer");
        Tomcat.addServlet(ctx,"fixture",new HttpServlet(){@Override protected void doGet(HttpServletRequest req,HttpServletResponse res)throws java.io.IOException,javax.servlet.ServletException {
            req.setAttribute("logineduser",Map.of("lastName","测试用户","domainid","tenant","id","user"));
            req.setAttribute("selectedShop","store.example");req.setAttribute("campaignStatuses",List.of());
            req.setAttribute("campaignSearch",SEARCH);req.setAttribute("campaignStatus","COMPLETED");
            req.setAttribute("campaignFromDate","2026-10-01");req.setAttribute("campaignToDate","2026-11-12");
            req.setAttribute("campaignPage",Map.of("page",6,"pageSize",10,"total",77,"totalPages",8,"hasPrevious",true,"hasNext",true));
            req.setAttribute("campaigns",List.of(Map.of("shopDomain","store.example","campaignId","cmp&1","name","测试活动","status","COMPLETED","statusDisplayName","已完成","templateName","模板","audienceCount",291644,"snapshotStatus","READY")));
            var summary=new HashMap<String,Object>();for(String key:List.of("audience","recipients","accepted"))summary.put(key,291644);
            for(String key:List.of("pending","failed","unknown","complained","unsubscribed","orders","convertedRecipients","bounced"))summary.put(key,0);
            summary.put("delivered",222664);summary.put("opened",6892);summary.put("clicked",2017);summary.put("openedRecipients",6015);summary.put("clickedRecipients",648);summary.put("netRevenue","0.0000");summary.put("progressPercent",100);
            var detail=new HashMap<String,Object>();detail.put("shopDomain","store.example");detail.put("campaignId","cmp&1");detail.put("name","测试活动");detail.put("status","COMPLETED");detail.put("summary",summary);detail.put("jobs",List.of());detail.put("providers",List.of("INFOBIP"));detail.put("audienceReady",true);detail.put("snapshotStatus","READY");detail.put("ga4Evaluation",Map.of("configured",false,"showMetrics",false,"status","NOT_CONNECTED"));
            req.setAttribute("campaignDetail",detail);req.setAttribute("campaignFilter",Map.of("search","recipient filter","provider","ALL","lifecycle","ALL","page",9,"pageSize",80));req.setAttribute("campaignActors",Map.of());
            String screen="detail".equals(req.getParameter("screen"))?"campaign-detail.jsp":"campaigns.jsp";
            req.getRequestDispatcher("/WEB-INF/"+req.getParameter("theme")+"/"+screen).forward(req,res);
        }});ctx.addServletMappingDecoded("/fixture","fixture");
        try {
            tomcat.start();String base="http://127.0.0.1:"+tomcat.getConnector().getLocalPort()+"/web/fixture";
            var client=HttpClient.newHttpClient();
            for(String theme:List.of("shopify","shopify-theme2","mobile")) {
                var listing=fetch(client,base+"?theme="+theme+"&screen=list");
                var links=listing.select("a[href*=/campaigns/detail]");assertThat(links).hasSize(theme.equals("mobile")?1:2);
                String target=links.first().attr("href");var origin=parameters(target);
                assertThat(routePath(target)).isEqualTo(theme.equals("mobile")?"/web/mobile/campaigns/detail":"/web/campaigns/detail");
                assertThat(origin).containsEntry("shop","store.example").containsEntry("campaignId","cmp&1").containsEntry("listPage","6").containsEntry("listSize","10").containsEntry("listQ",SEARCH).containsEntry("listStatus","COMPLETED").containsEntry("listFromDate","2026-10-01").containsEntry("listToDate","2026-11-12");
                assertThat(links.eachAttr("href")).allMatch(target::equals);
                String sourceQuery=URI.create(target).getRawQuery();
                var detail=fetch(client,base+"?theme="+theme+"&screen=detail&"+sourceQuery+"&page=9&size=80&q=recipient&returnUrl="+encoded("https://evil.example/"));
                String back=detail.selectFirst(theme.equals("mobile")?"a.md-detail-back":"a.back-link").attr("href");
                assertThat(routePath(back)).isEqualTo(theme.equals("mobile")?"/web/mobile/campaigns":"/web/campaigns");
                assertThat(URI.create(back).getHost()).isNull();assertThat(back).doesNotContain("evil.example");
                assertThat(parameters(back)).containsEntry("shop","store.example").containsEntry("page","6").containsEntry("size","10").containsEntry("q",SEARCH).containsEntry("status","COMPLETED").containsEntry("fromDate","2026-10-01").containsEntry("toDate","2026-11-12");
                String refresh=detail.selectFirst(theme.equals("mobile")?".md-detail-toolbar a":"#campaign-detail-refresh").attr("href");
                assertThat(parameters(refresh)).containsEntry("listPage","6").containsEntry("listSize","10").containsEntry("listQ",SEARCH).containsEntry("listStatus","COMPLETED");
                var direct=fetch(client,base+"?theme="+theme+"&screen=detail&returnUrl="+encoded("//evil.example/"));
                String directBack=direct.selectFirst(theme.equals("mobile")?"a.md-detail-back":"a.back-link").attr("href");
                assertThat(parameters(directBack)).containsEntry("page","1").containsEntry("size","10").containsEntry("q","");assertThat(directBack).doesNotContain("evil.example");
            }
        } finally {tomcat.stop();tomcat.destroy();}
    }
    static Document fetch(HttpClient client,String uri)throws Exception {
        var response=client.send(HttpRequest.newBuilder(URI.create(uri)).build(),HttpResponse.BodyHandlers.ofString());
        assertThat(response.statusCode()).as(response.body()).isEqualTo(200);return Jsoup.parse(response.body());
    }
    private static String routePath(String href){return URI.create(href).getPath().replaceAll(";jsessionid=[A-Za-z0-9._-]+", "");}
}
