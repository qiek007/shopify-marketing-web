package com.yskj.shopify.web.export;

import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Component
public class CustomerImportTemplateExporter {

    public byte[] export() {
        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            var sheet = workbook.createSheet("customers");
            sheet.createFreezePane(0, 1);
            var style = workbook.createCellStyle();
            var font = workbook.createFont();
            font.setBold(true);
            font.setColor(IndexedColors.WHITE.getIndex());
            style.setFont(font);
            style.setFillForegroundColor(IndexedColors.DARK_GREEN.getIndex());
            style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            String[] headers = {"firstName", "lastName", "email"};
            var row = sheet.createRow(0);
            for (int index = 0; index < headers.length; index++) {
                var cell = row.createCell(index);
                cell.setCellValue(headers[index]);
                cell.setCellStyle(style);
                sheet.setColumnWidth(index, index == 2 ? 34 * 256 : 20 * 256);
            }
            workbook.write(output);
            return output.toByteArray();
        } catch (IOException failure) {
            throw new IllegalStateException("无法生成客户导入模板", failure);
        }
    }
}
