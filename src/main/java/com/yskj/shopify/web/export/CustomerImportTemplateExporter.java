package com.yskj.shopify.web.export;

import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.function.Consumer;

@Component
public class CustomerImportTemplateExporter {
    public record CustomerRow(String firstName, String lastName, String email) {}

    public byte[] export() {
        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            customerSheet(workbook);
            workbook.write(output);
            return output.toByteArray();
        } catch (IOException failure) {
            throw new IllegalStateException("无法生成客户导入模板", failure);
        }
    }

    public void writeCustomers(OutputStream output, Consumer<Consumer<CustomerRow>> readRows)
            throws IOException {
        try (var workbook = new SXSSFWorkbook(100)) {
            workbook.setCompressTempFiles(true);
            try {
                var sheet = customerSheet(workbook);
                int[] nextRow = {1};
                readRows.accept(customer -> {
                    if (nextRow[0] >= org.apache.poi.ss.SpreadsheetVersion.EXCEL2007.getMaxRows()) {
                        throw new IllegalArgumentException("客户数量超过单个 Excel 文件的容量，请缩小筛选范围");
                    }
                    var row = sheet.createRow(nextRow[0]++);
                    row.createCell(0).setCellValue(customer.firstName());
                    row.createCell(1).setCellValue(customer.lastName());
                    row.createCell(2).setCellValue(customer.email());
                });
                workbook.write(output);
            } finally {
                workbook.dispose();
            }
        }
    }

    private Sheet customerSheet(Workbook workbook) {
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
            return sheet;
    }
}
