package com.yskj.shopify.web.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.nio.file.Files;
import java.nio.file.Path;

@Configuration(proxyBeanMethods = false)
@Profile("local")
public class LocalJspDocumentRootConfiguration {

    @Bean
    WebServerFactoryCustomizer<TomcatServletWebServerFactory> localJspDocumentRoot(
            @Value("${shopify.web.dev-resource-root}") String configuredRoot) {
        return factory -> {
            Path root = Path.of(configuredRoot).toAbsolutePath().normalize();
            if (!Files.isDirectory(root.resolve("WEB-INF/shopify"))) {
                throw new IllegalStateException("Local JSP source directory does not exist: " + root);
            }
            factory.setDocumentRoot(root.toFile());
            factory.addContextCustomizers(context ->
                    context.getResources().setCachingAllowed(false));
        };
    }
}
