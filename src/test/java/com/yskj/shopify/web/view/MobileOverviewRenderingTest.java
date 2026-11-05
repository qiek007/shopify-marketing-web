package com.yskj.shopify.web.view;

import org.apache.catalina.startup.Tomcat;
import org.jsoup.Jsoup;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.junit.jupiter.api.io.TempDir;
import javax.servlet.http.*;
import java.net.URI;
import java.net.http.*;
import java.nio.file.Path;
import java.time.Duration;
import java.util.*;
import static org.assertj.core.api.Assertions.assertThat;

class MobileOverviewRenderingTest {
    @TempDir Path temporary;

    @Test @Timeout(60) void dashboardAndCampaignsRenderRealDataAndMobileNavigation() throws Exception {
        var tomcat = new Tomcat();
        tomcat.setBaseDir(temporary.toString());
        tomcat.setPort(0);
        tomcat.getConnector().setProperty("address", "127.0.0.1");
        var context = tomcat.addWebapp("/web", Path.of("src/main/resources/META-INF/resources").toAbsolutePath().toString());
        context.setParentClassLoader(getClass().getClassLoader());
        context.setContainerSciFilter("org.springframework.web.SpringServletContainerInitializer");
        Tomcat.addServlet(context, "fixture", new HttpServlet() {
            @Override protected void doGet(HttpServletRequest req, HttpServletResponse res) throws java.io.IOException, javax.servlet.ServletException {
                req.setAttribute("selectedShop", "a.myshopify.com");
                req.setAttribute("selectedShopDisplayName", "示例店");
                req.setAttribute("accessibleShops", List.of(Map.of("shopDomain", "a.myshopify.com", "displayName", "示例店"), Map.of("shopDomain", "b.myshopify.com", "displayName", "第二店")));
                req.setAttribute("overview", Map.of("available", true, "products", 10, "customers", 25, "orders", 4, "activeCampaigns", 3));
                req.setAttribute("campaignPage", Map.of("total", 1, "pageSize", 20, "page", 1, "totalPages", 1, "hasPrevious", false, "hasNext", false));
                req.setAttribute("campaigns", List.of(Map.of("shopDomain", "a.myshopify.com", "campaignId", "c-1", "name", "测试活动", "status", "COMPLETED", "statusDisplayName", "已完成", "templateName", "欢迎模板", "audienceCount", 25, "updatedAt", "2026-11-01")));
                req.setAttribute("canManageCampaigns", true);
                req.setAttribute("campaignDetail", Map.ofEntries(Map.entry("shopDomain", "a.myshopify.com"), Map.entry("campaignId", "c-1"), Map.entry("name", "测试活动"), Map.entry("status", "RUNNING"), Map.entry("templateName", "欢迎模板"), Map.entry("providers", List.of("TEST")), Map.entry("summary", Map.of("audience", 25, "progressPercent", 60, "accepted", 15, "failed", 0, "unknown", 0, "delivered", 10, "orders", 1)), Map.entry("jobs", List.of())));
                req.setAttribute("providerAliases", Map.of("TEST", "测试通道"));
                boolean existing = "existing".equals(req.getParameter("mode"));
                req.setAttribute("editorCampaign", existing ? Map.of("existing", true, "status", "DRAFT", "campaignId", "c-1", "providerSelections", Map.of("TEST", true)) : Map.of("existing", false));
                if (existing) req.setAttribute("successMessage", "测试邮件已提交");
                req.setAttribute("campaignTestRequestToken", "test-token");
                req.setAttribute("templates", List.of(Map.of("status", "PUBLISHED", "templateId", "t-1", "name", "欢迎模板")));
                req.setAttribute("senderSettings", List.of(Map.of("provider", "TEST", "fromHeader", "demo@example.com")));
                var page = req.getParameter("page");
                if (!List.of("campaigns", "campaign-detail", "campaign-editor").contains(page == null ? "" : page)) page = "dashboard";
                req.getRequestDispatcher("/WEB-INF/mobile/" + page + ".jsp").forward(req, res);
            }
        });
        context.addServletMappingDecoded("/fixture", "fixture");
        try {
            tomcat.start();
            var client = HttpClient.newHttpClient();
            var root = "http://127.0.0.1:" + tomcat.getConnector().getLocalPort() + "/web/fixture";
            var dashboard = client.send(HttpRequest.newBuilder(URI.create(root)).timeout(Duration.ofSeconds(15)).build(), HttpResponse.BodyHandlers.ofString());
            assertThat(dashboard.statusCode()).as(dashboard.body()).isEqualTo(200);
            var home = Jsoup.parse(dashboard.body());
            assertThat(home.text()).contains("示例店", "总客户", "25", "营销活动");
            assertThat(home.select("form[action='/web/mobile/dashboard'] select[name=shop] option")).hasSize(2);
            var result = client.send(HttpRequest.newBuilder(URI.create(root + "?page=campaigns")).timeout(Duration.ofSeconds(15)).build(), HttpResponse.BodyHandlers.ofString());
            assertThat(result.statusCode()).as(result.body()).isEqualTo(200);
            var list = Jsoup.parse(result.body());
            assertThat(list.text()).contains("测试活动", "已完成", "欢迎模板", "25");
            assertThat(list.select("a[href*='/web/mobile/campaigns/detail']")).hasSize(1);
            assertThat(list.select("form[action='/web/mobile/campaigns']")).hasSize(1);
            var detailResult = client.send(HttpRequest.newBuilder(URI.create(root + "?page=campaign-detail")).timeout(Duration.ofSeconds(15)).build(), HttpResponse.BodyHandlers.ofString());
            assertThat(detailResult.statusCode()).as(detailResult.body()).isEqualTo(200);
            var detail = Jsoup.parse(detailResult.body());
            assertThat(detail.text()).contains("测试活动", "发送中", "60%", "暂停发送", "取消发送");
            assertThat(detail.select("form[action='/web/mobile/campaigns/action'] input[name=action][value=PAUSE]")).hasSize(1);
            var editorResult = client.send(HttpRequest.newBuilder(URI.create(root + "?page=campaign-editor")).timeout(Duration.ofSeconds(15)).build(), HttpResponse.BodyHandlers.ofString());
            assertThat(editorResult.statusCode()).as(editorResult.body()).isEqualTo(200);
            var editor = Jsoup.parse(editorResult.body());
            assertThat(editor.select("form[action='/web/mobile/campaigns'] select[name=templateId] option[value=t-1]")).hasSize(1);
            assertThat(editor.select("form[action='/web/mobile/campaigns'] input[name=providers][value=TEST]")).hasSize(1);
            assertThat(editor.select("form[action='/web/mobile/campaigns'] input[name=channelWeightsJson][disabled]")).hasSize(1);
            var testResult = client.send(HttpRequest.newBuilder(URI.create(root + "?page=campaign-editor&mode=existing")).timeout(Duration.ofSeconds(15)).build(), HttpResponse.BodyHandlers.ofString());
            assertThat(testResult.statusCode()).as(testResult.body()).isEqualTo(200);
            var testEditor = Jsoup.parse(testResult.body());
            assertThat(testEditor.select("form[action='/web/mobile/campaigns/test-send'] input[name=requestToken]").val()).isEqualTo("test-token");
            assertThat(testEditor.select("[role=status]").text()).contains("测试邮件已提交");
            assertThat(testEditor.select("form[action='/web/mobile/campaigns']")).isEmpty();
        } finally { tomcat.stop(); tomcat.destroy(); }
    }
}
