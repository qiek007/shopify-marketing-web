package com.yskj.shopify.web.controller;

import com.alibaba.fastjson.JSONObject;
import com.yskj.shopify.web.security.CampaignReceiptCsrf;
import com.yskj.shopify.web.security.PlatformUserContext;
import com.yskj.shopify.web.service.MerchantWebFacadeClient;
import org.springframework.http.*;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import javax.servlet.http.HttpSession;

@Controller
public class CampaignHotCleanupController {
    private final MerchantWebFacadeClient client;
    private final RemotePageSupport support;
    public CampaignHotCleanupController(MerchantWebFacadeClient client,RemotePageSupport support){this.client=client;this.support=support;}
    @GetMapping(value="/campaigns/detail/hot-cleanup/preview",produces=MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> preview(@RequestParam("shop") String shop,@RequestParam("campaignId") String campaignId,HttpSession session){
        var actor=user(session);var response=call("preview",shop,campaignId,null,session);
        if(!response.getStatusCode().is2xxSuccessful())return response;
        return ResponseEntity.status(response.getStatusCode()).headers(response.getHeaders()).header("X-Hot-Cleanup-Csrf",CampaignReceiptCsrf.issue(session,"manual-receipts:"+actor.getDomainid()+":"+actor.getId())).body(response.getBody());
    }
    @PostMapping(value="/campaigns/detail/hot-cleanup",produces=MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> approve(@RequestParam("shop") String shop,@RequestParam("campaignId") String campaignId,@RequestParam("fingerprint") String fingerprint,@RequestHeader(value="X-Hot-Cleanup-Csrf",required=false)String csrf,HttpSession session){
        var actor=user(session);CampaignReceiptCsrf.require(session,"manual-receipts:"+actor.getDomainid()+":"+actor.getId(),csrf);
        return call("approve",shop,campaignId,fingerprint,session);
    }
    private ResponseEntity<?> call(String action,String shop,String campaign,String fingerprint,HttpSession session){
        JSONObject params=new JSONObject();params.put("campaignId",campaign);if(fingerprint!=null)params.put("fingerprint",fingerprint);
        var response=support.applyBody(client.exchange("campaigns.hot-cleanup."+action,user(session),shop,params,null));
        return ResponseEntity.status(response.getStatusCode()).headers(response.getHeaders()).header("Cache-Control","no-store").body(response.getBody());
    }
    private com.yskj.dao.dto.org.LoginedUser user(HttpSession session){return PlatformUserContext.current(session).orElseThrow(()->new ResponseStatusException(HttpStatus.UNAUTHORIZED));}
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<JSONObject> rejected(ResponseStatusException failure){JSONObject body=new JSONObject();body.put("message",failure.getReason()==null?"没有权限或会话已失效":failure.getReason());return ResponseEntity.status(failure.getStatus()).header("Cache-Control","no-store").body(body);}
}
