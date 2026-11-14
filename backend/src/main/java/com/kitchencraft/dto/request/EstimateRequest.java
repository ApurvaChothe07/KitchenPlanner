package com.kitchencraft.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request parameters and material overrides for cost estimation")
public class EstimateRequest {

    @Schema(description = "Optional ID of custom carcass material from catalogue", example = "1")
    private Long carcassMaterialId;

    @Schema(description = "Optional ID of custom shutter material from catalogue", example = "2")
    private Long shutterMaterialId;

    @Schema(description = "Optional ID of custom countertop material from catalogue", example = "3")
    private Long countertopMaterialId;

    @Builder.Default
    @DecimalMin(value = "0.0", message = "Wastage percentage cannot be negative")
    @DecimalMax(value = "50.0", message = "Wastage percentage cannot exceed 50%")
    @Schema(description = "Cutting kerf and trimming wastage allowance (%)", example = "10.0")
    private BigDecimal wastagePercentage = new BigDecimal("10.0");

    @Builder.Default
    @DecimalMin(value = "0.0", message = "Labor percentage cannot be negative")
    @DecimalMax(value = "50.0", message = "Labor percentage cannot exceed 50%")
    @Schema(description = "Carpentry and factory assembly labor surcharge (%)", example = "15.0")
    private BigDecimal laborPercentage = new BigDecimal("15.0");

    @Builder.Default
    @DecimalMin(value = "0.0", message = "Installation percentage cannot be negative")
    @DecimalMax(value = "30.0", message = "Installation percentage cannot exceed 30%")
    @Schema(description = "Site installation, fitting, and transport allowance (%)", example = "5.0")
    private BigDecimal installationPercentage = new BigDecimal("5.0");

    @Builder.Default
    @DecimalMin(value = "0.0", message = "Discount percentage cannot be negative")
    @DecimalMax(value = "100.0", message = "Discount percentage cannot exceed 100%")
    @Schema(description = "Commercial promotional discount percentage (%)", example = "0.0")
    private BigDecimal discountPercentage = BigDecimal.ZERO;

    @Builder.Default
    @DecimalMin(value = "0.0", message = "Tax percentage cannot be negative")
    @DecimalMax(value = "50.0", message = "Tax percentage cannot exceed 50%")
    @Schema(description = "Goods & Services Tax (GST) percentage (%)", example = "18.0")
    private BigDecimal taxPercentage = new BigDecimal("18.0");
}
