package com.yskj.shopify.web.controller;

import org.junit.jupiter.api.Test;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class MerchantLoginPageModelAdviceTest {
 @Test void allLoginViewEntrypointsReceiveCapabilityOnlyInWebApplication() throws Exception {
  Object advice;
  try{advice=Class.forName("com.yskj.shopify.web.config.MerchantLoginPageModelAdvice").getDeclaredConstructor().newInstance();}
  catch(ClassNotFoundException missing){throw new AssertionError("Web login page capability advice is missing",missing);}
  var web=standaloneSetup(new LoginFixture()).setControllerAdvice(advice).build();
  web.perform(get("/org/login")).andExpect(status().isOk()).andExpect(model().attribute("alternativeLoginSupported",true));
  web.perform(post("/org/login/login")).andExpect(status().isOk()).andExpect(model().attribute("alternativeLoginSupported",true));
  web.perform(get("/org/login/failed")).andExpect(status().isOk()).andExpect(model().attribute("alternativeLoginSupported",true));
  var center=standaloneSetup(new LoginFixture()).build();
  center.perform(get("/org/login").param("alternativeLoginSupported","true")).andExpect(status().isOk()).andExpect(model().attributeDoesNotExist("alternativeLoginSupported"));
 }
 @Controller static class LoginFixture {
  @GetMapping("/org/login")String login(){return "org/index";}
  @PostMapping("/org/login/login")String failedSubmit(){return "org/index";}
  @GetMapping("/org/login/failed")String failed(){return "org/index";}
 }
}
