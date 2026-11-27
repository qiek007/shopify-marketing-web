package com.yskj.shopify.web.view;

import org.apache.catalina.startup.Tomcat;
import org.jsoup.Jsoup;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.junit.jupiter.api.io.TempDir;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class StoreQuotaHistoryJspRenderingTest {
    @TempDir Path temporary;

    @Test
    @Timeout(90)
    void dateFilterKeepsBothBoundsOnPaginationAndClearsBackToTheShop() throws Exception {
        Tomcat tomcat = new Tomcat();
        tomcat.setBaseDir(temporary.toString());
        tomcat.setPort(0);
        tomcat.getConnector().setProperty("address", "127.0.0.1");
        var context = tomcat.addWebapp("/web",
                Path.of("src/main/resources/META-INF/resources").toAbsolutePath().toString());
        context.setParentClassLoader(getClass().getClassLoader());
        context.setContainerSciFilter("org.springframework.web.SpringServletContainerInitializer");
        Tomcat.addServlet(context, "fixture", new HttpServlet() {
            @Override
            protected void doGet(HttpServletRequest request, HttpServletResponse response)
                    throws IOException, ServletException {
                request.setAttribute("selectedShop", "shop.example");
                request.setAttribute("selectedShopDisplayName", "演示店铺");
                request.setAttribute("logineduser", Map.of("lastName", "测试用户"));
                request.setAttribute("quotaFromDate", "2026-11-25");
                request.setAttribute("quotaToDate", "2026-11-27");
                request.setAttribute("quotaLedgerAvailable", true);
                request.setAttribute("quotaLedger", Map.of("pageNumber", 2, "pageSize", 20,
                        "totalElements", 55, "entries", List.of(Map.of("operationType", "CONSUME"))));
                String theme = "shopify-theme2".equals(request.getParameter("theme")) ? "shopify-theme2" : "shopify";
                request.getRequestDispatcher("/WEB-INF/" + theme + "/store-quota-history.jsp")
                        .forward(request, response);
            }
        });
        context.addServletMappingDecoded("/fixture", "fixture");

        try {
            tomcat.start();
            var client = HttpClient.newHttpClient();
            for (String theme : List.of("shopify", "shopify-theme2")) {
                var request = HttpRequest.newBuilder(URI.create("http://127.0.0.1:"
                        + tomcat.getConnector().getLocalPort() + "/web/fixture?theme=" + theme)).build();
                var response = client.send(request, HttpResponse.BodyHandlers.ofString());
                assertThat(response.statusCode()).as(theme).isEqualTo(200);
                var page = Jsoup.parse(response.body());
                var form = page.select("form.quota-history-filter");
                assertThat(form.attr("method")).isEqualTo("get");
                assertThat(form.select("input[type=date]").eachAttr("value"))
                        .containsExactly("2026-11-25", "2026-11-27");
                assertThat(form.select("a.clear-filter-button").attr("href"))
                        .endsWith("?shop=shop.example");
                assertThat(page.select(".pagination-actions a").eachAttr("href"))
                        .hasSize(2).allMatch(link -> link.contains("shop=shop.example")
                                && link.contains("fromDate=2026-11-25") && link.contains("toDate=2026-11-27"))
                        .anyMatch(link -> link.endsWith("&page=1")).anyMatch(link -> link.endsWith("&page=3"));
            }
        } finally {
            tomcat.stop();
            tomcat.destroy();
        }
    }
}
