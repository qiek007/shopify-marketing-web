package com.yskj.shopify.web.config;

import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

@ControllerAdvice(basePackages = "com.yskj.shopify.web.controller")
public class ShopifyWebThemeModelAdvice {

    private final ShopifyWebThemeProperties theme;

    public ShopifyWebThemeModelAdvice(ShopifyWebThemeProperties theme) { this.theme = theme; }

    @ModelAttribute("uiTheme")
    public String uiTheme() { return theme.theme(); }

    @ModelAttribute("uiAssetBase")
    public String uiAssetBase() { return theme.publicAssetBase(); }

    @ModelAttribute("uiAssetVersion")
    public String uiAssetVersion() { return theme.assetVersion(); }
}
