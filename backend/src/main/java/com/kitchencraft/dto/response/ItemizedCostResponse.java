package com.kitchencraft.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Itemized Bill of Materials line item")
public class ItemizedCostResponse {

    @Schema(description = "Component name and specifications", example = "Carcass Panels: HDHMR Board 18mm")
    private String itemDescription;

    @Schema(description = "Component category", example = "CARCASS")
    private String category;

    @Schema(description = "Calculated quantity in measurement units", example = "120.5000")
    private BigDecimal quantity;

    @Schema(description = "Measurement unit", example = "SQFT")
    private String unit;

    @Schema(description = "Authorized unit price from catalogue in INR", example = "155.00")
    private BigDecimal unitPrice;

    @Schema(description = "Total line item cost (quantity * unitPrice) in INR", example = "18677.50")
    private BigDecimal totalCost;

    @Schema(description = "Dimensional details and formula notes", example = "Box panels: 2*(D*H) + 3*(W*D) + (W*H)")
    private String calculationDetails;
}
