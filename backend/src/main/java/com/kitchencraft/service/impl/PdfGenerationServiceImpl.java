package com.kitchencraft.service.impl;

import com.kitchencraft.entity.Quotation;
import com.kitchencraft.entity.QuotationItem;
import com.kitchencraft.service.PdfGenerationService;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Service
@Slf4j
public class PdfGenerationServiceImpl implements PdfGenerationService {

    // Brand Palette
    private static final Color COLOR_PRIMARY = new Color(15, 23, 42);       // Slate 900
    private static final Color COLOR_ACCENT = new Color(13, 148, 136);      // Teal 600
    private static final Color COLOR_HEADER_BG = new Color(30, 41, 59);     // Slate 800
    private static final Color COLOR_ALT_ROW = new Color(248, 250, 252);     // Slate 50
    private static final Color COLOR_BORDER = new Color(226, 232, 240);      // Slate 200
    private static final Color COLOR_TEXT_MUTED = new Color(100, 116, 139); // Slate 500
    private static final Color COLOR_TOTAL_BG = new Color(240, 253, 244);    // Emerald 50

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMM yyyy");
    private static final DecimalFormat CURRENCY_FMT = new DecimalFormat("#,##,##0.00");

    @Override
    public byte[] generateQuotationPdf(Quotation quotation) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter writer = PdfWriter.getInstance(document, baos);

            // Add Header/Footer Event for Page Numbers
            writer.setPageEvent(new QuotationFooterEvent());

            document.open();

            // 1. Company Brand & Document Title Banner
            addCompanyHeader(document, quotation);

            // 2. Client & Project Specification Details
            addProjectAndClientDetails(document, quotation);

            // 3. Itemized Bill of Materials & Charges Table
            addItemizedTable(document, quotation);

            // 4. Financial Summary (Subtotals, Wastage, Labor, Install, Discount, Tax, Grand Total)
            addFinancialSummary(document, quotation);

            // 5. Notes & Terms & Conditions
            addTermsAndConditions(document, quotation);

