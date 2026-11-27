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
            String period = trend.getString("period");
            String grain = trend.getString("granularity");
            boolean hourly = "hour".equals(grain) || "day".equals(period);
            boolean monthly = "month".equals(grain) || "year".equals(period);
            boolean yearly = "year".equals(grain);
            var sheet = workbook.createSheet(hourly ? "小时趋势" : monthly ? "月度趋势" : yearly ? "年度趋势" : "每日趋势");
            var title = sheet.createRow(0);
            title.createCell(0).setCellValue(period == null ? "近 30 天营销趋势"
                    : "店铺趋势 " + text(trend, "fromDate") + " 至 " + text(trend, "toDate"));
            var shop = sheet.createRow(1);
            shop.createCell(0).setCellValue("店铺");
            shop.createCell(1).setCellValue(text(trend, "shopDomain"));
            var zone = sheet.createRow(2);
            zone.createCell(0).setCellValue("统计时区");
            zone.createCell(1).setCellValue(text(trend, "timeZone"));
            if (trend.getBooleanValue("incomplete")) {
                sheet.createRow(3).createCell(0).setCellValue("部分历史数据待汇总");
            }
            if ("day".equals(period) && trend.getBooleanValue("ga4Connected")) {
                var ga4 = sheet.createRow(4);
                ga4.createCell(0).setCellValue("GA4 当天收入");
                numeric(ga4.createCell(1), trend.getString("dayGa4Revenue"));
                ga4.createCell(2).setCellValue(text(trend, "ga4Currency"));
            }

            String[] headers = {"日期", "邮件发送数", "Shopify 订单数",
                    "Shopify 订单金额", "GA4 邮件购买收入", "邮件送达数", "邮件打开人数", "邮件点击人数", "邮件退订数"};
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
                    String date = text(day, "date");
                    row.createCell(0).setCellValue(hourly ? date + " " + text(day, "label")
                            : monthly && date.length() >= 7 ? date.substring(0, 7)
                            : yearly ? text(day, "label") : date);
                    numeric(row.createCell(1), day.getString("emailSentCount"));
                    numeric(row.createCell(2), day.getString("shopifyOrderCount"));
                    numeric(row.createCell(3), day.getString("shopifyOrderAmount"));
                    numeric(row.createCell(4), day.getString("ga4PurchaseRevenue"));
                    numeric(row.createCell(5), day.getString("emailDeliveredCount"));
                    numeric(row.createCell(6), day.getString("emailOpenedCount"));
                    numeric(row.createCell(7), day.getString("emailClickedCount"));
                    numeric(row.createCell(8), day.getString("emailUnsubscribedCount"));
                }
            }
            for (int index = 0; index < headers.length; index++) {
                sheet.setColumnWidth(index, index == 0 && !"day".equals(period) ? 14 * 256 : 24 * 256);
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
