package com.yskj.shopify.web.upload;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.UUID;

@Component
public class SharedCustomerImportStore {

    private static final DateTimeFormatter MONTH = DateTimeFormatter.ofPattern("yyyy/MM");

    private final Path root;
    private final long maxBytes;

    public SharedCustomerImportStore(
            @Value("${shopify.web.customer-import.temp-directory:${java.io.tmpdir}/shopify-marketing-web-imports}")
            String root,
            @Value("${shopify.web.customer-import.max-bytes:67108864}") long maxBytes) {
        this.root = Path.of(root).toAbsolutePath().normalize();
        if (maxBytes < 1) throw new IllegalArgumentException("maxBytes must be positive");
        this.maxBytes = maxBytes;
    }

    public String save(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("导入文件不能为空");
        if (file.getSize() > maxBytes) throw new IllegalArgumentException("导入文件过大");
        String filename = file.getOriginalFilename() == null
                ? "" : file.getOriginalFilename().trim().toLowerCase(Locale.ROOT);
        String extension;
        if (filename.endsWith(".csv")) extension = ".csv";
        else if (filename.endsWith(".xlsx")) extension = ".xlsx";
        else throw new IllegalArgumentException("仅支持 CSV 或 XLSX 文件");

        String relative = LocalDate.now().format(MONTH) + "/"
                + UUID.randomUUID().toString().replace("-", "") + extension;
        Path destination = root.resolve(relative).normalize();
        if (!destination.startsWith(root)) throw new IllegalArgumentException("本地导入临时路径无效");
        Files.createDirectories(destination.getParent());
        try (var input = file.getInputStream()) {
            Files.copy(input, destination, StandardCopyOption.REPLACE_EXISTING);
        }
        return relative.replace('\\', '/');
    }

    public Path resolve(String reference) {
        Path value = root.resolve(reference == null ? "" : reference).normalize();
        if (!value.startsWith(root)) throw new IllegalArgumentException("本地导入临时路径无效");
        return value;
    }

    public String sha256(String reference) throws IOException {
        try {
            var digest = java.security.MessageDigest.getInstance("SHA-256");
            try (var input = Files.newInputStream(resolve(reference))) {
                byte[] buffer = new byte[64 * 1024]; int read;
                while ((read = input.read(buffer)) >= 0) if (read > 0) digest.update(buffer, 0, read);
            }
            return java.util.HexFormat.of().formatHex(digest.digest());
        } catch (java.security.NoSuchAlgorithmException impossible) {
            throw new IllegalStateException(impossible);
        }
    }

    public void delete(String reference) throws IOException { Files.deleteIfExists(resolve(reference)); }
}
