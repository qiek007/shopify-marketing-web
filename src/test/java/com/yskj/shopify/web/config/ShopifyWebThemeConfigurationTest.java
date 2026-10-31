package com.yskj.shopify.web.config;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ShopifyWebThemeConfigurationTest {

    @Test
    void resolvesBothIndependentThemeDirectories() {
        assertThat(new ShopifyWebThemeProperties("classic").viewDirectory())
                .isEqualTo("shopify");
        assertThat(new ShopifyWebThemeProperties("theme2").viewDirectory())
                .isEqualTo("shopify-theme2");
        assertThat(new ShopifyWebThemeViewResolver(
                new ShopifyWebThemeProperties("theme2"))
                .resolveLogicalViewName("shopify/dashboard"))
                .isEqualTo("shopify-theme2/dashboard");
    }

    @Test
    void rejectsUnknownThemes() {
        assertThatThrownBy(() -> new ShopifyWebThemeProperties("unknown"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unknown Shopify web theme");
    }
    @Test
    void legacyConnectionUrlRedirectsToInlineStoreCardForBothThemes() throws Exception {
        for(String selected : java.util.List.of("classic","theme2")) {
            var theme=new ShopifyWebThemeProperties(selected);
            var client=org.mockito.Mockito.mock(com.yskj.shopify.web.service.CustomStoreConnectionClient.class);
            org.mockito.Mockito.when(client.status(org.mockito.ArgumentMatchers.any(),org.mockito.ArgumentMatchers.eq("custom.example"))).thenReturn(new com.alibaba.fastjson.JSONObject());
            org.mockito.Mockito.when(client.sourceProfile(org.mockito.ArgumentMatchers.any(),org.mockito.ArgumentMatchers.eq("custom.example"))).thenReturn(new com.alibaba.fastjson.JSONObject(java.util.Map.of("available",true,"sourceType","CUSTOM","connectorKey","AUW_V2")));
            var controller=new com.yskj.shopify.web.controller.CustomStoreConnectionController(client);
            var views=new org.springframework.web.servlet.view.InternalResourceViewResolver("/WEB-INF/",".jsp");
            var mvc=org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup(controller).setControllerAdvice(new ShopifyWebThemeModelAdvice(theme)).setViewResolvers(views).build();
            var session=new org.springframework.mock.web.MockHttpSession();var user=new com.yskj.dao.dto.org.LoginedUser();user.setId("owner");session.setAttribute("logineduser",user);
            mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/stores/custom-connection").param("shop","custom.example").session(session))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().is3xxRedirection())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl("/stores?shop=custom.example#store-data-connection"));
            assertThat(new ShopifyWebThemeViewResolver(theme).resolveLogicalViewName("shopify/custom-store-connection")).isEqualTo(theme.viewDirectory()+"/custom-store-connection");
            assertThat(java.nio.file.Path.of("src/main/resources/META-INF/resources",theme.assetDirectory(),"css/dashboard.css")).exists();
        }
    }
}
