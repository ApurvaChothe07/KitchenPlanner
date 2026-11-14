package com.kitchencraft.dto.request;

import com.kitchencraft.entity.MaterialCategory;
import com.kitchencraft.entity.MaterialUnit;
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
public class MaterialRequest {

    @NotBlank(message = "Material name is required")
    @Size(max = 150, message = "Material name must not exceed 150 characters")
    private String name;

    @NotNull(message = "Material category is required")
    private MaterialCategory category;

    @NotNull(message = "Material measurement unit is required")
    private MaterialUnit unit;

    @NotNull(message = "Unit price is required")
    @DecimalMin(value = "0.01", message = "Unit price must be greater than zero")
    private BigDecimal unitPrice;

    private String description;

    @Builder.Default
    private Boolean active = true;
}
