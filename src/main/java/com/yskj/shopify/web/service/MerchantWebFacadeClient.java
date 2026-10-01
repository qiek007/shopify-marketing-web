package com.yskj.shopify.web.service;

import com.alibaba.fastjson.JSONObject;
import com.yskj.dao.dto.org.LoginedUser;

public interface MerchantWebFacadeClient {

    JSONObject exchange(String operation,
                        LoginedUser user,
                        String shopDomain,
                        JSONObject parameters,
                        JSONObject payload);
}
