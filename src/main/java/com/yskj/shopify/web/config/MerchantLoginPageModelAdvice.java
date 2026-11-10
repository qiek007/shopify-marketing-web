package com.yskj.shopify.web.config;

import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

/** Presentation capability for this web application's existing alternative-login endpoints. */
@ControllerAdvice
public class MerchantLoginPageModelAdvice {
    @ModelAttribute("alternativeLoginSupported")
    public boolean alternativeLoginSupported() {
        return true;
    }
}
