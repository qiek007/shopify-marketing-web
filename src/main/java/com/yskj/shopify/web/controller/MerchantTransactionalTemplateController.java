package com.yskj.shopify.web.controller;

import com.alibaba.fastjson.JSONObject;
import com.yskj.dao.dto.org.LoginedUser;
import com.yskj.shopify.web.security.PlatformUserContext;
import com.yskj.shopify.web.service.MerchantWebFacadeClient;
import com.yskj.shopify.contract.web.MerchantWebProtocol;
import org.springframework.http.*;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import javax.servlet.http.HttpSession;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Set;
import java.util.UUID;

@Controller
@RequestMapping("/stores/transactional-email/templates")
public class MerchantTransactionalTemplateController {
    private static final Set<String> FIELDS=Set.of("purpose","locale","subject","html","text","expectedRevision","publicationToken","versionId");
    private final MerchantWebFacadeClient client;
    private final RemotePageSupport support;
    public MerchantTransactionalTemplateController(MerchantWebFacadeClient client,RemotePageSupport support){this.client=client;this.support=support;}

    @GetMapping
    public String page(@RequestParam MultiValueMap<String,String> params,HttpSession session,Model model,RedirectAttributes redirect){
        var user=requireUser(session);
        String view=support.applyView(client.exchange("transactional-template.page",user,params.getFirst("shop"),parameters(params),null),model,redirect);
        synchronized(session){
            if(!(session.getAttribute("transactionalTemplateCsrf") instanceof String))session.setAttribute("transactionalTemplateCsrf",UUID.randomUUID().toString());
            model.addAttribute("transactionalTemplateCsrf",session.getAttribute("transactionalTemplateCsrf"));
        }
        return view;
    }
    @PostMapping(value="/draft",produces=MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> draft(@RequestParam MultiValueMap<String,String> params,HttpSession session){return write("draft",params,session);}
    @PostMapping(value="/preview",produces=MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> preview(@RequestParam MultiValueMap<String,String> params,HttpSession session){return write("preview",params,session);}
    @PostMapping(value="/publish",produces=MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> publish(@RequestParam MultiValueMap<String,String> params,HttpSession session){return write("publish",params,session);}
    @PostMapping(value="/rollback",produces=MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> rollback(@RequestParam MultiValueMap<String,String> params,HttpSession session){return write("rollback",params,session);}
    @PostMapping(value="/default-locale",produces=MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> defaultLocale(@RequestParam MultiValueMap<String,String> params,HttpSession session){return write("default-locale",params,session);}

    private ResponseEntity<?> write(String action,MultiValueMap<String,String> params,HttpSession session){
        try {
            var user=requireUser(session);Object expected=session.getAttribute("transactionalTemplateCsrf");String supplied=params.getFirst("_transactionalTemplateCsrf");
            if(!(expected instanceof String token)||supplied==null||!MessageDigest.isEqual(token.getBytes(StandardCharsets.UTF_8),supplied.getBytes(StandardCharsets.UTF_8)))throw new ResponseStatusException(HttpStatus.FORBIDDEN);
            var remote=MerchantWebProtocol.validateResponse(client.exchange("transactional-template."+action,user,params.getFirst("shop"),parameters(params),null));
            // Handle only this feature's errors; keep global error-detail settings private.
            if(MerchantWebProtocol.ERROR.equals(remote.getString("kind")))
                return failure(remote.getIntValue("httpStatus"),remote.getString("code"),remote.getString("message"));
            var response=support.applyBody(remote);
            return ResponseEntity.status(response.getStatusCode()).headers(response.getHeaders()).header("Cache-Control","no-store").body(response.getBody());
        } catch(ResponseStatusException rejected) {
            return failure(rejected.getStatus().value(),"REQUEST_REJECTED",rejected.getReason());
        }
    }
    private ResponseEntity<JSONObject> failure(int status,String code,String detail) {
        String message=switch(status) {
            case 400 -> detail==null||detail.isBlank()?"模板内容格式不正确，请检查主题、正文和变量。":detail;
            case 409 -> detail==null||detail.isBlank()?"模板已更新，请重新加载后再操作；当前输入仍保留。":detail;
            case 401 -> "登录已失效，请重新登录；当前输入仍保留。";
            case 403 -> "操作权限或会话校验已失效，请重新打开模板页面；当前输入仍保留。";
            case 404 -> "模板接口或版本不存在，请确认中心服务已更新。";
            case 429 -> "操作过于频繁，请稍后重试；当前输入仍保留。";
            default -> "模板服务暂时无法完成操作，请稍后重试；当前输入仍保留。";
        };
        var body=new JSONObject();body.put("code",code);body.put("message",message);
        return ResponseEntity.status(status).contentType(MediaType.APPLICATION_JSON).header("Cache-Control","no-store").body(body);
    }
    private JSONObject parameters(MultiValueMap<String,String> params){var result=new JSONObject();for(String field:FIELDS)if(params.containsKey(field))result.put(field,params.getFirst(field));return result;}
    private LoginedUser requireUser(HttpSession session){return PlatformUserContext.current(session).orElseThrow(()->new ResponseStatusException(HttpStatus.UNAUTHORIZED));}
}
