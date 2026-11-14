package com.kitchencraft.dto.request;

import com.kitchencraft.entity.QuotationStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateQuotationStatusRequest {

    @NotNull(message = "Status cannot be null")
    @Schema(description = "Target status (DRAFT -> ISSUED or CANCELLED, ISSUED -> CANCELLED)", example = "ISSUED")
    private QuotationStatus status;
}
