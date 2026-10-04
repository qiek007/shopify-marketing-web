package com.yskj.shopify.web.upload;

import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.test.context.support.TestPropertySourceUtils;

import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.Proxy;
import java.net.ProxySelector;
import java.net.SocketAddress;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CustomerImportTransferClientTest {

    @Test
    void springCreatesTheClientFromTheConfiguredBackendUrl() {
        try (AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext()) {
            TestPropertySourceUtils.addInlinedPropertiesToEnvironment(context,
                    "shopify.web.customer-import.backend-base-url=http://10.0.0.12:7020/shopify-marketing");
            context.register(CustomerImportTransferClient.class);

            context.refresh();

            assertThat(context.getBean(CustomerImportTransferClient.class)).isNotNull();
        }
    }

    @Test
    void uploadsDirectlyWhenTheSystemProxyCannotReachTheInternalBackend(@TempDir Path root)
            throws Exception {
        AtomicInteger received = new AtomicInteger();
        HttpServer server = HttpServer.create(
                new InetSocketAddress(InetAddress.getLoopbackAddress(), 0), 0);
        server.createContext("/shopify-marketing/internal/customer-import/uploads/upload-1/chunks/0",
                exchange -> {
                    exchange.getRequestBody().readAllBytes();
                    received.incrementAndGet();
                    exchange.sendResponseHeaders(204, -1);
                    exchange.close();
                });
        server.start();
        ProxySelector original = ProxySelector.getDefault();
        ProxySelector.setDefault(new ProxySelector() {
            @Override
            public List<Proxy> select(URI uri) {
                return List.of(new Proxy(Proxy.Type.HTTP,
                        new InetSocketAddress(InetAddress.getLoopbackAddress(), 1)));
            }

            @Override
            public void connectFailed(URI uri, SocketAddress address, java.io.IOException failure) {
            }
        });
        try {
            Path file = root.resolve("customers.csv");
            Files.writeString(file, "email\na@example.com\n");
            CustomerImportTransferClient client = new CustomerImportTransferClient(
                    "http://127.0.0.1:" + server.getAddress().getPort() + "/shopify-marketing");

            client.upload(file, "upload-1", "token-1", 1024, 1);

            assertThat(received).hasValue(1);
        } finally {
            ProxySelector.setDefault(original);
            server.stop(0);
        }
    }

    @Test
    void rejectsAnRpcAdvertisedEndpointOutsideTheTrustedBackendHosts(@TempDir Path root) {
        CustomerImportTransferClient client = new CustomerImportTransferClient(
                "http://127.0.0.1:7020/shopify-marketing");
        Path file = root.resolve("customers.csv");

        assertThatThrownBy(() -> {
            var method = java.util.Arrays.stream(CustomerImportTransferClient.class.getMethods())
                    .filter(candidate -> candidate.getName().equals("upload")
                            && candidate.getParameterCount() == 7)
                    .findFirst().orElseThrow();
            method.invoke(client, file, "server-evil", "http://evil.example/upload",
                    "upload-1", "token-1", 1024, 1);
        }).hasRootCauseInstanceOf(IllegalArgumentException.class)
                .hasRootCauseMessage("客户导入传输地址不受信任");
    }

    @Test
    void rejectsATrustedHostWhenTheRpcAdvertisesTheWrongServicePath(@TempDir Path root) {
        CustomerImportTransferClient client = new CustomerImportTransferClient(
                "http://127.0.0.1:7020/shopify-marketing");
        Path file = root.resolve("customers.csv");

        assertThatThrownBy(() -> {
            var method = java.util.Arrays.stream(CustomerImportTransferClient.class.getMethods())
                    .filter(candidate -> candidate.getName().equals("upload")
                            && candidate.getParameterCount() == 7)
                    .findFirst().orElseThrow();
            method.invoke(client, file, "server-12", "http://10.0.0.12:7020/not-shopify",
                    "upload-1", "token-1", 1024, 1);
        }).hasRootCauseInstanceOf(IllegalArgumentException.class)
                .hasRootCauseMessage("客户导入传输地址不受信任");
    }

    @Test
    void downloadsCampaignRecipientExportsThroughTheDedicatedTokenHeader() throws Exception {
        AtomicInteger received = new AtomicInteger();
        HttpServer server = HttpServer.create(
                new InetSocketAddress(InetAddress.getLoopbackAddress(), 0), 0);
        server.createContext("/shopify-marketing/internal/campaign-recipient-exports/job-1",
                exchange -> {
                    if ("token-1".equals(exchange.getRequestHeaders()
                            .getFirst("X-Campaign-Export-Token"))) received.incrementAndGet();
                    byte[] body = "xlsx".getBytes(java.nio.charset.StandardCharsets.UTF_8);
                    exchange.sendResponseHeaders(200, body.length);
                    exchange.getResponseBody().write(body); exchange.close();
                });
        server.start();
        try {
            CustomerImportTransferClient client = new CustomerImportTransferClient(
                    "http://127.0.0.1:" + server.getAddress().getPort() + "/shopify-marketing");
            var method = java.util.Arrays.stream(CustomerImportTransferClient.class.getMethods())
                    .filter(candidate -> candidate.getName().equals("downloadCampaignExport")
                            && candidate.getParameterCount() == 2)
                    .findFirst().orElse(null);

            assertThat(method).isNotNull();
            @SuppressWarnings("unchecked")
            java.net.http.HttpResponse<java.io.InputStream> response =
                    (java.net.http.HttpResponse<java.io.InputStream>) method.invoke(
                            client, "job-1", "token-1");
            try (var input = response.body()) {
                assertThat(new String(input.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8))
                        .isEqualTo("xlsx");
            }
            assertThat(received).hasValue(1);
        } finally {
            server.stop(0);
        }
    }
}
