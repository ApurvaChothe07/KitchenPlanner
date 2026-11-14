package com.kitchencraft.dto.request;

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
public class EstimateRequest {

    // Optional Material Catalog Overrides
    private Long carcassMaterialId;
    private Long shutterMaterialId;
    private Long countertopMaterialId;

    // Configurable Pricing Parameters (with robust industry defaults)
    @Builder.Default
    @DecimalMin(value = "0.0", message = "Wastage percentage cannot be negative")
    @DecimalMax(value = "50.0", message = "Wastage percentage cannot exceed 50%")
    private BigDecimal wastagePercentage = new BigDecimal("10.0");

    @Builder.Default
    @DecimalMin(value = "0.0", message = "Labor percentage cannot be negative")
    @DecimalMax(value = "50.0", message = "Labor percentage cannot exceed 50%")
    private BigDecimal laborPercentage = new BigDecimal("15.0");

    @Builder.Default
    @DecimalMin(value = "0.0", message = "Installation percentage cannot be negative")
    @DecimalMax(value = "30.0", message = "Installation percentage cannot exceed 30%")
    private BigDecimal installationPercentage = new BigDecimal("5.0");

    @Builder.Default
    @DecimalMin(value = "0.0", message = "Discount percentage cannot be negative")
    @DecimalMax(value = "100.0", message = "Discount percentage cannot exceed 100%")
    private BigDecimal discountPercentage = BigDecimal.ZERO;

    @Builder.Default
    @DecimalMin(value = "0.0", message = "Tax percentage cannot be negative")
    @DecimalMax(value = "50.0", message = "Tax percentage cannot exceed 50%")
    private BigDecimal taxPercentage = new BigDecimal("18.0"); // 18% GST standard in India
}
