package com.yskj.shopify.web.controller;

import com.alibaba.fastjson.JSONObject;
import com.yskj.dao.dto.org.LoginedUser;
import com.yskj.shopify.contract.web.MerchantWebProtocol;
import com.yskj.shopify.web.security.CampaignReceiptCsrf;
import com.yskj.shopify.web.service.MerchantWebFacadeClient;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import static org.mockito.Mockito.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class CampaignHotCleanupControllerTest {
    private MockHttpSession session(){var s=new MockHttpSession();var u=new LoginedUser();u.setId("owner");u.setDomainid("org");u.setApplicationid("app");s.setAttribute("logineduser",u);return s;}
    @Test void approvalRequiresCsrfAndDoesNotForwardForgedActor() throws Exception {
        var client=mock(MerchantWebFacadeClient.class);
        when(client.exchange(anyString(),any(),anyString(),any(),isNull())).thenReturn(MerchantWebProtocol.json(new JSONObject()));
        var mvc=MockMvcBuilders.standaloneSetup(new CampaignHotCleanupController(client,new RemotePageSupport())).build();var session=session();
        mvc.perform(post("/campaigns/detail/hot-cleanup").session(session).param("shop","s").param("campaignId","c").param("fingerprint","f")).andExpect(status().isForbidden());
        verifyNoInteractions(client);
        String csrf=CampaignReceiptCsrf.issue(session,"manual-receipts:org:owner");
        mvc.perform(post("/campaigns/detail/hot-cleanup").session(session).header("X-Hot-Cleanup-Csrf",csrf).param("shop","s").param("campaignId","c").param("fingerprint","f").param("actorId","forged"))
                .andExpect(status().isOk());
        var params=org.mockito.ArgumentCaptor.forClass(JSONObject.class);
        verify(client).exchange(eq("campaigns.hot-cleanup.approve"),any(),eq("s"),params.capture(),isNull());
        assertThat(params.getValue().keySet()).containsExactlyInAnyOrder("campaignId","fingerprint");
    }
}
