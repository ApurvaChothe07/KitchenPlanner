package com.kitchencraft.dto.response;

import com.kitchencraft.entity.QuotationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuotationSummaryResponse {

    private Long id;
    private String quotationNumber;
    private Long projectId;
    private Long designId;
    private String designName;
    private Integer version;
    private QuotationStatus status;
    private String clientName;
    private BigDecimal materialSubtotal;
    private BigDecimal netTaxableAmount;
    private BigDecimal taxAmount;
    private BigDecimal finalTotal;
    private int itemCount;
    private LocalDate validUntil;
    private Instant issuedAt;
    private Instant createdAt;
}
