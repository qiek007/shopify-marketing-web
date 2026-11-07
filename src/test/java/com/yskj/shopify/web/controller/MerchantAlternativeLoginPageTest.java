package com.yskj.shopify.web.controller;

import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class MerchantAlternativeLoginPageTest {
    @Test
    void exposesAlternativeLoginControlsAndUsesSafeScanTokenParameter() throws Exception {
        Path root = Path.of("src/main/resources/META-INF/resources");
        String page = Files.readString(root.resolve("WEB-INF/org/index.jsp"));
        String script = Files.readString(root.resolve("shopify/js/merchant-alternative-login.js"));
        assertThat(page).contains("id=\"faceLoginButton\"", "id=\"qrLoginButton\"", "id=\"FacePic\"", "id=\"faceLoginDialog\"", "id=\"qrLoginDialog\"", "/org/login/scan-config", "/org/login/scan-complete", "face-login-mediapipe.js", "qrcode.min.js", "merchant-alternative-login.js");
        assertThat(script).contains("new URLSearchParams({scanToken: token})", "window.location.assign(payload.redirectTo)", "loginType.value = '6'", "initFaceLoginTracker");
    }
}