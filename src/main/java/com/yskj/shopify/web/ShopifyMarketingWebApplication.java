package com.yskj.shopify.web;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.ApplicationPidFileWriter;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication(scanBasePackages = {
        "com.yskj.shopify.web",
        "com.yskj.core",
        "com.yskj.service",
        "com.yskj.filter",
        "com.yskj.controls",
        "com.yskj.minaclient",
        // Legacy center wiring still scans this package; blank yskj.mina values disable service publication.
        "com.yskj.minaserver"
})
public class ShopifyMarketingWebApplication extends SpringBootServletInitializer {

    public static void main(String[] args) {
        SpringApplication application = new SpringApplication(ShopifyMarketingWebApplication.class);
        application.addListeners(new ApplicationPidFileWriter("./run.pid"));
        application.run(args);
    }
}
