package com.yskj.shopify.web.config;

import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.View;
import org.springframework.web.servlet.ViewResolver;
import org.springframework.web.servlet.view.InternalResourceViewResolver;

import java.util.Locale;

public final class ShopifyWebThemeViewResolver implements ViewResolver, ApplicationContextAware {

    private static final String SHOPIFY_PREFIX = "shopify/";
    private final ShopifyWebThemeProperties theme;
    private final InternalResourceViewResolver delegate =
            new InternalResourceViewResolver("/WEB-INF/", ".jsp");

    public ShopifyWebThemeViewResolver(ShopifyWebThemeProperties theme) {
        this.theme = theme;
    }

    @Override
    public void setApplicationContext(@NonNull ApplicationContext applicationContext) {
        delegate.setApplicationContext(applicationContext);
    }

    @Override
    public View resolveViewName(String viewName, Locale locale) throws Exception {
        return delegate.resolveViewName(resolveLogicalViewName(viewName), locale);
    }

    String resolveLogicalViewName(String viewName) {
        if (viewName != null && viewName.startsWith(SHOPIFY_PREFIX)) {
            return theme.viewDirectory() + "/" + viewName.substring(SHOPIFY_PREFIX.length());
        }
        return viewName;
    }
}
