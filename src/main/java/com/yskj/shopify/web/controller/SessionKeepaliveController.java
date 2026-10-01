package com.yskj.shopify.web.controller;

import com.yskj.shopify.web.security.PlatformUserContext;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

@RestController
public class SessionKeepaliveController {

    @GetMapping("/session/keepalive")
    public ResponseEntity<Void> keepalive(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (PlatformUserContext.current(session).isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .cacheControl(CacheControl.noStore()).build();
        }
        return ResponseEntity.noContent().cacheControl(CacheControl.noStore())
                .header("X-Session-Timeout-Seconds",
                        Integer.toString(session.getMaxInactiveInterval())).build();
    }
}
