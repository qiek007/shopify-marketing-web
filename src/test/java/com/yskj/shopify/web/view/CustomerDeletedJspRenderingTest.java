package com.yskj.shopify.web.view;
import org.apache.catalina.startup.Tomcat;import org.jsoup.Jsoup;import org.junit.jupiter.api.Test;import org.junit.jupiter.api.io.TempDir;import javax.servlet.http.*;import java.net.URI;import java.net.http.*;import java.nio.file.Path;import java.util.*;import static org.assertj.core.api.Assertions.*;
class CustomerDeletedJspRenderingTest {
 @TempDir Path temporary;
 @Test void bothThemesEscapeDeletedDataAndCarryTheObservedRestoreToken() throws Exception {
  var tomcat=new Tomcat();tomcat.setBaseDir(temporary.toString());tomcat.setPort(0);tomcat.getConnector().setProperty("address","127.0.0.1");var context=tomcat.addWebapp("/web",Path.of("src/main/resources/META-INF/resources").toAbsolutePath().toString());context.setParentClassLoader(getClass().getClassLoader());context.setContainerSciFilter("org.springframework.web.SpringServletContainerInitializer");
  Tomcat.addServlet(context,"fixture",new HttpServlet(){protected void doGet(HttpServletRequest req,HttpServletResponse resp)throws java.io.IOException,javax.servlet.ServletException{req.setAttribute("selectedShop","test.example");req.setAttribute("canManageCustomers",true);req.setAttribute("uiAssetBase","/shopify");req.setAttribute("logineduser",Map.of("lastName","测试管理员"));req.setAttribute("search","<query>");req.setAttribute("deletedCustomerPage",Map.of("rows",List.of(Map.of("customerId","original-id","name","<script>customer</script>","email","test@example.test","sourceType","IMPORTED","deletedAt","2026-11-23T12:00:00Z","deletionToken","observed&token")),"totalElements",12,"pageNumber",2,"totalPages",2));String theme="shopify-theme2".equals(req.getParameter("theme"))?"shopify-theme2":"shopify";req.getRequestDispatcher("/WEB-INF/"+theme+"/customer-deleted.jsp").forward(req,resp);}});context.addServletMappingDecoded("/fixture","fixture");
  try{tomcat.start();var client=HttpClient.newHttpClient();for(String theme:List.of("shopify","shopify-theme2")){var response=client.send(HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+tomcat.getConnector().getLocalPort()+"/web/fixture?theme="+theme)).build(),HttpResponse.BodyHandlers.ofString());assertThat(response.statusCode()).isEqualTo(200);var doc=Jsoup.parse(response.body());assertThat(doc.select("[data-deleted-row] script")).isEmpty();assertThat(doc.select("[data-deleted-row]").text()).contains("<script>customer</script>");assertThat(doc.select("[data-deleted-count]").text()).isEqualTo("12");assertThat(doc.select("input[name=deletionToken]").attr("value")).isEqualTo("observed&token");assertThat(doc.select("input[name=customerId]").attr("value")).isEqualTo("original-id");assertThat(doc.select("input[name=confirm]").attr("value")).isEqualTo("RESTORE_CUSTOMER");assertThat(doc.select("[data-deleted-row] a[href*=detail]")).isEmpty();assertThat(doc.select("script[src*=customer-restore]")).hasSize(1);assertThat(java.net.URLDecoder.decode(doc.select(".pagination a").attr("href"),java.nio.charset.StandardCharsets.UTF_8)).contains("page=1","q=<query>");
   var search = doc.selectFirst("form.deleted-customer-search");
   assertThat(search).isNotNull();
   assertThat(search.select("label > input[name=q]").val()).isEqualTo("<query>");
   assertThat(search.select("button.action-button[type=submit]").text()).isEqualTo("查询");
   assertThat(search.select("button > i.fa-search")).hasSize(1);
   assertThat(doc.select("[data-deleted-empty][hidden] > .empty-state")).hasSize(1);
   assertThat(doc.select("[data-customer-restore] button.action-button").text()).isEqualTo("恢复客户");
   assertThat(doc.select("[data-customer-restore] button > i.fa-undo")).hasSize(1);
   var back = doc.selectFirst(".section-heading-actions a.action-button");
   assertThat(back).isNotNull();
   assertThat(back.text()).isEqualTo("返回客户列表");
   assertThat(back.attr("href")).contains("/customers").endsWith("?shop=test.example");
   assertThat(back.select("i.fa-arrow-left")).hasSize(1);
  }}
  finally{tomcat.stop();tomcat.destroy();}
 }
}
