package com.kitchencraft.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
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
@Schema(description = "Deterministic Bill of Materials (BOM) cost estimate response")
public class CostEstimateResponse {

    @Schema(description = "Design identifier", example = "100")
    private Long designId;

    @Schema(description = "Design label or title", example = "Modern L-Shape Layout")
    private String designName;

    @Schema(description = "Design revision version", example = "1")
    private int version;

    @Schema(description = "Total number of cabinets present on the floor/wall layout", example = "7")
    private int totalCabinetCount;

    // Direct Materials Breakdown
    @Schema(description = "Total cost for all carcass core boxes (INR)", example = "18677.50")
    private BigDecimal carcassSubtotal;

    @Schema(description = "Total cost for all front shutter panels (INR)", example = "11752.00")
    private BigDecimal shutterSubtotal;

    @Schema(description = "Total cost for countertop slab with drip edge (INR)", example = "6160.00")
    private BigDecimal countertopSubtotal;

    @Schema(description = "Total cost for hinges, runner sets, handles, and appliances (INR)", example = "5800.00")
    private BigDecimal hardwareSubtotal;

    @Schema(description = "Direct materials subtotal (Carcass + Shutter + Countertop + Hardware)", example = "42389.50")
    private BigDecimal materialTotal;

    // Wastage Allowance
    @Schema(description = "Wastage factor percentage applied", example = "10.00")
    private BigDecimal wastagePercentage;

    @Schema(description = "Monetary wastage allowance amount (INR)", example = "4238.95")
    private BigDecimal wastageAmount;

    // Labor & Assembly
    @Schema(description = "Carpentry labor percentage applied", example = "15.00")
    private BigDecimal laborPercentage;

    @Schema(description = "Monetary carpentry labor amount (INR)", example = "6358.43")
    private BigDecimal laborAmount;

    // Site Installation
    @Schema(description = "Installation & handling percentage applied", example = "5.00")
    private BigDecimal installationPercentage;

    @Schema(description = "Monetary site installation amount (INR)", example = "2119.48")
    private BigDecimal installationAmount;

    // Gross Subtotal
    @Schema(description = "Gross subtotal before discounts (Materials + Wastage + Labor + Install)", example = "55106.36")
    private BigDecimal grossSubtotal;

    // Discounts
    @Schema(description = "Promotional discount percentage applied", example = "0.00")
    private BigDecimal discountPercentage;

    @Schema(description = "Monetary promotional discount deducted (INR)", example = "0.00")
    private BigDecimal discountAmount;

    // Net Taxable Amount
    @Schema(description = "Net taxable amount after subtracting discounts", example = "55106.36")
    private BigDecimal netTaxableAmount;

    // Taxes
    @Schema(description = "Goods & Services Tax (GST) percentage", example = "18.00")
    private BigDecimal taxPercentage;

    @Schema(description = "Total GST tax amount (INR)", example = "9919.14")
    private BigDecimal taxAmount;

    // Final Grand Total
    @Schema(description = "Final quoted grand total including GST (INR)", example = "65025.50")
    private BigDecimal grandTotal;

    // Itemized Line Items & Assumptions
    @Schema(description = "Itemized breakdown of all individual billable components")
    private List<ItemizedCostResponse> lineItems;

    @Schema(description = "Engineering rules and formulas applied for quantity derivation")
    private List<String> quantityAssumptions;
}
