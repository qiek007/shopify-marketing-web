package com.yskj.shopify.web.controller;

import com.alibaba.fastjson.JSONObject;
import com.yskj.dao.dto.org.LoginedUser;
import com.yskj.service.org.IOrgService;
import com.yskj.service.org.IWebSessionService;
import com.yskj.shopify.web.security.PlatformUserContext;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;

import javax.servlet.http.HttpServletRequest;
import java.lang.reflect.InvocationTargetException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup;

class MerchantAlternativeLoginControllerTest {

    @Test
    void redeemsQrTokenThroughRemoteOrgAndRegistersTheWebSession() throws Exception {
        IOrgService org = mock(IOrgService.class);
        IWebSessionService webSessions = mock(IWebSessionService.class);
        LoginedUser user = user(0, "login-1", "");
        when(org.ssologin("app-1", "scan-token")).thenReturn(user);
        Object controller = newController(org, webSessions, "app-1");
        MockHttpSession session = new MockHttpSession();
        String originalSessionId = session.getId();

        JSONObject result = invoke(controller, "scan-token", request(session), "XMLHttpRequest");

        assertThat(result).containsOnlyKeys("state", "message", "redirectTo");
        assertThat(result.getString("state")).isEqualTo("success");
        assertThat(result.getString("redirectTo"))
                .isEqualTo("/shopify-marketing-web/dashboard");
        assertThat(session.getAttribute(PlatformUserContext.SESSION_ATTRIBUTE)).isSameAs(user);
        assertThat(session.getId()).isNotEqualTo(originalSessionId);
        verify(org).ssologin("app-1", "scan-token");
        verify(webSessions).addWebSession(session, "login-1");
    }

    @Test
    void preservesTheRemoteForcedPasswordChangeFlow() throws Exception {
        IOrgService org = mock(IOrgService.class);
        IWebSessionService webSessions = mock(IWebSessionService.class);
        LoginedUser user = user(9, "login-9", "密码已过期");
        when(org.ssologin("app-1", "password-token")).thenReturn(user);
        Object controller = newController(org, webSessions, "app-1");
        MockHttpSession session = new MockHttpSession();

        JSONObject result = invoke(
                controller, "password-token", request(session), "XMLHttpRequest");

        assertThat(result.getString("state")).isEqualTo("success");
        assertThat(result.getString("redirectTo"))
                .isEqualTo("/shopify-marketing-web/org/changepass");
        assertThat(session.getAttribute(PlatformUserContext.SESSION_ATTRIBUTE)).isSameAs(user);
        verify(webSessions, never()).addWebSession(any(), any());
    }

    @Test
    void rejectsInvalidTokensBeforeCallingRemoteServices() throws Exception {
        IOrgService org = mock(IOrgService.class);
        IWebSessionService webSessions = mock(IWebSessionService.class);
        Object controller = newController(org, webSessions, "app-1");

        JSONObject blank = invoke(
                controller, " ", request(new MockHttpSession()), "XMLHttpRequest");
        JSONObject oversized = invoke(controller, "x".repeat(4097),
                request(new MockHttpSession()), "XMLHttpRequest");

        assertThat(blank.getString("state")).isEqualTo("failure");
        assertThat(oversized.getString("state")).isEqualTo("failure");
        verifyNoInteractions(org, webSessions);
    }

    @Test
    void normalizesRejectedMissingAndExceptionalRemoteResults() throws Exception {
        IOrgService org = mock(IOrgService.class);
        IWebSessionService webSessions = mock(IWebSessionService.class);
        Object controller = newController(org, webSessions, "app-1");
        LoginedUser rejected = user(4, "rejected", "当前账号不允许扫码登录");
        when(org.ssologin("app-1", "missing")).thenReturn(null);
        when(org.ssologin("app-1", "rejected")).thenReturn(rejected);
        when(org.ssologin("app-1", "secret-token"))
                .thenThrow(new IllegalStateException("token=secret-token"));
        LoginedUser registrationFailure = user(0, "registration-failure", "");
        when(org.ssologin("app-1", "registration-error")).thenReturn(registrationFailure);
        MockHttpSession registrationSession = new MockHttpSession();
        when(webSessions.addWebSession(registrationSession, "registration-failure"))
                .thenThrow(new IllegalStateException("registration failed"));

        JSONObject missing = invoke(
                controller, "missing", request(new MockHttpSession()), "XMLHttpRequest");
        JSONObject denied = invoke(
                controller, "rejected", request(new MockHttpSession()), "XMLHttpRequest");
        JSONObject failed = invoke(
                controller, "secret-token", request(new MockHttpSession()), "XMLHttpRequest");
        JSONObject registration = invoke(
                controller, "registration-error", request(registrationSession), "XMLHttpRequest");

        assertThat(missing.getString("message")).contains("无效", "过期");
        assertThat(denied.getString("message")).isEqualTo("当前账号不允许扫码登录");
        assertThat(failed.getString("message")).doesNotContain("secret-token", "token=");
        assertThat(registration.getString("state")).isEqualTo("failure");
        assertThat(registrationSession.getAttribute(PlatformUserContext.SESSION_ATTRIBUTE))
                .isNull();
    }

