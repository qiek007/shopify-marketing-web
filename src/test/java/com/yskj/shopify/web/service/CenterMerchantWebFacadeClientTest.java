package com.yskj.shopify.web.service;

import com.alibaba.fastjson.JSONObject;
import com.yskj.core.annotation.HkInject;
import com.yskj.core.annotation.HkInjectService;
import com.yskj.dao.dto.org.LoginedUser;
import com.yskj.shopify.contract.web.IMerchantWebFacadeService;
import com.yskj.shopify.contract.web.MerchantWebProtocol;
import org.junit.jupiter.api.Test;
import org.springframework.stereotype.Service;

import java.lang.reflect.Field;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

class CenterMerchantWebFacadeClientTest {

    @Test
    void declaresTheExpectedCenterServiceDependency() throws Exception {
        Field field = CenterMerchantWebFacadeClient.class.getDeclaredField("facadeService");
        HkInjectService dependency = field.getAnnotation(HkInjectService.class);

        assertThat(CenterMerchantWebFacadeClient.class).hasAnnotation(HkInject.class);
        assertThat(CenterMerchantWebFacadeClient.class).hasAnnotation(Service.class);
        assertThat(dependency.ServiceName()).isEqualTo("shopifymarketingmerchant");
        assertThat(dependency.ServicePackage())
                .isEqualTo("com.yskj.shopify.webfacade.MerchantWebFacadeServiceImpl");
    }

    @Test
    void sendsVersionedIdentityShopParametersAndPayload() {
        AtomicReference<JSONObject> captured = new AtomicReference<>();
        IMerchantWebFacadeService remote = request -> {
            captured.set(request);
            return MerchantWebProtocol.json(new JSONObject(Map.of("ready", true)));
        };
        CenterMerchantWebFacadeClient client = new CenterMerchantWebFacadeClient(remote);
        LoginedUser user = user();

        JSONObject response = client.exchange("dashboard.load", user,
                "demo.myshopify.com", new JSONObject(Map.of("page", 1)),
                new JSONObject(Map.of("source", "web")));

        assertThat(response.getString("kind")).isEqualTo("JSON");
        assertThat(captured.get().getString("operation")).isEqualTo("dashboard.load");
        assertThat(captured.get().getString("shopDomain")).isEqualTo("demo.myshopify.com");
        assertThat(captured.get().getJSONObject("user"))
                .containsEntry("id", "user-1")
                .containsEntry("domainId", "domain-1")
                .containsEntry("applicationId", "app-1");
        assertThat(captured.get().getJSONObject("parameters").getIntValue("page")).isEqualTo(1);
        assertThat(captured.get().getJSONObject("payload").getString("source")).isEqualTo("web");
    }

    private LoginedUser user() {
        LoginedUser user = new LoginedUser();
        user.setId("user-1");
        user.setDomainid("domain-1");
        user.setApplicationid("app-1");
        user.setAclNameList("[Shopify营销活动]");
        return user;
    }
}