            // 6. Signature Acceptance Block
            addSignatureBlock(document);

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate PDF for quotation [{}]: {}", quotation.getQuotationNumber(), e.getMessage(), e);
            throw new RuntimeException("Could not generate quotation PDF: " + e.getMessage(), e);
        }
    }

    private void addCompanyHeader(Document document, Quotation quotation) throws DocumentException {
        PdfPTable headerTable = new PdfPTable(2);
        headerTable.setWidthPercentage(100);
        headerTable.setWidths(new float[]{60f, 40f});
        headerTable.setSpacingAfter(15f);

        // Left: Company Branding
        PdfPCell leftCell = new PdfPCell();
        leftCell.setBorder(Rectangle.NO_BORDER);

        Font brandFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, COLOR_PRIMARY);
        Paragraph brand = new Paragraph("KITCHENCRAFT", brandFont);
        brand.setSpacingAfter(2f);
        leftCell.addElement(brand);

        Font tagFont = FontFactory.getFont(FontFactory.HELVETICA, 9, COLOR_ACCENT);
        Paragraph tagline = new Paragraph("MODULAR KITCHEN & INTERIOR SOLUTIONS", tagFont);
        tagline.setSpacingAfter(4f);
        leftCell.addElement(tagline);

        Font metaFont = FontFactory.getFont(FontFactory.HELVETICA, 8, COLOR_TEXT_MUTED);
        leftCell.addElement(new Paragraph("Reg / GSTIN: 27AABCK1234F1Z8", metaFont));
        leftCell.addElement(new Paragraph("Web: https://kitchencraft.example.com | Email: quotes@kitchencraft.com", metaFont));
        leftCell.addElement(new Paragraph("Corporate Studio: High-Tech Park, Sector 5, Bangalore - 560100", metaFont));
        headerTable.addCell(leftCell);

        // Right: Quotation Metadata Badge
        PdfPCell rightCell = new PdfPCell();
        rightCell.setBorder(Rectangle.NO_BORDER);
        rightCell.setHorizontalAlignment(Element.ALIGN_RIGHT);

        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, COLOR_HEADER_BG);
        Paragraph title = new Paragraph("QUOTATION", titleFont);
        title.setAlignment(Element.ALIGN_RIGHT);
        rightCell.addElement(title);

        Font quoteNumFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, COLOR_ACCENT);
        Paragraph numPara = new Paragraph(quotation.getQuotationNumber(), quoteNumFont);
        numPara.setAlignment(Element.ALIGN_RIGHT);
        numPara.setSpacingAfter(4f);
        rightCell.addElement(numPara);

        String createdDate = quotation.getCreatedAt() != null
                ? quotation.getCreatedAt().atZone(ZoneId.systemDefault()).format(DATE_FMT)
                : "N/A";
        String validDate = quotation.getValidUntil() != null
                ? quotation.getValidUntil().format(DATE_FMT)
                : "30 Days from issue";

        Font dateFont = FontFactory.getFont(FontFactory.HELVETICA, 8, COLOR_TEXT_MUTED);
        Paragraph pDate = new Paragraph("Date: " + createdDate, dateFont);
        pDate.setAlignment(Element.ALIGN_RIGHT);
        rightCell.addElement(pDate);

        Paragraph pValid = new Paragraph("Valid Until: " + validDate, dateFont);
        pValid.setAlignment(Element.ALIGN_RIGHT);
        rightCell.addElement(pValid);

        Font statusFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9,
                quotation.getStatus().name().equals("ISSUED") ? new Color(16, 185, 129) :
                quotation.getStatus().name().equals("CANCELLED") ? new Color(239, 68, 68) : new Color(245, 158, 11));
        Paragraph pStatus = new Paragraph("Status: " + quotation.getStatus().name(), statusFont);
        pStatus.setAlignment(Element.ALIGN_RIGHT);
        rightCell.addElement(pStatus);

        headerTable.addCell(rightCell);
        document.add(headerTable);
    }

    private void addProjectAndClientDetails(Document document, Quotation quotation) throws DocumentException {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{50f, 50f});
        table.setSpacingAfter(15f);

        // Left Box: Client / Project Site
        PdfPCell clientCell = new PdfPCell();
        clientCell.setBackgroundColor(COLOR_ALT_ROW);
        clientCell.setBorderColor(COLOR_BORDER);
        clientCell.setPadding(8f);

        Font sectionHeaderFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, COLOR_HEADER_BG);
        Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, COLOR_TEXT_MUTED);
        Font valFont = FontFactory.getFont(FontFactory.HELVETICA, 8, COLOR_PRIMARY);

        clientCell.addElement(new Paragraph("PREPARED FOR (CLIENT):", sectionHeaderFont));
        clientCell.addElement(new Paragraph("Client Name: " + safeStr(quotation.getClientName(), "Valued Customer"), valFont));
        clientCell.addElement(new Paragraph("Project: " + safeStr(quotation.getProject() != null ? quotation.getProject().getName() : null, "Kitchen Project"), valFont));
        if (quotation.getClientEmail() != null && !quotation.getClientEmail().isBlank()) {
            clientCell.addElement(new Paragraph("Email: " + quotation.getClientEmail(), valFont));
        }
        if (quotation.getClientPhone() != null && !quotation.getClientPhone().isBlank()) {
            clientCell.addElement(new Paragraph("Phone: " + quotation.getClientPhone(), valFont));
        }
        table.addCell(clientCell);

        // Right Box: Design & Material Specifications
        PdfPCell designCell = new PdfPCell();
        designCell.setBackgroundColor(COLOR_ALT_ROW);
        designCell.setBorderColor(COLOR_BORDER);
        designCell.setPadding(8f);

        designCell.addElement(new Paragraph("DESIGN SPECIFICATIONS:", sectionHeaderFont));
        String designName = quotation.getDesign() != null ? quotation.getDesign().getName() : "Initial Layout";
        int designVer = quotation.getDesign() != null ? quotation.getDesign().getVersion() : 1;
        designCell.addElement(new Paragraph("Design Version: " + designName + " (v" + designVer + ")", valFont));

        if (quotation.getDesign() != null) {
            String dims = String.format("%d mm (W) x %d mm (L) x %d mm (H)",
                    quotation.getDesign().getRoomWidthMm(),
                    quotation.getDesign().getRoomLengthMm(),
                    quotation.getDesign().getRoomHeightMm());
            designCell.addElement(new Paragraph("Room Dimensions: " + dims, valFont));
        }

        designCell.addElement(new Paragraph("Carcass Core: " + safeStr(quotation.getCarcassMaterialSnapshot(), "Standard Core"), valFont));
        designCell.addElement(new Paragraph("Shutter Finish: " + safeStr(quotation.getShutterMaterialSnapshot(), "Standard Finish"), valFont));
        designCell.addElement(new Paragraph("Countertop: " + safeStr(quotation.getCountertopMaterialSnapshot(), "Standard Slab"), valFont));

        table.addCell(designCell);
        document.add(table);
    }

    private void addItemizedTable(Document document, Quotation quotation) throws DocumentException {
        PdfPTable table = new PdfPTable(6);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{6f, 38f, 16f, 14f, 13f, 13f});
        table.setSpacingAfter(10f);

        // Table Header
        String[] headers = {"#", "Description", "Category", "Quantity", "Rate (INR)", "Total (INR)"};
        Font headFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, Color.WHITE);

        for (String title : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(title, headFont));
            cell.setBackgroundColor(COLOR_HEADER_BG);
            cell.setPadding(6f);
            cell.setBorderColor(COLOR_HEADER_BG);
            if (title.contains("(INR)") || title.equals("Quantity")) {
                cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            } else if (title.equals("#")) {
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            } else {
                cell.setHorizontalAlignment(Element.ALIGN_LEFT);
            }
            table.addCell(cell);
        }

        // Table Rows
        Font itemFont = FontFactory.getFont(FontFactory.HELVETICA, 8, COLOR_PRIMARY);
        Font notesFont = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 7, COLOR_TEXT_MUTED);
        int index = 1;

        if (quotation.getItems() != null && !quotation.getItems().isEmpty()) {
            for (QuotationItem item : quotation.getItems()) {
                Color rowBg = (index % 2 == 0) ? COLOR_ALT_ROW : Color.WHITE;

                // 1. Index
                PdfPCell cIdx = new PdfPCell(new Phrase(String.valueOf(index++), itemFont));
                cIdx.setHorizontalAlignment(Element.ALIGN_CENTER);
                styleCell(cIdx, rowBg);
                table.addCell(cIdx);

                // 2. Description + calculation notes
                PdfPCell cDesc = new PdfPCell();
                cDesc.addElement(new Paragraph(item.getItemDescription(), itemFont));
                if (item.getCalculationNotes() != null && !item.getCalculationNotes().isBlank()) {
                    cDesc.addElement(new Paragraph(item.getCalculationNotes(), notesFont));
                }
                styleCell(cDesc, rowBg);
                table.addCell(cDesc);

                // 3. Category
                PdfPCell cCat = new PdfPCell(new Phrase(item.getCategory(), itemFont));
                styleCell(cCat, rowBg);
                table.addCell(cCat);

                // 4. Quantity + Unit
                String qtyStr = String.format("%s %s", item.getQuantity().stripTrailingZeros().toPlainString(), item.getUnit());
                PdfPCell cQty = new PdfPCell(new Phrase(qtyStr, itemFont));
                cQty.setHorizontalAlignment(Element.ALIGN_RIGHT);
                styleCell(cQty, rowBg);
                table.addCell(cQty);

                // 5. Unit Price
                PdfPCell cRate = new PdfPCell(new Phrase(formatMoney(item.getUnitPrice()), itemFont));
                cRate.setHorizontalAlignment(Element.ALIGN_RIGHT);
                styleCell(cRate, rowBg);
                table.addCell(cRate);

                // 6. Line Total
                PdfPCell cTot = new PdfPCell(new Phrase(formatMoney(item.getTotalPrice()), itemFont));
                cTot.setHorizontalAlignment(Element.ALIGN_RIGHT);
                styleCell(cTot, rowBg);
                table.addCell(cTot);
            }
        }

        document.add(table);
    }

    private void addFinancialSummary(Document document, Quotation quotation) throws DocumentException {
        PdfPTable summaryTable = new PdfPTable(2);
        summaryTable.setWidthPercentage(55);
        summaryTable.setHorizontalAlignment(Element.ALIGN_RIGHT);
        summaryTable.setWidths(new float[]{60f, 40f});
        summaryTable.setSpacingAfter(15f);

        Font labelFont = FontFactory.getFont(FontFactory.HELVETICA, 8, COLOR_PRIMARY);
        Font valFont = FontFactory.getFont(FontFactory.HELVETICA, 8, COLOR_PRIMARY);
        Font grandLabelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, COLOR_PRIMARY);
        Font grandValFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, COLOR_ACCENT);

        addSummaryRow(summaryTable, "Materials Subtotal:", formatMoney(quotation.getMaterialSubtotal()), labelFont, valFont, Color.WHITE);
        addSummaryRow(summaryTable, String.format("Wastage (%s%%):", quotation.getWastagePercentage()), formatMoney(quotation.getWastageAmount()), labelFont, valFont, Color.WHITE);
        addSummaryRow(summaryTable, String.format("Carpentry Labour (%s%%):", quotation.getLaborPercentage()), formatMoney(quotation.getLaborAmount()), labelFont, valFont, Color.WHITE);
        addSummaryRow(summaryTable, String.format("Site Installation (%s%%):", quotation.getInstallationPercentage()), formatMoney(quotation.getInstallationAmount()), labelFont, valFont, Color.WHITE);
        addSummaryRow(summaryTable, "Gross Subtotal:", formatMoney(quotation.getGrossSubtotal()), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, COLOR_PRIMARY), valFont, COLOR_ALT_ROW);

        if (quotation.getDiscountAmount() != null && quotation.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
            Font discountFont = FontFactory.getFont(FontFactory.HELVETICA, 8, new Color(16, 185, 129));
            addSummaryRow(summaryTable, String.format("Promotional Discount (%s%%):", quotation.getDiscountPercentage()), "- " + formatMoney(quotation.getDiscountAmount()), discountFont, discountFont, Color.WHITE);
        }

        addSummaryRow(summaryTable, "Net Taxable Amount:", formatMoney(quotation.getNetTaxableAmount()), labelFont, valFont, Color.WHITE);
        addSummaryRow(summaryTable, String.format("GST (%s%%):", quotation.getTaxPercentage()), formatMoney(quotation.getTaxAmount()), labelFont, valFont, Color.WHITE);

        // Final Grand Total Highlight Row
        PdfPCell cLabel = new PdfPCell(new Phrase("FINAL QUOTED TOTAL:", grandLabelFont));
        cLabel.setBackgroundColor(COLOR_TOTAL_BG);
        cLabel.setBorderColor(COLOR_BORDER);
        cLabel.setPadding(7f);
        summaryTable.addCell(cLabel);

        PdfPCell cVal = new PdfPCell(new Phrase("INR " + formatMoney(quotation.getFinalTotal()), grandValFont));
        cVal.setBackgroundColor(COLOR_TOTAL_BG);
        cVal.setBorderColor(COLOR_BORDER);
        cVal.setHorizontalAlignment(Element.ALIGN_RIGHT);
        cVal.setPadding(7f);
        summaryTable.addCell(cVal);

        document.add(summaryTable);
    }

    private void addTermsAndConditions(Document document, Quotation quotation) throws DocumentException {
        PdfPTable termsTable = new PdfPTable(1);
        termsTable.setWidthPercentage(100);
        termsTable.setSpacingAfter(15f);

        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(COLOR_ALT_ROW);
        cell.setBorderColor(COLOR_BORDER);
        cell.setPadding(8f);

        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, COLOR_HEADER_BG);
        Font textFont = FontFactory.getFont(FontFactory.HELVETICA, 7, COLOR_TEXT_MUTED);

        cell.addElement(new Paragraph("COMMERCIAL TERMS & INSTALLATION CONDITIONS:", headerFont));
        cell.addElement(new Paragraph("1. Payment Schedule: 50% advance on confirmation, 40% upon dispatch from factory, 10% after site installation.", textFont));
        cell.addElement(new Paragraph("2. Delivery & Execution: Standard factory manufacturing lead time is 21 working days following final site verification.", textFont));
        cell.addElement(new Paragraph("3. Scope: Electrical points, civil plumbing, and gas pipe routing must be ready as per KitchenCraft layout drawings prior to installation.", textFont));
        cell.addElement(new Paragraph("4. Price Stability: This quotation is binding for 30 days from issuance. Catalogue price fluctuations will not affect this confirmed snapshot.", textFont));

        if (quotation.getNotes() != null && !quotation.getNotes().isBlank()) {
            cell.addElement(new Paragraph("Special Remarks: " + quotation.getNotes(), FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 7, COLOR_PRIMARY)));
        }

        termsTable.addCell(cell);
        document.add(termsTable);
    }

    private void addSignatureBlock(Document document) throws DocumentException {
        PdfPTable sigTable = new PdfPTable(2);
        sigTable.setWidthPercentage(100);
        sigTable.setWidths(new float[]{50f, 50f});

        Font sigFont = FontFactory.getFont(FontFactory.HELVETICA, 8, COLOR_TEXT_MUTED);

        PdfPCell leftSig = new PdfPCell();
        leftSig.setBorder(Rectangle.NO_BORDER);
        leftSig.addElement(new Paragraph("____________________________________________", sigFont));
        leftSig.addElement(new Paragraph("For KitchenCraft Interior Solutions (Authorized Signatory)", sigFont));
        sigTable.addCell(leftSig);

        PdfPCell rightSig = new PdfPCell();
        rightSig.setBorder(Rectangle.NO_BORDER);
        rightSig.setHorizontalAlignment(Element.ALIGN_RIGHT);
        Paragraph rLine = new Paragraph("____________________________________________", sigFont);
        rLine.setAlignment(Element.ALIGN_RIGHT);
        rightSig.addElement(rLine);
        Paragraph rLabel = new Paragraph("Client Acceptance Signature & Date", sigFont);
        rLabel.setAlignment(Element.ALIGN_RIGHT);
        rightSig.addElement(rLabel);
        sigTable.addCell(rightSig);

        document.add(sigTable);
    }

    private void styleCell(PdfPCell cell, Color bg) {
        cell.setBackgroundColor(bg);
        cell.setBorderColor(COLOR_BORDER);
        cell.setPadding(5f);
    }

    private void addSummaryRow(PdfPTable table, String label, String value, Font lFont, Font vFont, Color bg) {
        PdfPCell cLabel = new PdfPCell(new Phrase(label, lFont));
        cLabel.setBackgroundColor(bg);
        cLabel.setBorderColor(COLOR_BORDER);
        cLabel.setPadding(4f);
        table.addCell(cLabel);

        PdfPCell cVal = new PdfPCell(new Phrase(value, vFont));
        cVal.setBackgroundColor(bg);
        cVal.setBorderColor(COLOR_BORDER);
        cVal.setHorizontalAlignment(Element.ALIGN_RIGHT);
        cVal.setPadding(4f);
        table.addCell(cVal);
    }

    private String safeStr(String str, String fallback) {
        return (str != null && !str.isBlank()) ? str : fallback;
    }

    private String formatMoney(BigDecimal amount) {
        if (amount == null) return "0.00";
        return CURRENCY_FMT.format(amount);
    }

    // Header/Footer Event for Page Numbers
    private static class QuotationFooterEvent extends PdfPageEventHelper {
        private final Font footerFont = FontFactory.getFont(FontFactory.HELVETICA, 7, new Color(148, 163, 184));

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            PdfContentByte cb = writer.getDirectContent();
            String footerText = String.format("Generated electronically by KitchenCraft Platform  •  Page %d", writer.getPageNumber());
            ColumnText.showTextAligned(cb, Element.ALIGN_CENTER, new Phrase(footerText, footerFont),
                    (document.right() - document.left()) / 2 + document.leftMargin(),
                    document.bottom() - 15, 0);
        }
    }
}
