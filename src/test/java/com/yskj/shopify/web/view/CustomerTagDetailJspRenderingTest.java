package com.yskj.shopify.web.view;

import org.apache.catalina.startup.Tomcat;
import org.jsoup.Jsoup;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import javax.servlet.http.*;
import java.net.URI;
import java.net.http.*;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class CustomerTagDetailJspRenderingTest {
    @TempDir Path temporary;

    @Test
    void customerInfoShowsEscapedTagsAndManagementControlsOnlyWhenAuthorized() throws Exception {
        var tomcat = new Tomcat();
        tomcat.setBaseDir(temporary.toString());
        tomcat.setPort(0);
        tomcat.getConnector().setProperty("address", "127.0.0.1");
        var context = tomcat.addWebapp("/web", Path.of("src/main/resources/META-INF/resources").toAbsolutePath().toString());
        context.setParentClassLoader(getClass().getClassLoader());
        context.setContainerSciFilter("org.springframework.web.SpringServletContainerInitializer");
        Tomcat.addServlet(context, "fixture", new HttpServlet() {
            @Override protected void doGet(HttpServletRequest request, HttpServletResponse response)
                    throws java.io.IOException, javax.servlet.ServletException {
                request.setAttribute("customerDetail", Map.of("customer", Map.of(
                        "sourceId", "customer-1", "shopDomain", "test.example", "sourceType", "SHOPIFY", "consentState", "SUBSCRIBED", "suppressed", false,
                        "tags", List.of("VIP", "常客 <春季>"))));
                request.setAttribute("selectedShop", "test.example");
                request.setAttribute("canEditCustomerTags", Boolean.valueOf(request.getParameter("editable")));
                String theme = "shopify-theme2".equals(request.getParameter("theme")) ? "shopify-theme2" : "shopify";
                request.getRequestDispatcher("/WEB-INF/" + theme + "/fragments/campaign-customer-detail.jsp")
                        .forward(request, response);
            }
        });
        context.addServletMappingDecoded("/fixture", "fixture");
        try {
            tomcat.start();
            var client = HttpClient.newHttpClient();
            for (String theme : List.of("shopify", "shopify-theme2")) {
                for (boolean editable : List.of(true, false)) {
                    String url = "http://127.0.0.1:" + tomcat.getConnector().getLocalPort()
                            + "/web/fixture?theme=" + theme + "&editable=" + editable;
                    var response = client.send(HttpRequest.newBuilder(URI.create(url)).build(), HttpResponse.BodyHandlers.ofString());
                    assertThat(response.statusCode()).isEqualTo(200);
                    var root = Jsoup.parse(response.body()).selectFirst("[data-customer-detail-tags]");
                    assertThat(root).isNotNull();
                    assertThat(root.select("[data-customer-tag-list] .status-pill > span").eachText())
                            .containsExactly("VIP", "常客 <春季>");
                    assertThat(root.select("[data-customer-tag-add] button")).hasSize(editable ? 1 : 0);
                    assertThat(root.select("[data-remove-customer-tag]")).hasSize(editable ? 2 : 0);
                    assertThat(root.select("[data-customer-tag-search][role=combobox]")).hasSize(editable ? 1 : 0);
                    var page = Jsoup.parse(response.body());
                    assertThat(page.select("[data-customer-subscription-value]").text()).isEqualTo("SUBSCRIBED");
                    assertThat(page.select("[data-customer-subscription-form]")).hasSize(editable ? 1 : 0);
                    assertThat(page.select("[data-customer-suppression-value]").text()).isEqualTo("否");
                    assertThat(page.select("[data-customer-suppression-form] button").eachText())
                            .containsExactlyElementsOf(editable ? List.of("加入抑制名单") : List.of());
                    assertThat(page.select("[data-suppression-confirm-dialog] form[method=dialog] button").eachAttr("value"))
                            .containsExactlyElementsOf(editable ? List.of("cancel", "confirm") : List.of());
                    if (editable) {
                        assertThat(page.select("select[name=state] option").eachText())
                                .containsExactly("已订阅", "未订阅", "已退订");
                    }
                }
            }
        } finally {
            tomcat.stop();
            tomcat.destroy();
        }
    }
}
