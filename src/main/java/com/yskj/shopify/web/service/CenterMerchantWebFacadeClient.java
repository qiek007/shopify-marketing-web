package com.yskj.shopify.web.service;

import com.alibaba.fastjson.JSONObject;
import com.yskj.core.annotation.HkInject;
import com.yskj.core.annotation.HkInjectService;
import com.yskj.dao.dto.org.LoginedUser;
import com.yskj.shopify.contract.web.IMerchantWebFacadeService;
import com.yskj.shopify.contract.web.MerchantWebProtocol;
import com.yskj.shopify.web.security.PlatformUserContext;
import org.springframework.stereotype.Service;

@HkInject
@Service
public class CenterMerchantWebFacadeClient implements MerchantWebFacadeClient {

    @HkInjectService(
            ServiceName = "shopifymarketingmerchant",
            ServicePackage = "com.yskj.shopify.webfacade.MerchantWebFacadeServiceImpl")
    private IMerchantWebFacadeService facadeService;

    public CenterMerchantWebFacadeClient() {
    }

    CenterMerchantWebFacadeClient(IMerchantWebFacadeService facadeService) {
        this.facadeService = facadeService;
    }

    @Override
    public JSONObject exchange(String operation,
                               LoginedUser user,
                               String shopDomain,
                               JSONObject parameters,
                               JSONObject payload) {
        if (facadeService == null) {
            throw new IllegalStateException("Shopify marketing service is unavailable");
        }
        JSONObject request = MerchantWebProtocol.request(
                operation, PlatformUserContext.identity(user), shopDomain,
                parameters, payload);
        JSONObject response = facadeService.exchange(request);
        if (response == null) {
            throw new IllegalStateException("Shopify marketing service returned no response");
        }
        return MerchantWebProtocol.validateResponse(response);
    }
}
