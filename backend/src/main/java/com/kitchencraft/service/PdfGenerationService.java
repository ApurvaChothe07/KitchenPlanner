package com.kitchencraft.service;

import com.kitchencraft.entity.Quotation;

public interface PdfGenerationService {

    byte[] generateQuotationPdf(Quotation quotation);
}
