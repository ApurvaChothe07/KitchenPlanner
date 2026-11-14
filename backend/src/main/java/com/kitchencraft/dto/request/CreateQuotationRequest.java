package com.kitchencraft.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateQuotationRequest {

    @Valid
    @Schema(description = "Optional custom estimate specifications; if omitted, defaults to current design estimate")
    private EstimateRequest estimateRequest;

    @Size(max = 150, message = "Client name must not exceed 150 characters")
    @Schema(description = "Client full name snapshot (defaults to project client if blank)", example = "Aarav Mehta")
    private String clientName;

    @Size(max = 150, message = "Client email must not exceed 150 characters")
    @Schema(description = "Client email address", example = "aarav.mehta@example.com")
    private String clientEmail;

    @Size(max = 50, message = "Client phone must not exceed 50 characters")
    @Schema(description = "Client contact number", example = "+91 98765 43210")
    private String clientPhone;

    @Size(max = 2000, message = "Notes must not exceed 2000 characters")
    @Schema(description = "Commercial remarks, terms, or customer special notes", example = "Includes 5-year warranty on soft-close hinges. Site installation scheduled for Week 3.")
    private String notes;

    @Min(value = 1, message = "Validity must be at least 1 day")
    @Max(value = 365, message = "Validity cannot exceed 365 days")
    @Builder.Default
    @Schema(description = "Validity duration in days from creation", example = "30")
    private Integer validDays = 30;

    @Builder.Default
    @Schema(description = "Whether to immediately issue this quotation (status ISSUED) rather than keeping it as DRAFT", example = "false")
    private Boolean issueImmediately = false;
}
