package com.kitchencraft.dto.request;

import com.kitchencraft.entity.MaterialCategory;
import com.kitchencraft.entity.MaterialUnit;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request payload for adding or updating catalogue materials")
public class MaterialRequest {

    @NotBlank(message = "Material name is required")
    @Size(max = 150, message = "Material name must not exceed 150 characters")
    @Schema(description = "Unique specification or commercial name", example = "Marine Grade BWP Plywood (IS 710)")
    private String name;

    @NotNull(message = "Material category is required")
    @Schema(description = "Functional category of material", example = "CARCASS")
    private MaterialCategory category;

    @NotNull(message = "Material measurement unit is required")
    @Schema(description = "Measurement unit for pricing and quantity calculations", example = "SQFT")
    private MaterialUnit unit;

    @NotNull(message = "Unit price is required")
    @DecimalMin(value = "0.01", message = "Unit price must be greater than zero")
    @Schema(description = "Authorized unit price in INR", example = "190.00")
    private BigDecimal unitPrice;

    @Schema(description = "Technical details, brand, or grade specifications", example = "Boiling Water Proof marine ply calibrated with core-gap free construction")
    private String description;

    @Builder.Default
    @Schema(description = "Whether this material is currently active in customer estimation catalogue", example = "true")
    private Boolean active = true;
}
