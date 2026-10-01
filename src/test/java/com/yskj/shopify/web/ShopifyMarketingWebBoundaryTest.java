package com.yskj.shopify.web;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.config.YamlPropertiesFactoryBean;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.core.io.FileSystemResource;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Properties;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

class ShopifyMarketingWebBoundaryTest {

    @Test
    void buildsAsAWebWarWithCenterClientsButNoBusinessDatabaseDrivers() throws Exception {
        String pom = Files.readString(Path.of("pom.xml"));

        assertThat(pom).contains(
                "<packaging>war</packaging>",
                "<artifactId>shopifymarketingmerchant_jar</artifactId>",
                "<artifactId>marketing-contract</artifactId>",
                "<artifactId>core</artifactId>",
                "<artifactId>org_jar</artifactId>",
                "<artifactId>baseui</artifactId>",
                "<artifactId>spring-jdbc</artifactId>",
                "<artifactId>tomcat-embed-jasper</artifactId>",
                "<artifactId>jstl</artifactId>")
                .doesNotContain(
                        "<artifactId>druid-spring-boot-starter</artifactId>",
                        "<artifactId>mysql-connector-j</artifactId>");
    }

    @Test
    void sourceContainsNoDatasourceJdbcOrBusinessScheduledWorkers() throws Exception {
        try (var paths = Files.walk(Path.of("src/main/java"))) {
            String source = paths.filter(path -> path.toString().endsWith(".java"))
                    .map(path -> {
                        try { return Files.readString(path); }
                        catch (Exception failure) { throw new IllegalStateException(failure); }
                    })
                    .collect(Collectors.joining("\n"));

            assertThat(source)
                    .doesNotContain("JdbcTemplate", "DataSource", "@Scheduled(");
        }
    }

    @Test
    void configRequiresTheSharedImportRootAndBoundsMultipartUploads() throws Exception {
        String application = Files.readString(Path.of("src/main/resources/application.yml"));
        String example = Files.readString(Path.of("src/main/resources/application.example.yml"));

        assertThat(application).contains(
                "temp-directory: ${SHOPIFY_CUSTOMER_IMPORT_TEMP_DIRECTORY:",
                "backend-base-url: ${SHOPIFY_CUSTOMER_IMPORT_BACKEND_BASE_URL:",
                "max-file-size: 64MB", "max-request-size: 66MB");
        assertThat(example).contains(
                "temp-directory: REPLACE_WITH_LOCAL_TEMP_DIRECTORY",
                "backend-base-url: REPLACE_WITH_SHOPIFY_MARKETING_INTERNAL_URL");
    }

    @Test
    void scansOnlyTheCenterLoginAndWebPackages() {
        SpringBootApplication application = ShopifyMarketingWebApplication.class
                .getAnnotation(SpringBootApplication.class);

        assertThat(application.scanBasePackages()).containsExactlyInAnyOrder(
                "com.yskj.shopify.web", "com.yskj.core", "com.yskj.service",
                "com.yskj.filter", "com.yskj.controls",
                "com.yskj.minaclient", "com.yskj.minaserver");
    }

    @Test
    void doesNotConfigureAMinaServiceEndpoint() {
        assertMinaServiceEndpointIsEmpty("src/main/resources/application.yml");
        assertMinaServiceEndpointIsEmpty("src/main/resources/application.example.yml");
        assertMinaServiceEndpointIsEmpty("config/application-local.example.yml");
    }

    @Test
    void localDevelopmentConfigurationServesJspFilesFromTheSourceTree() throws Exception {
        String local = Files.readString(Path.of("config/application-local.example.yml"));
        String runConfiguration = Files.readString(Path.of(
                ".run/ShopifyMarketingWebApplication (local).run.xml"));

        assertThat(local).contains(
                "development: true",
                "modificationTestInterval: 0",
                "dev-resource-root: ./src/main/resources/META-INF/resources",
                "static-cache-seconds: 0");
        assertThat(runConfiguration).contains(
                "-Dspring.profiles.active=local",
                "<option name=\"WORKING_DIRECTORY\" value=\"$PROJECT_DIR$\" />");
    }

    private void assertMinaServiceEndpointIsEmpty(String path) {
        YamlPropertiesFactoryBean yaml = new YamlPropertiesFactoryBean();
        yaml.setResources(new FileSystemResource(path));
        Properties properties = yaml.getObject();

        assertThat(properties).isNotNull();
        assertThat(properties.getProperty("yskj.mina.name")).isNullOrEmpty();
        assertThat(properties.getProperty("yskj.mina.addr")).isNullOrEmpty();
        assertThat(properties.getProperty("yskj.mina.port")).isNullOrEmpty();
        assertThat(properties.getProperty("yskj.mina.dataid")).isNullOrEmpty();
        assertThat(properties.getProperty("yskj.mina.unitid")).isNullOrEmpty();
    }
}
