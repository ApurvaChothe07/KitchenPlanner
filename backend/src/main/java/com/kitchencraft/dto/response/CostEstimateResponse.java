package com.kitchencraft.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CostEstimateResponse {
    private Long designId;
    private String designName;
    private int version;
    private int totalCabinetCount;

    // Direct Materials Breakdown
    private BigDecimal carcassSubtotal;
    private BigDecimal shutterSubtotal;
    private BigDecimal countertopSubtotal;
    private BigDecimal hardwareSubtotal;
    private BigDecimal materialTotal;

    // Wastage Allowance
    private BigDecimal wastagePercentage;
    private BigDecimal wastageAmount;

    // Labor & Assembly
    private BigDecimal laborPercentage;
    private BigDecimal laborAmount;

    // Site Installation
    private BigDecimal installationPercentage;
    private BigDecimal installationAmount;

    // Gross Subtotal (Materials + Wastage + Labor + Installation)
    private BigDecimal grossSubtotal;

    // Discounts
    private BigDecimal discountPercentage;
    private BigDecimal discountAmount;

    // Net Taxable Amount
    private BigDecimal netTaxableAmount;

    // Taxes (GST)
    private BigDecimal taxPercentage;
    private BigDecimal taxAmount;

    // Final Grand Total
    private BigDecimal grandTotal;

    // Itemized Line Items & Assumptions
    private List<ItemizedCostResponse> lineItems;
    private List<String> quantityAssumptions;
}
