package com.yskj.shopify.web.controller;

import com.alibaba.fastjson.JSONObject;
import com.yskj.shopify.contract.web.MerchantWebProtocol;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.ui.ExtendedModelMap;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.support.RedirectAttributesModelMap;

import java.nio.charset.StandardCharsets;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RemotePageSupportTest {

    private final RemotePageSupport support = new RemotePageSupport();

    @Test
    void appliesViewModelsAndRedirectFlashAttributes() {
        ExtendedModelMap model = new ExtendedModelMap();
        JSONObject view = MerchantWebProtocol.view("shopify/dashboard",
                new JSONObject(Map.of("selectedShop", "demo.myshopify.com", "ready", true)));

        String viewName = support.applyView(view, model, new RedirectAttributesModelMap());

        assertThat(viewName).isEqualTo("shopify/dashboard");
        assertThat(model).containsEntry("selectedShop", "demo.myshopify.com")
                .containsEntry("ready", true);

        RedirectAttributesModelMap redirect = new RedirectAttributesModelMap();
        String redirectName = support.applyView(MerchantWebProtocol.redirect(
                "/campaigns/detail", "已提交", null,
                new JSONObject(Map.of("shop", "demo", "campaignId", "campaign-1"))),
                new ExtendedModelMap(), redirect);

        assertThat(redirectName).isEqualTo("redirect:/campaigns/detail");
        assertThat(redirect.getFlashAttributes().get("successMessage")).isEqualTo("已提交");
        assertThat(redirect).containsEntry("shop", "demo")
                .containsEntry("campaignId", "campaign-1");
    }

    @Test
    void returnsJsonAndBinaryBodiesAndRaisesRemoteErrors() {
        JSONObject json = MerchantWebProtocol.json(new JSONObject(Map.of("ready", true)));
        byte[] content = "report".getBytes(StandardCharsets.UTF_8);
        JSONObject binary = MerchantWebProtocol.binary(
                "application/octet-stream", "report.bin", content);
        JSONObject inline = MerchantWebProtocol.binary(
                "text/html;charset=UTF-8", "preview.html", content);
        inline.put("inline", true);

        var jsonResponse = support.applyBody(json);
        var binaryResponse = support.applyBody(binary);
        var inlineResponse = support.applyBody(inline);

        assertThat(jsonResponse.getBody()).isEqualTo(json.getJSONObject("body"));
        assertThat(binaryResponse.getBody()).isEqualTo(content);
        assertThat(binaryResponse.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION))
                .contains("report.bin");
        assertThat(inlineResponse.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION))
                .startsWith("inline");
        assertThatThrownBy(() -> support.applyBody(
                MerchantWebProtocol.error("DENIED", "无权限", 403)))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("无权限");
    }
}
