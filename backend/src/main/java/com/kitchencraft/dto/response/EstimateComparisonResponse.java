package com.kitchencraft.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
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
@Schema(description = "Side-by-side comparison response between two package options")
public class EstimateComparisonResponse {

    @Schema(description = "Full estimate calculation for Option A (Baseline)")
    private CostEstimateResponse estimateA;

    @Schema(description = "Full estimate calculation for Option B (Alternative)")
    private CostEstimateResponse estimateB;

    @Schema(description = "Monetary price difference (Option B total - Option A total) in INR", example = "9200.00")
    private BigDecimal totalDifference;

    @Schema(description = "Percentage difference relative to Option A", example = "15.30")
    private BigDecimal percentageDifference;

    @Schema(description = "Category-by-category monetary variances (carcassDifference, shutterDifference, etc.)")
    private Map<String, BigDecimal> itemizedDifferences;
}
