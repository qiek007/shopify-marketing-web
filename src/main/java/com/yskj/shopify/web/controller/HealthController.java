package com.yskj.shopify.web.controller;

import com.alibaba.fastjson.JSONObject;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    @GetMapping({"/health", "/runstate"})
    public JSONObject health() {
        JSONObject result = new JSONObject(true);
        result.put("status", "UP");
        result.put("service", "shopify-marketing-web");
        return result;
    }
}
