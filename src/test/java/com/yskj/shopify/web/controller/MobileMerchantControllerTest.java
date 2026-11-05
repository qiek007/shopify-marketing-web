package com.yskj.shopify.web.controller;

import com.alibaba.fastjson.JSONObject;
import com.yskj.dao.dto.org.LoginedUser;
import com.yskj.shopify.contract.web.MerchantWebProtocol;
import com.yskj.shopify.web.service.MerchantWebFacadeClient;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class MobileMerchantControllerTest {
    private final MerchantWebFacadeClient client = mock(MerchantWebFacadeClient.class);

    private MockMvc mvc() {
        return MockMvcBuilders.standaloneSetup(new MobileMerchantController(client, new RemotePageSupport())).build();
    }

    private MockHttpSession session() {
        MockHttpSession session = new MockHttpSession();
        LoginedUser user = new LoginedUser();
        user.setId("user-1");
        session.setAttribute("logineduser", user);
        return session;
    }

    @Test void anonymousRequestsAreRejectedBeforeRpc() throws Exception {
        mvc().perform(get("/mobile/campaigns")) .andExpect(status().isUnauthorized());
        verifyNoInteractions(client);
    }

    @Test void eachReadRouteUsesTheExpectedRpcAndMobileView() throws Exception {
        String[][] routes = {
                {"/mobile", "dashboard.load", "shopify/dashboard", "mobile/dashboard"},
                {"/mobile/dashboard", "dashboard.load", "shopify/dashboard", "mobile/dashboard"},
                {"/mobile/campaigns", "campaigns.page", "shopify/campaigns", "mobile/campaigns"},
                {"/mobile/campaigns/editor", "campaigns.editor", "shopify/campaign-editor", "mobile/campaign-editor"},
                {"/mobile/campaigns/detail", "campaigns.detail", "shopify/campaign-detail", "mobile/campaign-detail"}
        };
        MockMvc mvc = mvc();
        for (String[] route : routes) {
            when(client.exchange(eq(route[1]), any(), eq("demo.myshopify.com"), any(), isNull()))
                    .thenReturn(MerchantWebProtocol.view(route[2], new JSONObject(Map.of("selectedShop", "demo.myshopify.com"))));
            mvc.perform(get(route[0]).param("shop", "demo.myshopify.com").session(session()))
                    .andExpect(status().isOk()).andExpect(view().name(route[3]))
                    .andExpect(model().attribute("selectedShop", "demo.myshopify.com"));
            verify(client, atLeastOnce()).exchange(eq(route[1]), argThat(u -> "user-1".equals(u.getId())),
                    eq("demo.myshopify.com"), any(), isNull());
        }
    }

    @Test void campaignSavePreservesScalarAndMultiValueParameterSemantics() throws Exception {
        when(client.exchange(eq("campaigns.save"), any(), any(), any(), isNull()))
                .thenReturn(MerchantWebProtocol.redirect("/campaigns", "saved", null,
                        new JSONObject(Map.of("shop", "demo.myshopify.com"))));
        mvc().perform(post("/mobile/campaigns").session(session()).param("shop", "demo.myshopify.com")
                        .param("providers", "A", "B").param("includeTags", "tag")
                        .param("fields", "one"))
                .andExpect(status().is3xxRedirection()).andExpect(view().name("redirect:/mobile/campaigns"));
        verify(client).exchange(eq("campaigns.save"), any(), eq("demo.myshopify.com"), argThat(p ->
                p.getJSONArray("providers").size() == 2 && "tag".equals(p.getString("includeTags"))
                        && p.getJSONArray("fields").size() == 1), isNull());
    }

    @Test void campaignSaveRejectsExistingActivityBeforeRpcEvenWithMultipleIds() throws Exception {
        MockMvc mvc = mvc();
        mvc.perform(post("/mobile/campaigns").session(session())
                        .param("shop", "demo.myshopify.com").param("campaignId", "existing"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/mobile/campaigns").session(session())
                        .param("shop", "demo.myshopify.com").param("campaignId", "", "existing"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(client);
    }

    @Test void actionRedirectRetainsParametersAndFlash() throws Exception {
        when(client.exchange(eq("campaigns.action"), any(), any(), any(), isNull()))
                .thenReturn(MerchantWebProtocol.redirect("/campaigns/detail", "done", null,
                        new JSONObject(Map.of("shop", "demo.myshopify.com", "campaignId", "c1"))));
        mvc().perform(post("/mobile/campaigns/action").session(session()).param("shop", "demo.myshopify.com")
                        .param("campaignId", "c1").param("action", "PAUSE"))
                .andExpect(status().is3xxRedirection()).andExpect(view().name("redirect:/mobile/campaigns/detail"))
                .andExpect(flash().attribute("successMessage", "done"))
                .andExpect(redirectedUrlPattern("/mobile/campaigns/detail?*"));
        verify(client).exchange(eq("campaigns.action"), any(), eq("demo.myshopify.com"),
                argThat(p -> "PAUSE".equals(p.getString("action"))), isNull());
    }

    @Test void testSendPreservesItsOperationAndEditorRedirect() throws Exception {
        when(client.exchange(eq("campaigns.test-send"), any(), any(), any(), isNull()))
                .thenReturn(MerchantWebProtocol.redirect("/campaigns/editor", "sent", null, new JSONObject()));
        mvc().perform(post("/mobile/campaigns/test-send").session(session()).param("shop", "demo.myshopify.com"))
                .andExpect(status().is3xxRedirection()).andExpect(view().name("redirect:/mobile/campaigns/editor"));
    }

    @Test void unexpectedRemoteViewOrRedirectIsRejected() throws Exception {
        MockMvc mvc = mvc();
        when(client.exchange(eq("campaigns.page"), any(), any(), any(), isNull()))
                .thenReturn(MerchantWebProtocol.view("shopify/stores", new JSONObject()));
        mvc.perform(get("/mobile/campaigns").session(session())).andExpect(status().isBadGateway());
        when(client.exchange(eq("campaigns.action"), any(), any(), any(), isNull()))
                .thenReturn(MerchantWebProtocol.redirect("https://example.org/", null, null, new JSONObject()));
        mvc.perform(post("/mobile/campaigns/action").session(session())).andExpect(status().isBadGateway());
    }

    @Test void remoteErrorsPreserveStatus() throws Exception {
        when(client.exchange(eq("campaigns.page"), any(), any(), any(), isNull()))
                .thenReturn(MerchantWebProtocol.error("FORBIDDEN", "Denied", 403));
        mvc().perform(get("/mobile/campaigns").session(session())).andExpect(status().isForbidden());
    }
}
