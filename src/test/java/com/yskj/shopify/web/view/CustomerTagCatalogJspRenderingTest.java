package com.yskj.shopify.web.view;

import org.apache.catalina.startup.Tomcat;
import org.jsoup.Jsoup;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URI;
import java.net.URLDecoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class CustomerTagCatalogJspRenderingTest {
    @TempDir Path temporary;

    @Test
    void rendersCreationAndFirstUseAndOnlyOffersToDeleteEmptyTags() throws Exception {
        var tomcat = new Tomcat();
        tomcat.setBaseDir(temporary.toString());
        tomcat.setPort(0);
        tomcat.getConnector().setProperty("address", "127.0.0.1");
        var context = tomcat.addWebapp("/web", Path.of("src/main/resources/META-INF/resources")
                .toAbsolutePath().toString());
        context.setParentClassLoader(getClass().getClassLoader());
        context.setContainerSciFilter("org.springframework.web.SpringServletContainerInitializer");
        Tomcat.addServlet(context, "fixture", new HttpServlet() {
            @Override protected void doGet(HttpServletRequest request, HttpServletResponse response)
                    throws IOException, ServletException {
                request.setAttribute("selectedShop", "demo.example");
                request.setAttribute("logineduser", Map.of("lastName", "管理员"));
                request.setAttribute("uiAssetBase", "/shopify");
                request.setAttribute("tagPage", Map.of("rows", List.of(
                                Map.of("name", "<New & VIP>", "time", "2026-11-27T08:00:00Z",
                                        "firstUse", false, "hasCustomers", false),
                                Map.of("name", "Used", "time", "2026-11-20T08:00:00Z",
                                        "firstUse", true, "hasCustomers", true)),
                        "totalElements", 12, "pageNumber", 1, "totalPages", 2, "search", "VIP & Gold"));
                String theme = "shopify-theme2".equals(request.getParameter("theme")) ? "shopify-theme2" : "shopify";
                request.getRequestDispatcher("/WEB-INF/" + theme + "/customer-tag-catalog.jsp")
                        .forward(request, response);
            }
        });
        context.addServletMappingDecoded("/fixture", "fixture");

        try {
            tomcat.start();
            var client = HttpClient.newHttpClient();
            for (String theme : List.of("shopify", "shopify-theme2")) {
                var uri = URI.create("http://127.0.0.1:" + tomcat.getConnector().getLocalPort()
                        + "/web/fixture?theme=" + theme);
                var response = client.send(HttpRequest.newBuilder(uri).build(), HttpResponse.BodyHandlers.ofString());
                assertThat(response.statusCode()).as(theme).isEqualTo(200);
                var page = Jsoup.parse(response.body());
                assertThat(page.select("form.tag-catalog-create button").text()).isEqualTo("添加标签");
                var search = page.selectFirst("form.tag-catalog-search");
                assertThat(search).isNotNull();
                assertThat(search.attr("method")).isEqualTo("get");
                assertThat(search.select("input[name=shop]").val()).isEqualTo("demo.example");
                assertThat(search.select("input[name=q]").val()).isEqualTo("VIP & Gold");
                String nextPage = page.select(".pagination a").attr("href");
                assertThat(URLDecoder.decode(nextPage, StandardCharsets.UTF_8))
                        .contains("q=VIP & Gold", "page=2", "shop=demo.example");
                var rows = page.select("table tbody tr");
                assertThat(rows).hasSize(2);
                assertThat(rows.get(0).select("strong").text()).isEqualTo("<New & VIP>");
                assertThat(rows.get(0).select("input[name=confirm]").val()).isEqualTo("DELETE_EMPTY_TAG");
                var href = rows.get(0).select("a").attr("href");
                assertThat(href).contains("/customers", "shop=demo.example");
                assertThat(URLDecoder.decode(URI.create(href).getRawQuery().split("tag=", 2)[1],
                        StandardCharsets.UTF_8)).isEqualTo("<New & VIP>");
                assertThat(rows.get(1).text()).contains("首次使用");
                assertThat(rows.get(1).select("form")).isEmpty();
            }
        } finally {
            tomcat.stop();
            tomcat.destroy();
        }
    }
}
