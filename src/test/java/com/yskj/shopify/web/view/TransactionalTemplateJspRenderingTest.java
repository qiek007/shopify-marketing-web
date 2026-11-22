package com.yskj.shopify.web.view;

import org.apache.catalina.startup.Tomcat;
import org.jsoup.Jsoup;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import javax.servlet.http.*;
import java.net.URI;
import java.net.http.*;
import java.nio.file.*;
import java.util.*;
import static org.assertj.core.api.Assertions.*;

class TransactionalTemplateJspRenderingTest {
    @TempDir Path temporary;
    @Test void bothThemesEscapeDraftsAndRenderReadOnlyWorkspaceWithoutUnsafePreviewPermissions()throws Exception{
        for(String theme:List.of("shopify","shopify-theme2"))assertThat(Path.of("src/main/resources/META-INF/resources/WEB-INF/"+theme+"/transactional-templates.jsp")).exists();
        var tomcat=new Tomcat();tomcat.setBaseDir(temporary.toString());tomcat.setPort(0);tomcat.getConnector().setProperty("address","127.0.0.1");
        var context=tomcat.addWebapp("/web",Path.of("src/main/resources/META-INF/resources").toAbsolutePath().toString());
        context.setParentClassLoader(getClass().getClassLoader());context.setContainerSciFilter("org.springframework.web.SpringServletContainerInitializer");
        Tomcat.addServlet(context,"fixture",new HttpServlet(){
            @Override protected void doGet(HttpServletRequest request,HttpServletResponse response)throws java.io.IOException,javax.servlet.ServletException{
                request.setAttribute("selectedShop","shop.example");request.setAttribute("transactionalTemplateCsrf","test-template-csrf");
                request.setAttribute("transactionalCanConfigure",Boolean.valueOf(request.getParameter("editable")));
                request.setAttribute("transactionalTemplateWorkspace",Map.of("available",true,"defaultLocale","en","purpose","LINK".equals(request.getParameter("purpose"))?"LINK":"CODE","locale","zh-CN","locales",List.of("en","zh-CN"),"templates",List.of(),"draft",Map.of("subject","</textarea><script>bad()</script>","html","<p>{{code}}</p>","text","验证码 {{code}}","revision",7,"exists",true),"versions",List.of(Map.of("versionId","v1","versionNumber",1,"status","ACTIVE","publishedBy","<script>bad()</script>","publishedAt","2026-11-16","active",true),Map.of("versionId","failed","versionNumber",2,"status","FAILED","active",false),Map.of("versionId","stale","versionNumber",3,"status","STALE","active",false),Map.of("versionId","published","versionNumber",4,"status","PUBLISHED","active",false))));
                String theme="shopify-theme2".equals(request.getParameter("theme"))?"shopify-theme2":"shopify";
                request.setAttribute("uiAssetBase","/"+theme);
                request.getRequestDispatcher("/WEB-INF/"+theme+"/transactional-templates.jsp").forward(request,response);
            }
        });context.addServletMappingDecoded("/fixture","fixture");
        try{tomcat.start();var client=HttpClient.newHttpClient();
            for(String theme:List.of("shopify","shopify-theme2"))for(boolean editable:List.of(true,false)){
                var response=client.send(HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+tomcat.getConnector().getLocalPort()+"/web/fixture?theme="+theme+"&editable="+editable)).build(),HttpResponse.BodyHandlers.ofString());
                assertThat(response.statusCode()).as(theme).isEqualTo(200);var page=Jsoup.parse(response.body());
                if(Boolean.getBoolean("templateUiFixture") && editable){
                    Path output=Path.of("../.tmp/template-ui-fixture");java.nio.file.Files.createDirectories(output);
                    String resources=Path.of("src/main/resources/META-INF/resources").toAbsolutePath().toUri().toString();
                    java.nio.file.Files.writeString(output.resolve(theme+".html"),response.body().replace("/web/",resources));
                }
                assertThat(page.select("input[name=subject]").attr("maxlength")).isEqualTo("200");
                assertThat(page.select("#template-locale").first().tagName()).isEqualTo("select");
                assertThat(page.select("#template-locale option").eachAttr("value")).containsExactly("en","zh-CN");
                assertThat(page.select("#template-locale option[selected]").attr("value")).isEqualTo("zh-CN");
                assertThat(page.select("datalist#template-locales")).isEmpty();
                assertThat(page.select("[data-template-current-locale]").text()).isEqualTo("zh-CN");
                assertThat(page.select("form[data-template-new-language]")).hasSize(editable?1:0);
                if(editable){
                    assertThat(page.select("form[data-template-new-language]").attr("method")).isEqualTo("get");
                    assertThat(page.select("form[data-template-new-language] input#template-new-locale[name=locale]")).hasSize(1);
                    assertThat(page.select("form[data-template-new-language] input[name=purpose]").attr("value")).isEqualTo("CODE");
                    assertThat(page.select("form[data-template-new-language] input#template-new-locale").val()).isEmpty();
                }
                assertThat(page.select("input[name=subject]").attr("value")).isEqualTo("</textarea><script>bad()</script>");
                assertThat(page.select("textarea[name=html]").val()).isEqualTo("<p>{{code}}</p>");
                assertThat(page.select(".template-variable-note").text()).contains(
                        "{{validityText}}","{{recipientName}}","{{projectName}}","{{description}}","有效期","接收人","项目","描述");
                var linkResponse=client.send(HttpRequest.newBuilder(URI.create(
                        "http://127.0.0.1:"+tomcat.getConnector().getLocalPort()+"/web/fixture?theme="+theme+"&editable="+editable+"&purpose=LINK")).build(),HttpResponse.BodyHandlers.ofString());
                assertThat(linkResponse.statusCode()).isEqualTo(200);
                assertThat(Jsoup.parse(linkResponse.body()).select(".template-variable-note").text())
                        .contains("{{verificationUrl}}","{{brandName}}")
                        .doesNotContain("{{code}}","{{validityText}}","{{recipientName}}","{{projectName}}","{{description}}");
                assertThat(page.select("script:not([src])")).isEmpty();
                assertThat(page.select("iframe[data-template-preview]").attr("sandbox")).isEmpty();
                assertThat(page.select("iframe[data-template-preview]").hasAttr("sandbox")).isTrue();
                assertThat(page.select("iframe[data-template-preview]").hasAttr("inert")).isFalse();
                assertThat(page.select("iframe[data-template-preview]").attr("tabindex")).isEqualTo("0");
                assertThat(page.select("[data-template-editor] fieldset[disabled]")).hasSize(editable?0:1);
                assertThat(page.select("[data-template-save]")).hasSize(editable?1:0);
                assertThat(page.select(".template-editor-panel [data-template-save], .template-editor-panel [data-template-publish]")).isEmpty();
                assertThat(page.select(".template-draft-bar [data-template-save]")).hasSize(editable?1:0);
                assertThat(page.select(".template-draft-bar [data-template-publish]")).hasSize(editable?1:0);
                assertThat(page.select("[data-template-save-hint], [data-preview-caption]")).isEmpty();
                assertThat(page.select(".template-draft-bar ~ .template-columns")).hasSize(1);
                if(editable){
                    String editorId=page.select("form[data-template-editor]").attr("id");
                    assertThat(editorId).isNotBlank();
                    assertThat(page.select("[data-template-save]").attr("type")).isEqualTo("submit");
                    assertThat(page.select("[data-template-save]").attr("form")).isEqualTo(editorId);
                    assertThat(page.select("[data-template-publish]").attr("type")).isEqualTo("button");
                }
                assertThat(page.select("input[name=_transactionalTemplateCsrf]").attr("value")).isEqualTo("test-template-csrf");
                assertThat(page.select("[data-template-publish]")).hasSize(editable?1:0);
                assertThat(page.select("[data-template-publish]:not([disabled])")).isEmpty();
                assertThat(page.select("[data-template-rollback]")).hasSize(editable?1:0);
                assertThat(page.select("[data-template-rollback=failed], [data-template-rollback=stale]")).isEmpty();
                assertThat(page.text()).doesNotContain("测试发送","test send");
            }
        }finally{tomcat.stop();tomcat.destroy();}
    }
}
