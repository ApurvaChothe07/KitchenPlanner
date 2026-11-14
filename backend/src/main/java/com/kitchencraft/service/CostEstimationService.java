package com.kitchencraft.service;

import com.kitchencraft.dto.request.EstimateComparisonRequest;
import com.kitchencraft.dto.request.EstimateRequest;
import com.kitchencraft.dto.response.CostEstimateResponse;
import com.kitchencraft.dto.response.EstimateComparisonResponse;

public interface CostEstimationService {

    CostEstimateResponse calculateEstimate(Long designId, EstimateRequest request, String userEmail);

    EstimateComparisonResponse compareEstimates(Long designId, EstimateComparisonRequest request, String userEmail);
}
