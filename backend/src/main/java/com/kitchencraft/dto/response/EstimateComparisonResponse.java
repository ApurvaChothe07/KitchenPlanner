package com.kitchencraft.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EstimateComparisonResponse {
    private CostEstimateResponse estimateA;
    private CostEstimateResponse estimateB;
    private BigDecimal totalDifference; // estimateB.grandTotal - estimateA.grandTotal
    private BigDecimal percentageDifference;
    private Map<String, BigDecimal> itemizedDifferences;
}
