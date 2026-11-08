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
        for (String path : java.util.List.of("/mobile/campaigns", "/mobile/segments", "/mobile/automations", "/mobile/customers")) {
            mvc().perform(get(path)).andExpect(status().isUnauthorized());
        }
        verifyNoInteractions(client);
    }

    @Test void eachReadRouteUsesTheExpectedRpcAndMobileView() throws Exception {
        String[][] routes = {
                {"/mobile", "dashboard.load", "shopify/dashboard", "mobile/dashboard"},
                {"/mobile/dashboard", "dashboard.load", "shopify/dashboard", "mobile/dashboard"},
                {"/mobile/campaigns", "campaigns.page", "shopify/campaigns", "mobile/campaigns"},
                {"/mobile/campaigns/editor", "campaigns.editor", "shopify/campaign-editor", "mobile/campaign-editor"},
                {"/mobile/campaigns/detail", "campaigns.detail", "shopify/campaign-detail", "mobile/campaign-detail"},
                {"/mobile/segments", "segments.page", "shopify/segments", "mobile/segments"},
                {"/mobile/segments/editor", "segments.editor", "shopify/segment-editor", "mobile/segment-editor"},
                {"/mobile/automations", "automations.page", "shopify/automations", "mobile/automations"}
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

    @Test void segmentPreviewPreservesSingleRuleArraysWithoutSaving() throws Exception {
        when(client.exchange(eq("segments.preview-results"), any(), any(), any(), isNull()))
                .thenReturn(MerchantWebProtocol.view("shopify/fragments/segment-preview-results", new JSONObject()));
        mvc().perform(post("/mobile/segments/preview/results").session(session()).param("shop", "demo.myshopify.com")
                        .param("groupIds", "g1").param("groupMatchModes", "ALL").param("ruleGroupIds", "g1")
                        .param("fields", "EMAIL").param("operators", "CONTAINS").param("values", "@example.com"))
                .andExpect(status().isOk()).andExpect(view().name("mobile/fragments/segment-preview-results"));
        verify(client).exchange(eq("segments.preview-results"), any(), any(), argThat(p ->
                p.getJSONArray("groupIds").size() == 1 && p.getJSONArray("fields").size() == 1
                        && "@example.com".equals(p.getJSONArray("values").getString(0))), isNull());
        verify(client, never()).exchange(eq("segments.save"), any(), any(), any(), any());
    }

    @Test void segmentAndAutomationWritesKeepTheirMobileRedirectsAndMessages() throws Exception {
        String[][] routes = {
                {"/mobile/segments", "segments.save", "/segments", "redirect:/mobile/segments"},
                {"/mobile/automations", "automations.create", "/automations", "redirect:/mobile/automations"},
                {"/mobile/automations/update", "automations.update", "/automations", "redirect:/mobile/automations"},
                {"/mobile/automations/action", "automations.action", "/automations", "redirect:/mobile/automations"}
        };
        for (String[] route : routes) {
            when(client.exchange(eq(route[1]), any(), any(), any(), isNull()))
                    .thenReturn(MerchantWebProtocol.redirect(route[2], "已处理", null, new JSONObject(Map.of("shop", "a.example"))));
            mvc().perform(post(route[0]).session(session()).param("shop", "a.example").param("status", "PAUSED"))
                    .andExpect(view().name(route[3])).andExpect(flash().attribute("successMessage", "已处理"));
        }
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

    @Test void customerListCombinesTheAuthorizedShellWithTheRealResults() throws Exception {
        when(client.exchange(eq("customers.page"), any(), eq("a.example"), any(), isNull()))
                .thenReturn(MerchantWebProtocol.view("shopify/customers", new JSONObject(Map.of("selectedShop", "a.example"))));
        var customers = new com.alibaba.fastjson.JSONArray();
        customers.add(new JSONObject(Map.of("sourceId", "c1", "email", "demo@example.com")));
        when(client.exchange(eq("customers.results"), any(), eq("a.example"), any(), isNull()))
                .thenReturn(MerchantWebProtocol.view("shopify/fragments/customer-results", new JSONObject(Map.of("customers", customers))));
        mvc().perform(get("/mobile/customers").session(session()).param("shop", "a.example").param("q", "demo").param("page", "2"))
                .andExpect(status().isOk()).andExpect(view().name("mobile/customers"))
                .andExpect(model().attribute("customers", customers));
        verify(client).exchange(eq("customers.results"), any(), eq("a.example"),
                argThat(p -> "demo".equals(p.getString("q")) && "2".equals(p.getString("page"))), isNull());
    }

    @Test void customerDetailUsesJsonShellAndIndependentTimelineDates() throws Exception {
        when(client.exchange(eq("shell.load"), any(), eq("a.example"), any(), isNull()))
                .thenReturn(MerchantWebProtocol.json(new JSONObject(Map.of("selectedShop", "a.example"))));
        var summary = new JSONObject(Map.of("customer", new JSONObject(Map.of("sourceId", "c1"))));
        when(client.exchange(eq("customers.summary"), any(), eq("a.example"), any(), isNull()))
                .thenReturn(MerchantWebProtocol.json(summary));
        var timeline = new JSONObject(Map.of("totalCount", 3));
        when(client.exchange(eq("customers.timeline"), any(), eq("a.example"), any(), isNull()))
                .thenReturn(MerchantWebProtocol.json(timeline));
        mvc().perform(get("/mobile/customers/detail").session(session()).param("shop", "a.example").param("customerId", "c1")
                        .param("fromDate", "2026-01-01").param("timelineFromDate", "2026-11-01").param("timelineToDate", "2026-11-08"))
                .andExpect(status().isOk()).andExpect(view().name("mobile/customer-detail"))
                .andExpect(model().attribute("timelineWindow", timeline));
        verify(client).exchange(eq("customers.timeline"), any(), eq("a.example"),
                argThat(p -> "2026-11-01".equals(p.getString("fromDate")) && "c1".equals(p.getString("customerId"))), isNull());
    }

    @Test void customerDetailLoadsThirtyDaysEvenWhenSummaryHasNoTimeline() throws Exception {
        when(client.exchange(eq("shell.load"), any(), eq("a.example"), any(), isNull()))
                .thenReturn(MerchantWebProtocol.json(new JSONObject(Map.of("selectedShop", "a.example"))));
        when(client.exchange(eq("customers.summary"), any(), eq("a.example"), any(), isNull()))
                .thenReturn(MerchantWebProtocol.json(new JSONObject(Map.of("customer", new JSONObject(Map.of("sourceId", "c1"))))));
        var timeline = new JSONObject(Map.of("totalCount", 0));
        when(client.exchange(eq("customers.timeline"), any(), eq("a.example"), any(), isNull()))
                .thenReturn(MerchantWebProtocol.json(timeline));
        mvc().perform(get("/mobile/customers/detail").session(session()).param("shop", "a.example").param("customerId", "c1"))
                .andExpect(status().isOk()).andExpect(model().attribute("timelineWindow", timeline));
        verify(client).exchange(eq("customers.timeline"), any(), eq("a.example"), argThat(p ->
                java.time.temporal.ChronoUnit.DAYS.between(java.time.LocalDate.parse(p.getString("fromDate")),
                        java.time.LocalDate.parse(p.getString("toDate"))) == 29), isNull());
    }
}
