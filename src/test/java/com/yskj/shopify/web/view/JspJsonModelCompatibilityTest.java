package com.yskj.shopify.web.view;

import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

class JspJsonModelCompatibilityTest {

    @Test
    void remoteModelJspCopiesUsePropertiesInsteadOfBusinessObjectMethods() throws Exception {
        Path root = Path.of("src/main/resources/META-INF/resources/WEB-INF");
        String pages;
        try (var files = Files.walk(root)) {
            pages = files.filter(Files::isRegularFile)
                    .filter(path -> path.toString().endsWith(".jsp")
                            || path.toString().endsWith(".jspf"))
                    .map(path -> {
                        try { return Files.readString(path); }
                        catch (Exception failure) { throw new IllegalStateException(failure); }
                    })
                    .collect(Collectors.joining("\n"));
        }

        assertThat(pages).doesNotContain(
                ".hasPrevious()", ".hasNext()", ".totalPages()",
                "${item.toString()", ".hasProvider(");
    }
}
