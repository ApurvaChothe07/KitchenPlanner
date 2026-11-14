package com.kitchencraft.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request payload comparing two distinct finish packages side-by-side")
public class EstimateComparisonRequest {

    @NotNull(message = "Option A configuration is required")
    @Valid
    @Schema(description = "Baseline package specifications (Option A)")
    private EstimateRequest optionA;

    @NotNull(message = "Option B configuration is required")
    @Valid
    @Schema(description = "Alternative package specifications (Option B)")
    private EstimateRequest optionB;
}
