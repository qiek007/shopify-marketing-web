package com.yskj.shopify.web.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.Map;

@Component
public final class ShopifyWebThemeProperties {

    private static final Map<String, ThemeDirectories> THEMES = Map.of(
            "classic", new ThemeDirectories("shopify", "shopify"),
            "theme2", new ThemeDirectories("shopify-theme2", "shopify-theme2"));

    private final String theme;
    private final ThemeDirectories directories;

    public ShopifyWebThemeProperties(@Value("${shopify.web.theme:classic}") String theme) {
        this.theme = theme == null ? "" : theme.trim().toLowerCase(Locale.ROOT);
        this.directories = THEMES.get(this.theme);
        if (directories == null) {
            throw new IllegalArgumentException("Unknown Shopify web theme: " + theme);
        }
    }

    public String theme() { return theme; }
    public String viewDirectory() { return directories.viewDirectory(); }
    public String assetDirectory() { return directories.assetDirectory(); }
    public String publicAssetBase() { return "/shopify-theme"; }
    public String assetVersion() { return "20260930-" + theme; }

    private record ThemeDirectories(String viewDirectory, String assetDirectory) { }
}
