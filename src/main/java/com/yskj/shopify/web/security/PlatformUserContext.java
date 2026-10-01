package com.yskj.shopify.web.security;

import com.alibaba.fastjson.JSONObject;
import com.yskj.dao.dto.org.LoginedUser;

import javax.servlet.http.HttpSession;
import java.util.Optional;

public final class PlatformUserContext {

    public static final String SESSION_ATTRIBUTE = "logineduser";

    private PlatformUserContext() { }

    public static Optional<LoginedUser> current(HttpSession session) {
        if (session == null) return Optional.empty();
        Object value = session.getAttribute(SESSION_ATTRIBUTE);
        return value instanceof LoginedUser user ? Optional.of(user) : Optional.empty();
    }

    public static JSONObject identity(LoginedUser user) {
        JSONObject value = new JSONObject(true);
        value.put("id", user.getId());
        value.put("domainId", user.getDomainid());
        value.put("applicationId", user.getApplicationid());
        value.put("aclNameList", user.getAclNameList());
        value.put("lastName", user.getLastName());
        value.put("shortName", user.getShortName());
        value.put("email", user.getEmail());
        value.put("mobilePhone", user.getMobilePhone());
        return value;
    }
}
