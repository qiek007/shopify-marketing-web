package com.yskj.shopify.web.controller;

import com.alibaba.fastjson.JSONObject;
import com.yskj.dao.dto.org.LoginedUser;
import com.yskj.shopify.contract.web.MerchantWebProtocol;
import com.yskj.shopify.web.service.MerchantWebFacadeClient;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.ui.ExtendedModelMap;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.servlet.mvc.support.RedirectAttributesModelMap;
import java.util.Map;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class TransactionalEmailControllerTest {
    @Test void saveRequiresSessionAndPerSessionCsrfBeforeCallingCenter(){
        var client=mock(MerchantWebFacadeClient.class);var controller=new MerchantConsoleController(client,new RemotePageSupport());
        var params=new LinkedMultiValueMap<String,String>();params.add("shop","shop.example");
        var session=new MockHttpSession();var user=new LoginedUser();user.setId("user");user.setDomainid("domain");user.setApplicationid("app");session.setAttribute("logineduser",user);
        assertThatThrownBy(()->controller.saveTransactionalEmail(params,session,new ExtendedModelMap(),new RedirectAttributesModelMap()))
                .isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        verifyNoInteractions(client);
        when(client.exchange(eq("transactional-email.page"),any(),eq("shop.example"),any(),isNull()))
                .thenReturn(MerchantWebProtocol.view("shopify/transactional-email",new JSONObject(Map.of("selectedShop","shop.example"))));
        var model=new ExtendedModelMap();controller.transactionalEmail(params,session,model,new RedirectAttributesModelMap());
        assertThat(model.get("transactionalEmailCsrf")).isInstanceOf(String.class);
        when(client.exchange(eq("transactional-email.save"),any(),eq("shop.example"),any(),isNull()))
                .thenReturn(MerchantWebProtocol.redirect("/stores/transactional-email","successMessage","saved",new JSONObject(Map.of("shop","shop.example"))));
        params.add("_transactionalCsrf",model.get("transactionalEmailCsrf").toString());
        assertThat(controller.saveTransactionalEmail(params,session,new ExtendedModelMap(),new RedirectAttributesModelMap())).isEqualTo("redirect:/stores/transactional-email");
        verify(client).exchange(eq("transactional-email.save"),any(),eq("shop.example"),any(),isNull());
    }
}
