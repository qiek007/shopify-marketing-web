package com.yskj.shopify.web.config;

import com.yskj.core.SpringInterceptor;
import com.yskj.filter.OrgInterceptor;
import com.yskj.service.org.appSessionListener;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.ServletListenerRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewResolverRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;

@EnableWebMvc
@Configuration
public class PlatformWebMvcConfiguration implements WebMvcConfigurer {

    private static final String[] STATIC = {
            "/baseui/**", "/shopify/**", "/shopify-theme/**", "/js/**", "/css/**",
            "/img/**", "/libs/**", "/favicon.ico"
    };

    private final SpringInterceptor springInterceptor;
    private final OrgInterceptor orgInterceptor;
    private final ShopifyWebThemeProperties theme;

    @Value("${shopify.web.dev-resource-root:}")
    private String devResourceRoot = "";

    @Value("${shopify.web.static-cache-seconds:2592000}")
    private long staticCacheSeconds = Duration.ofDays(30).getSeconds();

    public PlatformWebMvcConfiguration(SpringInterceptor springInterceptor,
                                       OrgInterceptor orgInterceptor,
                                       ShopifyWebThemeProperties theme) {
        this.springInterceptor = springInterceptor;
        this.orgInterceptor = orgInterceptor;
        this.theme = theme;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(springInterceptor).addPathPatterns("/**")
                .excludePathPatterns(STATIC);
        registry.addInterceptor(orgInterceptor).addPathPatterns("/**")
                .excludePathPatterns(STATIC);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        resource(registry, "/baseui/**", "WEB-INF/resources/baseui/");
        resource(registry, "/shopify/**", "shopify/");
        resource(registry, "/shopify-theme/**", theme.assetDirectory() + "/");
        resource(registry, "/js/**", "WEB-INF/resources/js/");
        resource(registry, "/css/**", "WEB-INF/resources/css/");
        resource(registry, "/img/**", "WEB-INF/resources/img/");
        resource(registry, "/libs/**", "WEB-INF/resources/libs/");
    }

    private void resource(ResourceHandlerRegistry registry, String pattern, String directory) {
        var registration = registry.addResourceHandler(pattern);
        if (!devResourceRoot.isBlank()) {
            Path root = Path.of(devResourceRoot).toAbsolutePath().normalize();
            if (!Files.isDirectory(root)) {
                throw new IllegalStateException("Local web resource root does not exist: " + root);
            }
            registration.addResourceLocations(root.resolve(directory).toUri().toString());
        }
        registration.addResourceLocations("classpath:/META-INF/resources/" + directory)
                .setCacheControl(staticCacheSeconds <= 0 ? CacheControl.noStore()
                        : CacheControl.maxAge(Duration.ofSeconds(staticCacheSeconds)).cachePublic());
    }

    @Override
    public void configureViewResolvers(ViewResolverRegistry registry) {
        registry.viewResolver(new ShopifyWebThemeViewResolver(theme));
    }

    @Bean
    public ServletListenerRegistrationBean<appSessionListener> platformSessionListener() {
        return new ServletListenerRegistrationBean<>(new appSessionListener());
    }
}
