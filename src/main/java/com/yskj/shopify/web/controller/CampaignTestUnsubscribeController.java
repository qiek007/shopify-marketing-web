package com.yskj.shopify.web.controller;

import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CampaignTestUnsubscribeController {

    private static final String PAGE = "<!doctype html><html lang=\"zh-CN\"><head>"
            + "<meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
            + "<title>测试邮件</title></head><body><main style=\"max-width:640px;margin:80px auto;"
            + "font-family:system-ui,sans-serif;line-height:1.7\"><h1>这是测试邮件</h1>"
            + "<p>退订链接可正常打开；测试邮件不会改变任何客户的订阅状态。</p></main></body></html>";

    @GetMapping(value = "/campaigns/test-unsubscribe", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> explain() {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(PAGE);
    }

    @PostMapping("/campaigns/test-unsubscribe/one-click")
    public ResponseEntity<Void> oneClick() {
        return ResponseEntity.noContent().cacheControl(CacheControl.noStore()).build();
    }
}
