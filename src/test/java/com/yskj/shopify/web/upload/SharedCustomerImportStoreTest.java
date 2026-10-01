package com.yskj.shopify.web.upload;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SharedCustomerImportStoreTest {

    @TempDir
    Path root;

    @Test
    void stagesUnderTheConfiguredLocalRootUsingAnOpaqueReference() throws Exception {
        SharedCustomerImportStore store = new SharedCustomerImportStore(root.toString(), 1024);
        MockMultipartFile file = new MockMultipartFile(
                "file", "../../contacts.csv", "text/csv", "email\na@example.com".getBytes());

        String reference = store.save(file);

        Path saved = root.resolve(reference).normalize();
        assertThat(saved).startsWith(root.toAbsolutePath().normalize());
        assertThat(saved).isRegularFile();
        assertThat(reference).endsWith(".csv").doesNotContain("..");
        assertThat(Files.readString(saved)).contains("a@example.com");
        assertThat(store.sha256(reference)).hasSize(64);
        store.delete(reference);
        assertThat(saved).doesNotExist();
    }

    @Test
    void rejectsUnsupportedAndOversizedFilesBeforeWriting() {
        SharedCustomerImportStore store = new SharedCustomerImportStore(root.toString(), 4);

        assertThatThrownBy(() -> store.save(new MockMultipartFile(
                "file", "contacts.txt", "text/plain", new byte[]{1})))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("CSV 或 XLSX");
        assertThatThrownBy(() -> store.save(new MockMultipartFile(
                "file", "contacts.csv", "text/csv", new byte[]{1, 2, 3, 4, 5})))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("过大");
        assertThat(root).isEmptyDirectory();
    }
}
