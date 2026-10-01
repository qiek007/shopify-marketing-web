package com.yskj.shopify.web.export;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Component
public class RemoteTrendExcelExporter {

    public byte[] export(JSONObject trend) {
        if (trend == null) throw new IllegalArgumentException("trend is required");
        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            var sheet = workbook.createSheet("每日趋势");
            var title = sheet.createRow(0);
            title.createCell(0).setCellValue("近 30 天营销趋势");
            var shop = sheet.createRow(1);
            shop.createCell(0).setCellValue("店铺");
            shop.createCell(1).setCellValue(text(trend, "shopDomain"));
            var zone = sheet.createRow(2);
            zone.createCell(0).setCellValue("统计时区");
            zone.createCell(1).setCellValue(text(trend, "timeZone"));

            String[] headers = {"日期", "邮件发送数", "Shopify 订单数",
                    "Shopify 订单金额", "GA4 邮件购买收入"};
            var header = sheet.createRow(6);
            var headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.DARK_GREEN.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            var font = workbook.createFont();
            font.setBold(true);
            font.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(font);
            for (int index = 0; index < headers.length; index++) {
                var cell = header.createCell(index);
                cell.setCellValue(headers[index]);
                cell.setCellStyle(headerStyle);
            }

            JSONArray days = trend.getJSONArray("days");
            if (days != null) {
                for (int index = 0; index < days.size(); index++) {
                    JSONObject day = days.getJSONObject(index);
                    var row = sheet.createRow(7 + index);
                    row.createCell(0).setCellValue(text(day, "date"));
                    row.createCell(1).setCellValue(day.getLongValue("emailSentCount"));
                    row.createCell(2).setCellValue(day.getLongValue("shopifyOrderCount"));
                    numeric(row.createCell(3), day.getString("shopifyOrderAmount"));
                    numeric(row.createCell(4), day.getString("ga4PurchaseRevenue"));
                }
            }
            for (int index = 0; index < headers.length; index++) {
                sheet.setColumnWidth(index, index == 0 ? 14 * 256 : 22 * 256);
            }
            sheet.createFreezePane(0, 7);
            workbook.write(output);
            return output.toByteArray();
        } catch (IOException failure) {
            throw new IllegalStateException("无法生成趋势 Excel 文件", failure);
        }
    }

    private void numeric(org.apache.poi.ss.usermodel.Cell cell, String value) {
        if (value == null || value.isBlank()) cell.setBlank();
        else cell.setCellValue(Double.parseDouble(value));
    }

    private String text(JSONObject source, String key) {
        String value = source.getString(key);
        return value == null ? "" : value;
    }
}
