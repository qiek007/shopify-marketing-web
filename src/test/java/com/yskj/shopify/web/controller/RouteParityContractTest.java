package com.yskj.shopify.web.controller;

import org.junit.jupiter.api.Test;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;

import java.lang.reflect.Method;
import java.util.LinkedHashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class RouteParityContractTest {

    @Test
    void exposesEveryMerchantUiRouteButNoExternalBusinessCallback() {
        Set<String> routes = routes(
                MerchantConsoleController.class,
                MerchantPasswordController.class,
                SessionKeepaliveController.class,
                HealthController.class);

        assertThat(routes).contains(
                "/", "/dashboard", "/dashboard/trends", "/dashboard/trends/export.xlsx",
                "/issues", "/issues/replay", "/issues/ignore",
                "/stores", "/settings/ga4", "/settings/ga4/service-account",
                "/stores/web-pixel/status", "/stores/web-pixel/enable",
                "/stores/sender-settings", "/stores/sync",
                "/stores/members/grant", "/stores/members/revoke",
                "/customers", "/customers/results", "/customers/tags/options",
                "/customers/tags/add", "/customers/tags/remove",
                "/customers/imports", "/customers/imports/template", "/customers/imports/result",
                "/customers/detail", "/customers/detail/timeline",
                "/customers/detail/timeline/group", "/customers/campaign-preview",
                "/suppressions", "/products", "/products/detail",
                "/products/detail/orders", "/orders", "/discounts",
                "/templates", "/templates/platform/catalog", "/templates/bindings",
                "/templates/platform/copy", "/templates/platform/preview",
                "/templates/preview", "/templates/editor", "/templates/products",
                "/templates/discounts", "/templates/action",
                "/campaigns", "/campaigns/template-options", "/campaigns/editor",
                "/campaigns/detail", "/campaigns/detail/recipients",
                "/campaigns/detail/customer", "/campaigns/detail/customer/timeline",
                "/campaigns/detail/progress", "/campaigns/preview", "/campaigns/action",
                "/segments", "/segments/editor", "/segments/preview",
                "/segments/preview/results", "/segments/customer/detail",
                "/segments/from-customer-filter", "/automations",
                "/automations/detail", "/automations/update", "/automations/action",
                "/reports", "/account/password", "/session/keepalive", "/health", "/runstate")
                .doesNotContain(
                        "/shopify/install", "/shopify/oauth/callback", "/pixel/collect",
                        "/internal/shopify/events", "/internal/email/events");
    }

    private Set<String> routes(Class<?>... types) {
        Set<String> routes = new LinkedHashSet<>();
        for (Class<?> type : types) {
            for (Method method : type.getDeclaredMethods()) {
                GetMapping get = method.getAnnotation(GetMapping.class);
                PostMapping post = method.getAnnotation(PostMapping.class);
                if (get != null) routes.addAll(Set.of(get.value()));
                if (post != null) routes.addAll(Set.of(post.value()));
            }
        }
        return routes;
    }
}
