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
                var customer = Map.of("sourceId", "c1", "displayName", "示例客户", "email", "demo@example.com", "tags", List.of("会员"), "orderCount", 2, "totalSpent", 123, "currency", "USD");
                req.setAttribute("customers", List.of(customer));
                req.setAttribute("customerPage", Map.of("total", 1, "totalExact", true, "page", 1, "totalPages", 1));
                req.setAttribute("customerFilter", Map.of("search", "demo", "tags", List.of()));
                req.setAttribute("behaviorFilterAvailable", true);
                var timeline = Map.of("fromDate", "2026-11-01", "toDate", "2026-11-08", "totalCount", 1,
                        "completeGroups", List.of(Map.of("title", "浏览行为", "count", 1, "collapsed", false,
                                "activities", List.of(Map.of("title", "查看商品", "description", "示例商品", "type", "VIEWED")))));
                req.setAttribute("customerDetail", Map.of("customer", customer, "orders", List.of(), "timelineWindow", timeline));
                req.setAttribute("timelineWindow", timeline);
                req.setAttribute("segmentSearch", "");
                req.setAttribute("segmentPage", Map.of("total", 1, "page", 1, "totalPages", 1));
                req.setAttribute("segments", List.of(Map.of("shopDomain", "a.myshopify.com", "segmentId", "s1", "name", "示例分群", "ruleSummary", "邮箱包含 example", "status", "ACTIVE")));
                req.setAttribute("editorSegment", Map.of("existing", true, "segmentId", "s1", "name", "示例分群", "matchMode", "ALL", "groups", List.of(Map.of("groupId", "g1", "matchMode", "ANY", "rules", List.of(Map.of("field", "EMAIL", "operator", "CONTAINS", "value", "example"))))));
                req.setAttribute("segmentPreview", Map.of("matchedCount", 1, "eligibleCount", 1, "confirmationRequiredCount", 0, "excludedCount", 0, "page", 1, "totalPages", 1, "customers", List.of(Map.of("customerSourceId", "c1", "customerName", "示例客户", "email", "demo@example.com", "orderCount", 1, "totalSpent", 10, "currency", "USD", "consentState", "SUBSCRIBED"))));
                req.setAttribute("automationPage", Map.of("total", 1, "page", 1, "totalPages", 1));
                req.setAttribute("automations", List.of(Map.of("automationId", "a1", "name", "示例自动营销", "status", "DRAFT", "journeyType", "ABANDONED_CART", "waitMinutes", 30, "templateName", "欢迎模板")));
                req.setAttribute("automationStatuses", List.of("DRAFT", "ACTIVE", "PAUSED"));
                req.setAttribute("journeyTypes", List.of("ABANDONED_CART"));
                req.setAttribute("behaviorEventTypes", List.of("CART_UPDATED"));
                if ("scheduled".equals(req.getParameter("mode"))) {
                    var scheduled = new HashMap<>((Map<String, Object>) req.getAttribute("campaignDetail"));
                    scheduled.put("status", "SCHEDULED");
                    scheduled.put("scheduledAt", "2026-12-01T02:00:00Z");
                    req.setAttribute("campaignDetail", scheduled);
                }
                var page = req.getParameter("page");
                if (!List.of("campaigns", "campaign-detail", "campaign-editor", "customers", "customer-detail", "segments", "segment-editor", "fragments/segment-preview-results", "automations").contains(page == null ? "" : page)) page = "dashboard";
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
            assertThat(home.select(".mobile-header").text()).contains("滴答营销", "当前店铺", "切换");
            assertThat(home.select("#mobile-trends-heading").text()).isEqualTo("每日趋势");
            assertThat(home.text()).contains("示例店", "总客户", "25", "营销活动");
            assertThat(home.select("form.mobile-shop select[name=shop] option")).hasSize(2);
            assertThat(home.select("form.mobile-shop").attr("action")).startsWith("/web/mobile/dashboard");
            var result = client.send(HttpRequest.newBuilder(URI.create(root + "?page=campaigns")).timeout(Duration.ofSeconds(15)).build(), HttpResponse.BodyHandlers.ofString());
            assertThat(result.statusCode()).as(result.body()).isEqualTo(200);
            var list = Jsoup.parse(result.body());
            assertThat(list.text()).contains("测试活动", "已完成", "欢迎模板", "25");
            assertThat(list.select("a[href*='/web/mobile/campaigns/detail']")).hasSize(1);
            assertThat(list.select("form.mobile-filter[action='/web/mobile/campaigns']")).hasSize(1);
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
            var scheduledResult = client.send(HttpRequest.newBuilder(URI.create(root + "?page=campaign-detail&mode=scheduled")).build(), HttpResponse.BodyHandlers.ofString());
            assertThat(scheduledResult.statusCode()).as(scheduledResult.body()).isEqualTo(200);
            var scheduled = Jsoup.parse(scheduledResult.body());
            assertThat(scheduled.select("input[name=action][value=RESCHEDULE]")).hasSize(1);
            assertThat(scheduled.select("input[name=action][value=CANCEL_SCHEDULE]")).hasSize(1);
            for (String page : List.of("customers", "customer-detail")) {
                var customerResult = client.send(HttpRequest.newBuilder(URI.create(root + "?page=" + page)).build(), HttpResponse.BodyHandlers.ofString());
                assertThat(customerResult.statusCode()).as(customerResult.body()).isEqualTo(200);
                assertThat(Jsoup.parse(customerResult.body()).text()).contains("示例客户", "demo@example.com", "123");
            }
            for (String page : List.of("segments", "segment-editor", "fragments/segment-preview-results", "automations")) {
                var featureResult = client.send(HttpRequest.newBuilder(URI.create(root + "?page=" + page)).build(), HttpResponse.BodyHandlers.ofString());
                assertThat(featureResult.statusCode()).as(featureResult.body()).isEqualTo(200);
                var feature = Jsoup.parse(featureResult.body());
                if (page.equals("segment-editor")) {
                    assertThat(feature.select("input[name=name]").val()).isEqualTo("示例分群");
                    assertThat(feature.select("input[name=values]").first().val()).isEqualTo("example");
                } else {
                    assertThat(feature.text()).contains(page.equals("automations") ? "示例自动营销" : page.contains("preview") ? "示例客户" : "示例分群");
                    if (page.contains("preview")) {
                        assertThat(feature.select("a[href*='/mobile/customers/detail']")).hasSize(1);
                    }
                }
            }
        } finally { tomcat.stop(); tomcat.destroy(); }
    }
}