    @Test
    void requiresTheAjaxHeaderAndExposesOnlyPost() throws Exception {
        IOrgService org = mock(IOrgService.class);
        IWebSessionService webSessions = mock(IWebSessionService.class);
        LoginedUser user = user(0, "login-1", "");
        when(org.ssologin("app-1", "scan-token")).thenReturn(user);
        Object controller = newController(org, webSessions, "app-1");
        MockMvc mvc = standaloneSetup(controller).build();

        mvc.perform(post("/org/login/scan-complete").param("scanToken", "scan-token"))
                .andExpect(status().isForbidden());
        mvc.perform(post("/org/login/scan-complete")
                        .header("X-Requested-With", "XMLHttpRequest")
                        .param("scanToken", "scan-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.state").value("success"))
                .andExpect(jsonPath("$.redirectTo").value("/dashboard"));
    }

    @Test
    void loadsQrMessageServerConfigUsingTheConfiguredRemoteHost() throws Exception {
        IOrgService org = mock(IOrgService.class);
        IWebSessionService webSessions = mock(IWebSessionService.class);
        JSONObject remote = new JSONObject();
        remote.put("ws", "ws://login.example.test:11909/ws");
        remote.put("wss", "wss://login.example.test:11909/wss");
        remote.put("clienttypeid", "scantologin");
        when(org.getOnlineMsgserver("login.example.test")).thenReturn(remote);
        Object controller = newController(org, webSessions, "app-1");
        MockMvc mvc = standaloneSetup(controller).build();

        mvc.perform(get("/org/login/scan-config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.state").value("success"))
                .andExpect(jsonPath("$.ws").value("ws://login.example.test:11909/ws"))
                .andExpect(jsonPath("$.wss").value("wss://login.example.test:11909/wss"))
                .andExpect(jsonPath("$.clientType").value("scantologin"));
        verify(org).getOnlineMsgserver("login.example.test");
    }

    private Object newController(IOrgService org, IWebSessionService webSessions,
                                 String appId) throws Exception {
        Class<?> type;
        try {
            type = Class.forName(
                    "com.yskj.shopify.web.controller.MerchantAlternativeLoginController");
        } catch (ClassNotFoundException missing) {
            throw new AssertionError("MerchantAlternativeLoginController has not been implemented", missing);
        }
        var constructor = type.getDeclaredConstructor(
                IOrgService.class, IWebSessionService.class, String.class, String.class);
        constructor.setAccessible(true);
        return constructor.newInstance(
                org, webSessions, appId, "login.example.test");
    }

    private JSONObject invoke(Object controller, String token, HttpServletRequest request,
                              String requestedWith) throws Exception {
        try {
            return (JSONObject) controller.getClass()
                    .getMethod("completeQrLogin", String.class,
                            HttpServletRequest.class, String.class)
                    .invoke(controller, token, request, requestedWith);
        } catch (InvocationTargetException invocation) {
            if (invocation.getCause() instanceof RuntimeException) {
                throw (RuntimeException) invocation.getCause();
            }
            throw invocation;
        }
    }

    private MockHttpServletRequest request(MockHttpSession session) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setContextPath("/shopify-marketing-web");
        request.setSession(session);
        return request;
    }

    private LoginedUser user(int stateCode, String loginId, String message) {
        LoginedUser user = new LoginedUser();
        user.setId("admin-1");
        user.setLoginid(loginId);
        user.setStateCode(stateCode);
        user.setStateMessage(message);
        user.setLogintype("5");
        return user;
    }
}
