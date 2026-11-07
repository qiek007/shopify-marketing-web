package com.yskj.shopify.web.controller;

import com.alibaba.fastjson.JSONObject;
import com.yskj.core.annotation.HkInject;
import com.yskj.core.annotation.HkInjectService;
import com.yskj.dao.dto.org.LoginedUser;
import com.yskj.service.org.IOrgService;
import com.yskj.service.org.IWebSessionService;
import com.yskj.shopify.web.security.PlatformUserContext;
import com.yskj.utils.ResourceUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.server.ResponseStatusException;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

@Controller
@HkInject
public class MerchantAlternativeLoginController {

    private static final Logger LOGGER =
            LoggerFactory.getLogger(MerchantAlternativeLoginController.class);
    private static final int MAX_TOKEN_LENGTH = 4096;

    @HkInjectService(ServiceName = "org",
            ServicePackage = "com.yskj.service.org.impl.OrgServiceImpl")
    private IOrgService orgService;

    @Autowired
    private IWebSessionService webSessionService;

    private String appId;

    @Value("${shopify.web.org.message-server-host:}")
    private String messageServerHost = "";

    public MerchantAlternativeLoginController() {
    }

    MerchantAlternativeLoginController(IOrgService orgService,
                                    IWebSessionService webSessionService,
                                    String appId,
                                    String messageServerHost) {
        this.orgService = orgService;
        this.webSessionService = webSessionService;
        this.appId = appId;
        this.messageServerHost = messageServerHost;
    }

    @GetMapping("/org/login/scan-config")
    @ResponseBody
    public JSONObject qrMessageServerConfig() {
        if (orgService == null) {
            return failure("统一认证消息服务暂时不可用");
        }
        String host = messageServerHost == null ? "" : messageServerHost.trim();
        if (host.isEmpty()) {
            return failure("统一认证消息服务主机未配置");
        }
        try {
            JSONObject remote = orgService.getOnlineMsgserver(host);
            if (remote == null) {
                return failure("统一认证消息服务配置不可用");
            }
            String ws = socketUrl(remote.getString("ws"), "ws://");
            String wss = socketUrl(remote.getString("wss"), "wss://");
            if (ws == null && wss == null) {
                return failure("统一认证消息服务地址无效");
            }
            JSONObject result = response("success", "统一认证消息服务配置已加载");
            result.put("ws", ws);
            result.put("wss", wss);
            result.put("clientType", safeMessage(
                    remote.getString("clienttypeid"), "scantologin"));
            return result;
        } catch (RuntimeException remoteFailure) {
            LOGGER.warn("Loading remote org QR message config failed ({})",
                    remoteFailure.getClass().getSimpleName());
            return failure("统一认证消息服务暂时不可用");
        }
    }

    @PostMapping("/org/login/scan-complete")
    @ResponseBody
    public JSONObject completeQrLogin(
            @RequestParam("scanToken") String token,
            HttpServletRequest request,
            @RequestHeader(value = "X-Requested-With", required = false)
            String requestedWith) {
        if (!"XMLHttpRequest".equals(requestedWith)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        String normalizedToken = token == null ? "" : token.trim();
        if (normalizedToken.isEmpty() || normalizedToken.length() > MAX_TOKEN_LENGTH) {
            return failure("扫码登录凭证无效或已过期");
        }
        if (orgService == null || webSessionService == null) {
            return failure("统一认证服务暂时不可用");
        }
        String resolvedAppId = appId;
        if (resolvedAppId == null || resolvedAppId.isBlank()) {
            resolvedAppId = ResourceUtil.getString("druid", "app.id");
        }
        if (resolvedAppId == null || resolvedAppId.isBlank()) {
            return failure("统一认证应用配置不可用");
        }
        HttpSession session = request.getSession();
        String contextPath = request.getContextPath() == null
                ? "" : request.getContextPath();
        try {
            LoginedUser user = orgService.ssologin(resolvedAppId, normalizedToken);
            if (user == null) {
                return failure("扫码登录凭证无效或已过期");
            }
            if (user.getStateCode() == 9) {
                request.changeSessionId();
                session.setAttribute(PlatformUserContext.SESSION_ATTRIBUTE, user);
                return success("身份验证成功，请先修改密码",
                        contextPath + "/org/changepass");
            }
            if (user.getStateCode() != 0) {
                return failure(safeMessage(user.getStateMessage(), "扫码登录失败"));
            }
            if (user.getLoginid() == null || user.getLoginid().isBlank()) {
                return failure("统一认证服务返回的身份无效");
            }
            request.changeSessionId();
            webSessionService.addWebSession(session, user.getLoginid());
            session.setAttribute(PlatformUserContext.SESSION_ATTRIBUTE, user);
            return success("扫码登录成功", contextPath + "/dashboard");
        } catch (RuntimeException remoteFailure) {
            LOGGER.warn("Remote org QR login failed ({})",
                    remoteFailure.getClass().getSimpleName());
            return failure("统一认证服务暂时不可用");
        }
    }

    private JSONObject success(String message, String redirectTo) {
        JSONObject result = response("success", message);
        result.put("redirectTo", redirectTo);
        return result;
    }

    private JSONObject failure(String message) {
        return response("failure", message);
    }

    private JSONObject response(String state, String message) {
        JSONObject result = new JSONObject();
        result.put("state", state);
        result.put("message", message);
        return result;
    }

    private String safeMessage(String message, String fallback) {
        return message == null || message.isBlank() ? fallback : message;
    }

    private String socketUrl(String value, String requiredPrefix) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.startsWith(requiredPrefix) ? normalized : null;
    }
}
