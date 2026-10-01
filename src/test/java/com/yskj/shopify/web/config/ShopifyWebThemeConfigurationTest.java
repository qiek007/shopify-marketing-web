package com.yskj.shopify.web.config;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ShopifyWebThemeConfigurationTest {

    @Test
    void resolvesBothIndependentThemeDirectories() {
        assertThat(new ShopifyWebThemeProperties("classic").viewDirectory())
                .isEqualTo("shopify");
        assertThat(new ShopifyWebThemeProperties("theme2").viewDirectory())
                .isEqualTo("shopify-theme2");
        assertThat(new ShopifyWebThemeViewResolver(
                new ShopifyWebThemeProperties("theme2"))
                .resolveLogicalViewName("shopify/dashboard"))
                .isEqualTo("shopify-theme2/dashboard");
    }

    @Test
    void rejectsUnknownThemes() {
        assertThatThrownBy(() -> new ShopifyWebThemeProperties("unknown"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unknown Shopify web theme");
    }
}
