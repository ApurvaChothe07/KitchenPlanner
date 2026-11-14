package com.kitchencraft.dto.request;

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
public class EstimateComparisonRequest {

    @NotNull(message = "Option A configuration is required")
    @Valid
    private EstimateRequest optionA;

    @NotNull(message = "Option B configuration is required")
    @Valid
    private EstimateRequest optionB;
}
