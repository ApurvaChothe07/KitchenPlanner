package com.kitchencraft.service;

import com.kitchencraft.dto.request.CreateQuotationRequest;
import com.kitchencraft.dto.request.UpdateQuotationStatusRequest;
import com.kitchencraft.dto.response.QuotationResponse;
import com.kitchencraft.dto.response.QuotationSummaryResponse;

import java.util.List;

public interface QuotationService {

    QuotationResponse createQuotation(Long designId, CreateQuotationRequest request, String userEmail);

    List<QuotationSummaryResponse> getQuotationsForProject(Long projectId, String userEmail);

    QuotationResponse getQuotationById(Long id, String userEmail);

    QuotationResponse updateQuotationStatus(Long id, UpdateQuotationStatusRequest request, String userEmail);

    byte[] generateQuotationPdf(Long id, String userEmail);
}
