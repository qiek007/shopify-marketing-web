package com.yskj.shopify.web.controller;
import com.alibaba.fastjson.JSONObject;import com.yskj.shopify.web.service.MerchantWebFacadeClient;import com.yskj.shopify.web.security.*;import org.springframework.stereotype.Controller;import org.springframework.http.*;import org.springframework.web.bind.annotation.*;import org.springframework.web.server.ResponseStatusException;import javax.servlet.http.HttpSession;
@Controller
public class ManualCampaignReceiptController {
 private final MerchantWebFacadeClient client;private final RemotePageSupport support;
 public ManualCampaignReceiptController(MerchantWebFacadeClient client,RemotePageSupport support){this.client=client;this.support=support;}
 @GetMapping(value="/campaigns/detail/receipt-reconciliation/preview",produces=MediaType.APPLICATION_JSON_VALUE)
 public ResponseEntity<?> preview(@RequestParam("shop") String shop,@RequestParam("campaignId") String campaignId,HttpSession session){var user=user(session);var response=read("preview",shop,campaignId,null,session);return ResponseEntity.status(response.getStatusCode()).headers(response.getHeaders()).header("X-Campaign-Receipt-Csrf",CampaignReceiptCsrf.issue(session,"manual-receipts:"+user.getDomainid()+":"+user.getId())).body(response.getBody());}
 @GetMapping(value="/campaigns/detail/receipt-reconciliation/status",produces=MediaType.APPLICATION_JSON_VALUE)
 public ResponseEntity<?> status(@RequestParam("shop") String shop,@RequestParam("campaignId") String campaignId,HttpSession session){return read("status",shop,campaignId,null,session);}
 @PostMapping(value="/campaigns/detail/receipt-reconciliation",produces=MediaType.APPLICATION_JSON_VALUE)
 public ResponseEntity<?> request(@RequestParam("shop") String shop,@RequestParam("campaignId") String campaignId,@RequestParam("requestToken") String requestToken,@RequestHeader(value="X-Campaign-Receipt-Csrf",required=false)String csrf,HttpSession session){var user=user(session);CampaignReceiptCsrf.require(session,"manual-receipts:"+user.getDomainid()+":"+user.getId(),csrf);return read("request",shop,campaignId,requestToken,session);}
 private ResponseEntity<?> read(String operation,String shop,String campaign,String token,HttpSession session){var params=new JSONObject();params.put("campaignId",campaign);if(token!=null)params.put("requestToken",token);var r=support.applyBody(client.exchange("campaigns.receipt-reconciliation."+operation,user(session),shop,params,null));return ResponseEntity.status(r.getStatusCode()).headers(r.getHeaders()).header("Cache-Control","no-store").body(r.getBody());}
 private ResponseEntity<JSONObject> publicError(int status,String reason){
  String text=reason!=null&&reason.contains("V88")?"补拉任务表尚未初始化，请先在 shopify_marketing 执行 V88":switch(status){case 401->"登录已失效，请重新登录后再试";case 403->"需要店铺 OWNER 或平台店铺治理权限，请重新预检";case 409->reason==null?"当前活动不满足补拉条件，请确认有效期和发送状态":reason;case 404->"补拉接口未就绪，请确认服务版本一致";case 503->"补拉服务暂不可用，请检查后台初始化和中心连接";default->"补拉查询失败，请联系管理员检查服务日志";};
  JSONObject body=new JSONObject();body.put("message",text);return ResponseEntity.status(status).header("Cache-Control","no-store").body(body);
 }
 @ExceptionHandler(ResponseStatusException.class)
 public ResponseEntity<JSONObject> rejected(ResponseStatusException failure){return publicError(failure.getStatus().value(),failure.getReason());}
 private com.yskj.dao.dto.org.LoginedUser user(HttpSession session){return PlatformUserContext.current(session).orElseThrow(()->new ResponseStatusException(HttpStatus.UNAUTHORIZED));}
}
