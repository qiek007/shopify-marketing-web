package com.yskj.shopify.web.controller;

import com.alibaba.fastjson.JSONObject;
import com.yskj.core.annotation.HkInject;
import com.yskj.core.annotation.HkInjectService;
import com.yskj.dao.dto.org.LoginedUser;
import com.yskj.service.org.IOrgService;
import com.yskj.shopify.web.security.PlatformUserContext;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.server.ResponseStatusException;

import javax.servlet.http.HttpSession;

@Controller
@HkInject
public class MerchantPasswordController {

    @HkInjectService(ServiceName = "org",
            ServicePackage = "com.yskj.service.org.impl.OrgServiceImpl")
    private IOrgService orgService;

    @PostMapping("/account/password")
    @ResponseBody
    public JSONObject changePassword(@RequestParam String oldPassword,
                                     @RequestParam String newPassword,
                                     @RequestParam String confirmPassword,
                                     HttpSession session,
                                     @RequestHeader(value = "X-Requested-With", required = false)
                                     String requestedWith) {
        if (!"XMLHttpRequest".equals(requestedWith)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        LoginedUser user = PlatformUserContext.current(session)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        if (empty(oldPassword) || empty(newPassword) || empty(confirmPassword)) {
            return response("failure", "请完整填写原密码、新密码和确认密码");
        }
        if (!newPassword.equals(confirmPassword)) {
            return response("failure", "两次输入的新密码不一致");
        }
        if (oldPassword.equals(newPassword)) {
            return response("failure", "新密码不能与原密码相同");
        }
        if (orgService == null) return response("failure", "密码修改服务暂时不可用");
        JSONObject result = orgService.changeuserpassword(
                user, user.getApplicationid(), oldPassword, newPassword);
        return result == null ? response("failure", "密码修改服务未返回结果") : result;
    }

    private boolean empty(String value) { return value == null || value.isEmpty(); }

    private JSONObject response(String state, String message) {
        JSONObject result = new JSONObject(true);
        result.put("state", state);
        result.put("message", message);
        return result;
    }
}
