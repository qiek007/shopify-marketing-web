package com.yskj.shopify.web.export;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class WebExcelExporterTest {

    @Test
    void customerTemplateContainsTheDocumentedColumns() throws Exception {
        byte[] content = new CustomerImportTemplateExporter().export();

        try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(content))) {
            var row = workbook.getSheet("customers").getRow(0);
            assertThat(List.of(row.getCell(0).getStringCellValue(),
                    row.getCell(1).getStringCellValue(), row.getCell(2).getStringCellValue()))
                    .containsExactly("firstName", "lastName", "email");
        }
    }

    @Test
    void trendExporterUsesRemoteJsonWithoutBusinessModelDependencies() throws Exception {
        JSONObject trend = new JSONObject(true);
        trend.putAll(Map.of(
                "shopDomain", "demo.myshopify.com", "timeZone", "Asia/Shanghai",
                "shopifyCurrency", "USD", "ga4Currency", "USD"));
        JSONArray days = new JSONArray();
        days.add(new JSONObject(Map.of(
                "date", "2026-09-30", "emailSentCount", 5,
                "shopifyOrderCount", 2, "shopifyOrderAmount", "20.50",
                "ga4PurchaseRevenue", "18.00")));
        trend.put("days", days);

        byte[] content = new RemoteTrendExcelExporter().export(trend);

        try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(content))) {
            assertThat(workbook.getSheet("每日趋势").getRow(1).getCell(1).getStringCellValue())
                    .isEqualTo("demo.myshopify.com");
            assertThat(workbook.getSheet("每日趋势").getRow(7).getCell(1).getNumericCellValue())
                    .isEqualTo(5);
        }
    }
}
