package com.yskj.shopify.web.view;

import org.apache.catalina.startup.Tomcat;
import org.jsoup.Jsoup;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.junit.jupiter.api.io.TempDir;
import javax.servlet.http.*;
import java.nio.file.Path;
import java.net.URI;
import java.net.http.*;
import java.time.Duration;
import java.util.Map;
import static org.assertj.core.api.Assertions.assertThat;

class MerchantLoginCapabilityRenderingTest {
 @TempDir Path temporary;
 @Test @Timeout(60) void optionalLoginOnlyRendersForExplicitServerCapability() throws Exception {
  var tomcat=new Tomcat();tomcat.setBaseDir(temporary.toString());tomcat.setPort(0);
  tomcat.getConnector().setProperty("address","127.0.0.1");
  var context=tomcat.addWebapp("/web",Path.of("src/main/resources/META-INF/resources").toAbsolutePath().toString());
  context.setParentClassLoader(getClass().getClassLoader());context.setContainerSciFilter("org.springframework.web.SpringServletContainerInitializer");
  Tomcat.addServlet(context,"fixture",new HttpServlet(){@Override protected void doGet(HttpServletRequest req,HttpServletResponse res)throws java.io.IOException,javax.servlet.ServletException{
   if("enabled".equals(req.getParameter("mode")))req.setAttribute("alternativeLoginSupported",true);
   if("disabled".equals(req.getParameter("mode")))req.setAttribute("alternativeLoginSupported",false);
   req.setAttribute("appid","app\" data-injected=\"unsafe");
   req.setAttribute("clienttypeid","scan");req.setAttribute("ws","ws://localhost/socket");req.setAttribute("wss","wss://localhost/socket");
   req.getRequestDispatcher("/WEB-INF/org/index.jsp").forward(req,res);
  }});context.addServletMappingDecoded("/fixture","fixture");
  try{
   tomcat.start();var client=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
   for(String mode:new String[]{"missing","disabled","enabled"}){
    var response=client.send(HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+tomcat.getConnector().getLocalPort()+"/web/fixture?mode="+mode+"&alternativeLoginSupported=true")).timeout(Duration.ofSeconds(20)).GET().build(),HttpResponse.BodyHandlers.ofString());
    assertThat(response.statusCode()).as(response.body()).isEqualTo(200);var document=Jsoup.parse(response.body());
    assertThat(document.select("#userPanel").attr("action")).isEqualTo("/web/org/login/login");
    assertThat(document.select("#userPanel").attr("method")).isEqualTo("post");
    assertThat(document.select("#encryptedPass[name=pass][type=hidden]")).hasSize(1);
    assertThat(document.select("#passToggle[tabindex=-1]")).hasSize(1);
    assertThat(document.select("#agreement")).hasSize(1);
    if(mode.equals("enabled")){
     assertThat(document.select("#faceLoginButton[disabled],#qrLoginButton[disabled]")).hasSize(2);
     assertThat(document.select("#faceLoginDialog,#qrLoginDialog,#FacePic")).hasSize(3);
     assertThat(document.select("script[src*=merchant-alternative-login]")).hasSize(1);
     assertThat(document.select("#userPanel").attr("data-app-id")).isEqualTo("app\" data-injected=\"unsafe");
     assertThat(document.select("#userPanel").hasAttr("data-injected")).isFalse();
    }else{
     assertThat(document.select("#faceLoginButton,#qrLoginButton,#faceLoginDialog,#qrLoginDialog,#FacePic")).isEmpty();
     assertThat(document.select("script[src*=merchant-alternative-login],script[src*=face-login],script[src*=qrcode],script[src*=mediapipe]")).isEmpty();
     assertThat(document.select("#userPanel").hasAttr("data-scan-config-url")).isFalse();
     assertThat(document.select("#userPanel").hasAttr("data-app-id")).isFalse();
    }
   }
  }finally{tomcat.stop();tomcat.destroy();}
 }
}
