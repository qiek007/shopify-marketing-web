package com.yskj.shopify.web.upload;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.Proxy;
import java.net.ProxySelector;
import java.net.SocketAddress;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class CustomerImportTransferClient {
    private static final String DEFAULT_ALLOWED_HOSTS =
            "localhost,127.0.0.1";
    private static final ProxySelector DIRECT_CONNECTION = new ProxySelector() {
        @Override
        public List<Proxy> select(URI uri) {
            return List.of(Proxy.NO_PROXY);
        }

        @Override
        public void connectFailed(URI uri, SocketAddress address, IOException failure) {
        }
    };

    private final URI backend;
    private final HttpClient directHttp;
    private final HttpClient systemHttp;
    private final Set<String> allowedBackendHosts;

    @Autowired
    public CustomerImportTransferClient(
            @Value("${shopify.web.customer-import.backend-base-url:http://127.0.0.1:7020/shopify-marketing}")
            String backendBaseUrl,
            @Value("${shopify.web.customer-import.allowed-backend-hosts:"
                    + DEFAULT_ALLOWED_HOSTS + "}") String allowedBackendHosts) {
        this(normalize(backendBaseUrl),
                HttpClient.newBuilder().proxy(DIRECT_CONNECTION)
                        .connectTimeout(Duration.ofSeconds(10)).build(),
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build(),
                parseAllowedHosts(allowedBackendHosts));
    }

    CustomerImportTransferClient(String backendBaseUrl) {
        this(normalize(backendBaseUrl),
                HttpClient.newBuilder().proxy(DIRECT_CONNECTION)
                        .connectTimeout(Duration.ofSeconds(10)).build(),
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build(),
                parseAllowedHosts(DEFAULT_ALLOWED_HOSTS));
    }

    CustomerImportTransferClient(URI backend, HttpClient http) {
        this(backend, http, http, parseAllowedHosts(DEFAULT_ALLOWED_HOSTS));
    }

    CustomerImportTransferClient(URI backend, HttpClient directHttp, HttpClient systemHttp,
                                 Set<String> allowedBackendHosts) {
        this.backend = backend;
        this.directHttp = directHttp;
        this.systemHttp = systemHttp;
        this.allowedBackendHosts = Set.copyOf(allowedBackendHosts);
    }

    public void upload(Path file, String uploadId, String token, int chunkSize, int chunkCount)
            throws IOException, InterruptedException {
        upload(file, "", "", uploadId, token, chunkSize, chunkCount);
    }

    public void upload(Path file, String serverId, String transferBaseUrl,
                       String uploadId, String token, int chunkSize, int chunkCount)
            throws IOException, InterruptedException {
        URI target = target(serverId, transferBaseUrl);
        try (InputStream input = Files.newInputStream(file)) {
            for (int index = 0; index < chunkCount; index++) {
                byte[] content = input.readNBytes(chunkSize);
                if (content.length == 0) throw new IOException("本地临时文件提前结束");
                HttpRequest request = HttpRequest.newBuilder(target.resolve(
                                target.getPath() + "/internal/customer-import/uploads/" + uploadId
                                        + "/chunks/" + index))
                        .timeout(Duration.ofMinutes(2)).header("Content-Type", "application/octet-stream")
                        .header("X-Import-Token", token).header("X-Chunk-SHA256", sha256(content))
                        .PUT(HttpRequest.BodyPublishers.ofByteArray(content)).build();
                HttpResponse<String> response = http(target).send(
                        request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() != 204)
                    throw new IOException("上传分片 " + index + " 失败: HTTP " + response.statusCode());
            }
            if (input.read() >= 0) throw new IOException("本地临时文件大于声明大小");
        }
    }

    public HttpResponse<InputStream> download(String jobId, String token)
            throws IOException, InterruptedException {
        return download("", "", jobId, token);
    }

    public HttpResponse<InputStream> download(String serverId, String transferBaseUrl,
                                               String jobId, String token)
            throws IOException, InterruptedException {
        URI target = target(serverId, transferBaseUrl);
        HttpRequest request = HttpRequest.newBuilder(target.resolve(
                        target.getPath() + "/internal/customer-import/results/" + jobId))
                .timeout(Duration.ofMinutes(5)).header("X-Import-Token", token).GET().build();
        HttpResponse<InputStream> response = http(target).send(
                request, HttpResponse.BodyHandlers.ofInputStream());
        if (response.statusCode() != 200) {
            response.body().close(); throw new IOException("下载导入结果失败: HTTP " + response.statusCode());
        }
        return response;
    }

    private URI target(String serverId, String transferBaseUrl) {
        if (transferBaseUrl == null || transferBaseUrl.isBlank()) return backend;
        if (serverId == null || serverId.isBlank()) {
            throw new IllegalArgumentException("客户导入传输实例标识不能为空");
        }
        URI candidate = normalize(transferBaseUrl);
        String scheme = candidate.getScheme() == null ? ""
                : candidate.getScheme().toLowerCase(Locale.ROOT);
        String host = candidate.getHost() == null ? ""
                : candidate.getHost().toLowerCase(Locale.ROOT);
        if (!("http".equals(scheme) || "https".equals(scheme))
                || candidate.getUserInfo() != null || candidate.getQuery() != null
                || candidate.getFragment() != null || !trustedHost(host)
                || !"/shopify-marketing".equals(candidate.getPath())) {
            throw new IllegalArgumentException("客户导入传输地址不受信任");
        }
        return candidate;
    }

    private boolean trustedHost(String host) {
        if (allowedBackendHosts.contains(host) || "localhost".equals(host)
                || "::1".equals(host) || host.startsWith("127.")
                || host.startsWith("10.") || host.startsWith("192.168.")) return true;
        if (!host.startsWith("172.")) return false;
        String[] parts = host.split("\\.");
        if (parts.length != 4) return false;
        try {
            int second = Integer.parseInt(parts[1]);
            return second >= 16 && second <= 31;
        } catch (NumberFormatException ignored) {
            return false;
        }
    }

    private HttpClient http(URI target) {
        return privateHost(target.getHost()) ? directHttp : systemHttp;
    }

    private boolean privateHost(String value) {
        String host = value == null ? "" : value.toLowerCase(Locale.ROOT);
        if ("localhost".equals(host) || "::1".equals(host)
                || host.startsWith("127.") || host.startsWith("10.")
                || host.startsWith("192.168.")) return true;
        if (!host.startsWith("172.")) return false;
        String[] parts = host.split("\\.");
        if (parts.length != 4) return false;
        try {
            int second = Integer.parseInt(parts[1]);
            return second >= 16 && second <= 31;
        } catch (NumberFormatException ignored) {
            return false;
        }
    }

    private static URI normalize(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("客户导入传输地址不能为空");
        }
        URI uri = URI.create(value.trim()).normalize();
        String normalized = uri.toString();
        return URI.create(normalized.endsWith("/")
                ? normalized.substring(0, normalized.length() - 1) : normalized);
    }

    private static Set<String> parseAllowedHosts(String value) {
        return java.util.Arrays.stream((value == null ? "" : value).split(","))
                .map(String::trim).filter(item -> !item.isEmpty())
                .map(item -> item.toLowerCase(Locale.ROOT))
                .collect(Collectors.toUnmodifiableSet());
    }

    private String sha256(byte[] value) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value)); }
        catch (Exception impossible) { throw new IllegalStateException(impossible); }
    }
}
