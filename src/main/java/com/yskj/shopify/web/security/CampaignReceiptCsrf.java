package com.yskj.shopify.web.security;

import javax.servlet.http.HttpSession;
import java.io.Serializable;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** Stable session/actor-bound CSRF token; never logged or included in supplier commands. */
public final class CampaignReceiptCsrf {
    private static final String KEY=CampaignReceiptCsrf.class.getName()+".token";
    private record Entry(String actor,String token) implements Serializable { }
    private CampaignReceiptCsrf() { }
    public static String issue(HttpSession session,String actor) {
        synchronized(session) {
            Object previous=session.getAttribute(KEY);
            if(previous instanceof Entry entry && entry.actor().equals(actor))return entry.token();
            byte[] random=new byte[32];new SecureRandom().nextBytes(random);
            String token=Base64.getUrlEncoder().withoutPadding().encodeToString(random);
            session.setAttribute(KEY,new Entry(actor,token));return token;
        }
    }
    public static void require(HttpSession session,String actor,String token) {
        synchronized(session) {
            Object saved=session.getAttribute(KEY);
            if(!(saved instanceof Entry entry) || !entry.actor().equals(actor) || token==null || token.length()>128
                    || !MessageDigest.isEqual(entry.token().getBytes(StandardCharsets.UTF_8),token.getBytes(StandardCharsets.UTF_8)))
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,"补拉确认已失效，请重新预检后重试");
        }
    }
}
