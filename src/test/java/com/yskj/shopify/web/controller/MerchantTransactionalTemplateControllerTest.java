package com.yskj.shopify.web.controller;

import com.alibaba.fastjson.JSONObject;
import com.yskj.dao.dto.org.LoginedUser;
import com.yskj.shopify.contract.web.MerchantWebProtocol;
import com.yskj.shopify.web.service.MerchantWebFacadeClient;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.util.Map;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class MerchantTransactionalTemplateControllerTest {
    @Test void validationErrorsAreStructuredJsonWithTheOriginalSafeReason() throws Exception {
        var client=mock(MerchantWebFacadeClient.class);var mvc=MockMvcBuilders.standaloneSetup(controller(client)).build();
        var session=session();session.setAttribute("transactionalTemplateCsrf","csrf");
        for(String action:new String[]{"preview","draft"}) {
            when(client.exchange(eq("transactional-template."+action),any(),eq("shop.example"),any(),isNull()))
                    .thenReturn(MerchantWebProtocol.error("INVALID_REQUEST","HTML 元素 <p> 的样式不支持属性「position」。",400));
            mvc.perform(post("/stores/transactional-email/templates/"+action).session(session).param("shop","shop.example")
                    .param("_transactionalTemplateCsrf","csrf")).andExpect(status().isBadRequest())
                    .andExpect(content().contentTypeCompatibleWith("application/json"))
                    .andExpect(header().string("Cache-Control","no-store"))
                    .andExpect(jsonPath("$.code").value("INVALID_REQUEST"))
                    .andExpect(jsonPath("$.message").value("HTML 元素 <p> 的样式不支持属性「position」。"));
        }
    }
    @Test void internalErrorsAreSanitizedAndCsrfErrorsAlsoReturnJson() throws Exception {
        var client=mock(MerchantWebFacadeClient.class);var mvc=MockMvcBuilders.standaloneSetup(controller(client)).build();
        var session=session();session.setAttribute("transactionalTemplateCsrf","csrf");
        when(client.exchange(anyString(),any(),anyString(),any(),isNull()))
                .thenReturn(MerchantWebProtocol.error("REMOTE_FAILURE","SECRET_PROVIDER_BODY SQL password=secret",500));
        var response=mvc.perform(post("/stores/transactional-email/templates/preview").session(session).param("shop","shop.example")
                .param("_transactionalTemplateCsrf","csrf")).andExpect(status().isInternalServerError())
                .andExpect(content().contentTypeCompatibleWith("application/json")).andExpect(jsonPath("$.message").isNotEmpty())
                .andReturn().getResponse().getContentAsString();
        assertThat(response).doesNotContain("SECRET_PROVIDER_BODY","password="," SQL ");
        mvc.perform(post("/stores/transactional-email/templates/preview").session(session).param("shop","shop.example")
                .param("_transactionalTemplateCsrf","wrong")).andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith("application/json"))
                .andExpect(jsonPath("$.message").isNotEmpty());
    }
    @Test void everyWriteRequiresItsOwnSessionCsrfAndSignedUser() throws Exception {
        var client=mock(MerchantWebFacadeClient.class);
        var mvc=MockMvcBuilders.standaloneSetup(controller(client)).build();
        var session=session();session.setAttribute("transactionalEmailCsrf","other-feature");
        for(String action: new String[]{"draft","preview","publish","rollback","default-locale"}) {
            mvc.perform(post("/stores/transactional-email/templates/"+action).session(session).param("shop","shop.example").param("_transactionalTemplateCsrf","other-feature")).andExpect(status().isForbidden());
            mvc.perform(post("/stores/transactional-email/templates/"+action).param("shop","shop.example")).andExpect(status().isUnauthorized());
        }
        verifyNoInteractions(client);
    }
    @Test void pageIssuesTokenAndPreviewForwardsOnlyServerSessionIdentity() throws Exception {
        var client=mock(MerchantWebFacadeClient.class);var mvc=MockMvcBuilders.standaloneSetup(controller(client)).build();var session=session();
        when(client.exchange(eq("transactional-template.page"),any(),eq("shop.example"),any(),isNull()))
                .thenReturn(MerchantWebProtocol.view("shopify/transactional-templates",new JSONObject(Map.of("selectedShop","shop.example"))));
        mvc.perform(get("/stores/transactional-email/templates").session(session).param("shop","shop.example"))
                .andExpect(status().isOk()).andExpect(model().attributeExists("transactionalTemplateCsrf"));
        String token=(String)session.getAttribute("transactionalTemplateCsrf");assertThat(token).isNotBlank();
        when(client.exchange(eq("transactional-template.preview"),any(),eq("shop.example"),any(),isNull()))
                .thenReturn(MerchantWebProtocol.json(new JSONObject(Map.of("subject","Preview"))));
        mvc.perform(post("/stores/transactional-email/templates/preview").session(session).param("shop","shop.example")
                        .param("_transactionalTemplateCsrf",token).param("purpose","CODE").param("locale","zh-CN")
                        .param("html","<p>{{code}}</p>").param("actorId","attacker"))
                .andExpect(status().isOk()).andExpect(header().string("Cache-Control","no-store")).andExpect(jsonPath("$.subject").value("Preview"));
        verify(client).exchange(eq("transactional-template.preview"),argThat(user->"user".equals(user.getId())),eq("shop.example"),argThat(p->p.getString("html").equals("<p>{{code}}</p>")&&!p.containsKey("actorId")&&!p.containsKey("_transactionalTemplateCsrf")),isNull());
    }
    private Object controller(MerchantWebFacadeClient client) throws Exception {
        assertThatCode(()->Class.forName("com.yskj.shopify.web.controller.MerchantTransactionalTemplateController"))
                .as("template routes are implemented independently").doesNotThrowAnyException();
        return Class.forName("com.yskj.shopify.web.controller.MerchantTransactionalTemplateController")
                .getConstructor(MerchantWebFacadeClient.class,RemotePageSupport.class).newInstance(client,new RemotePageSupport());
    }
    private MockHttpSession session(){var session=new MockHttpSession();var user=new LoginedUser();user.setId("user");user.setDomainid("domain");user.setApplicationid("app");session.setAttribute("logineduser",user);return session;}
}
