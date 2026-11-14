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
import static org.assertj.core.api.Assertions.assertThat;

class CampaignDraftAudienceJspRenderingTest {
    @TempDir Path temporary;

    @Test void rendersSavedMultiSelectionsAndPreviewOnlyForAuthorizedDrafts() throws Exception {
        var tomcat = new Tomcat();
        tomcat.setBaseDir(temporary.toString());
        tomcat.setPort(0);
        tomcat.getConnector().setProperty("address","127.0.0.1");
        var ctx = tomcat.addWebapp("/web", Path.of("src/main/resources/META-INF/resources").toAbsolutePath().toString());
        ctx.setParentClassLoader(getClass().getClassLoader());
        ctx.setContainerSciFilter("org.springframework.web.SpringServletContainerInitializer");
        Tomcat.addServlet(ctx,"fixture",new HttpServlet() {
            @Override protected void doGet(HttpServletRequest req, HttpServletResponse res)
                    throws java.io.IOException, javax.servlet.ServletException {
                var editor = new HashMap<String,Object>(Map.of("campaignId","draft-1","existing",true,
                        "status",req.getParameter("status"),"segmentId","seg-a","segmentTagRelation","OR",
                        "includeTags",List.of("VIP"),"excludeTags",List.of("Blocked"),"providers",List.of(),
                        "providerSelections",Map.of(),"campaignVariablesJson","{}"));
                editor.put("templateId","template-1");
                if (!"old".equals(req.getParameter("model"))) editor.put("segmentIds",List.of("seg-a","deleted"));
                req.setAttribute("editorCampaign",editor);
                req.setAttribute("logineduser",Map.of("lastName","测试用户","domainid","tenant","id","user"));
                req.setAttribute("selectedShop","store.example");
                req.setAttribute("canManageCampaigns",true);
                req.setAttribute("canPreviewDraftAudience","yes".equals(req.getParameter("access")));
                req.setAttribute("customerTags",List.of("VIP","Blocked"));
                req.setAttribute("senderSettings",List.of(Map.of("provider","SENDGRID","fromHeader","sender@example.com")));
                req.setAttribute("templates",List.of(Map.of("templateId","template-1","name","邮件模板")));
                req.setAttribute("segments",List.of(Map.of("segmentId","seg-a","name","分群 A","ruleSummary","规则 A"),
                        Map.of("segmentId","seg-b","name","分群 B","ruleSummary","规则 B")));
                req.getRequestDispatcher("/WEB-INF/"+req.getParameter("theme")+"/campaign-editor.jsp").forward(req,res);
            }
        });
        ctx.addServletMappingDecoded("/fixture","fixture");
        try {
            tomcat.start();
            String base = "http://127.0.0.1:"+tomcat.getConnector().getLocalPort()+"/web/fixture?theme=";
            var client = HttpClient.newHttpClient();
            for (String theme:List.of("shopify","shopify-theme2")) {
                var draft = render(client,base+theme+"&status=DRAFT&access=yes");
                assertThat(draft.select("input[name=segmentIds][checked]").eachAttr("value")).containsExactly("seg-a","deleted");
                assertThat(draft.select("input[name=segmentIds]").eachAttr("value")).contains("seg-b");
                assertThat(draft.select("#campaign-segment-multi").text()).contains("原分群已失效");
                assertThat(draft.select("input[name=includeTags][checked]").eachAttr("value")).containsExactly("VIP");
                assertThat(draft.select("[data-draft-preview-open]").attr("type")).isEqualTo("button");
                assertThat(draft.select("[data-draft-preview-open]").text()).as(theme).isEqualTo("预览受众");
                var previewButton = draft.selectFirst(".campaign-audience-relation-options > [data-draft-preview-open]");
                assertThat(previewButton).as(theme).isNotNull();
                assertThat(previewButton.previousElementSibling().select("input[name=segmentTagRelation]").val()).isEqualTo("OR");
                assertThat(draft.select("[data-draft-audience-preview][hidden]")).hasSize(1);
                assertThat(draft.select(".draft-preview-table th").eachText()).as(theme)
                        .containsExactly("客户", "邮箱", "订阅状态", "来源");
                assertThat(draft.select("[data-draft-preview-prev], [data-draft-preview-next]").eachText()).as(theme)
                        .containsExactly("上一页", "下一页");
                assertThat(draft.select("[data-draft-audience-preview]").attr("data-draft-audience-preview"))
                        .startsWith("/web/campaigns/editor/audience-preview");
                assertThat(render(client,base+theme+"&status=PENDING_APPROVAL&access=yes").select("[data-draft-preview-open]")).isEmpty();
                assertThat(render(client,base+theme+"&status=DRAFT&access=no").select("[data-draft-preview-open]")).isEmpty();
                var old = render(client,base+theme+"&status=DRAFT&access=no&model=old");
                assertThat(old.select("select[name=segmentId] option[selected]").eachAttr("value")).containsExactly("seg-a");
                assertThat(old.select("input[name=segmentIds]")).isEmpty();
            }
        } finally { tomcat.stop(); tomcat.destroy(); }
    }

    private org.jsoup.nodes.Document render(HttpClient client,String url) throws Exception {
        var response=client.send(HttpRequest.newBuilder(URI.create(url)).build(),HttpResponse.BodyHandlers.ofString());
        assertThat(response.statusCode()).as(url).isEqualTo(200);
        return Jsoup.parse(response.body());
    }
}
