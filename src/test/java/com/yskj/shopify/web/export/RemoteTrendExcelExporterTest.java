package com.yskj.shopify.web.export;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;

import static org.assertj.core.api.Assertions.assertThat;

class RemoteTrendExcelExporterTest {
    @Test
    void exportsTheSameEngagementColumnsAndPreservesUnknownValuesAsBlank() throws Exception {
        JSONObject known = new JSONObject();
        known.put("date", "2026-10-24");
        known.put("emailSentCount", 11);
        known.put("emailDeliveredCount", 9);
        known.put("emailOpenedCount", 5);
        known.put("emailClickedCount", 3);
        known.put("emailUnsubscribedCount", 1);
        JSONObject unknown = new JSONObject();
        unknown.put("date", "2026-10-23");
        JSONArray days = new JSONArray();
        days.add(known);days.add(unknown);
        JSONObject trend = new JSONObject();
        trend.put("days",days);
        try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(
                new RemoteTrendExcelExporter().export(trend)))) {
            var sheet = workbook.getSheetAt(0);
            assertThat(sheet.getRow(6).getCell(5).getStringCellValue()).isEqualTo("邮件送达数");
            assertThat(sheet.getRow(6).getCell(8).getStringCellValue()).isEqualTo("邮件退订数");
            for (int column=5;column<=8;column++) {
                assertThat(sheet.getRow(7).getCell(column).getNumericCellValue())
                        .isEqualTo(new double[]{9,5,3,1}[column-5]);
                assertThat(sheet.getRow(8).getCell(column).getCellType()).isEqualTo(CellType.BLANK);
            }
        }
    }
}
