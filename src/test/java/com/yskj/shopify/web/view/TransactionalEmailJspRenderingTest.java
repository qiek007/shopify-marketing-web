package com.yskj.shopify.web.view;

import org.apache.catalina.startup.Tomcat;
import org.jsoup.Jsoup;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import javax.servlet.http.*;
import java.net.URI;
import java.net.http.*;
import java.nio.file.Path;
import java.util.*;
import static org.assertj.core.api.Assertions.*;

class TransactionalEmailJspRenderingTest {
    @TempDir Path temporary;
    @Test void bothThemesRenderEscapedConfigurationAndDisableUnauthorizedEditing()throws Exception{
        var tomcat=new Tomcat();tomcat.setBaseDir(temporary.toString());tomcat.setPort(0);
        tomcat.getConnector().setProperty("address","127.0.0.1");
        var context=tomcat.addWebapp("/web",Path.of("src/main/resources/META-INF/resources").toAbsolutePath().toString());
        context.setParentClassLoader(getClass().getClassLoader());context.setContainerSciFilter("org.springframework.web.SpringServletContainerInitializer");
        Tomcat.addServlet(context,"fixture",new HttpServlet(){
            @Override protected void doGet(HttpServletRequest request,HttpServletResponse response)throws java.io.IOException,javax.servlet.ServletException{
                request.setAttribute("selectedShop","shop.example");request.setAttribute("transactionalEmailCsrf","test-csrf");
                request.setAttribute("transactionalCanConfigure",Boolean.valueOf(request.getParameter("editable")));
                request.setAttribute("transactionalSettings",Map.of("featureEnabled",true,"enabled",true,"defaultProvider","MAILGUN","linkDomains",List.of("shop.example","<script>alert(1)</script>"),"dailyLimit",1000,"minuteLimit",60,"recipientIntervalSeconds",60));
                request.setAttribute("transactionalChannels",List.of(Map.of("provider","MAILGUN","sender","sender@shop.example")));
                request.setAttribute("providerAliases",Map.of("MAILGUN","邮件通道"));
                request.setAttribute("transactionalQuota",Map.of("availableCount",99,"reservedCount",1));
                request.setAttribute("transactionalSummary",Map.of("counts",List.of(),"recentMessages",List.of()));
                String theme="shopify-theme2".equals(request.getParameter("theme"))?"shopify-theme2":"shopify";
                request.getRequestDispatcher("/WEB-INF/"+theme+"/transactional-email.jsp").forward(request,response);
            }
        });context.addServletMappingDecoded("/fixture","fixture");
        try{
            tomcat.start();var client=HttpClient.newHttpClient();
            for(String theme:List.of("shopify","shopify-theme2"))for(boolean editable:List.of(true,false)){
                var response=client.send(HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+tomcat.getConnector().getLocalPort()+"/web/fixture?theme="+theme+"&editable="+editable)).build(),HttpResponse.BodyHandlers.ofString());
                assertThat(response.statusCode()).as(theme).isEqualTo(200);
                var page=Jsoup.parse(response.body());
                assertThat(page.select("textarea[name=linkDomains]").text()).contains("<script>alert(1)</script>");
                assertThat(page.select("textarea script")).isEmpty();
                assertThat(page.select("form[data-transactional-email-settings] button[type=submit]")).hasSize(editable?1:0);
                assertThat(page.select("fieldset[disabled]")).hasSize(editable?0:1);
                assertThat(page.select("input[name=_transactionalCsrf]").attr("value")).isEqualTo("test-csrf");
                assertThat(page.text()).doesNotContain("verificationUrl", "templateVariablesJson");
            }
        }finally{tomcat.stop();tomcat.destroy();}
    }
}
