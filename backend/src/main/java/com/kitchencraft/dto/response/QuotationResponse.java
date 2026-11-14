package com.kitchencraft.dto.response;

import com.kitchencraft.entity.QuotationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuotationResponse {

    private Long id;
    private String quotationNumber;
    private Long projectId;
    private String projectName;
    private Long designId;
    private String designName;
    private Integer version;
    private QuotationStatus status;

    private String clientName;
    private String clientEmail;
    private String clientPhone;

    private String carcassMaterialSnapshot;
    private String shutterMaterialSnapshot;
    private String countertopMaterialSnapshot;

    private BigDecimal materialSubtotal;
    private BigDecimal wastagePercentage;
    private BigDecimal wastageAmount;
    private BigDecimal laborPercentage;
    private BigDecimal laborAmount;
    private BigDecimal installationPercentage;
    private BigDecimal installationAmount;
    private BigDecimal grossSubtotal;
    private BigDecimal discountPercentage;
    private BigDecimal discountAmount;
    private BigDecimal netTaxableAmount;
    private BigDecimal taxPercentage;
    private BigDecimal taxAmount;
    private BigDecimal finalTotal;

    private LocalDate validUntil;
    private Instant issuedAt;
    private String notes;
    private List<QuotationItemResponse> items;
    private Instant createdAt;
    private Instant updatedAt;
}
