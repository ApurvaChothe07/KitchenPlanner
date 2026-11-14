package com.kitchencraft.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Standardized error response payload across all REST endpoints")
public class ErrorResponse {

    @Builder.Default
    @Schema(description = "UTC timestamp when the error occurred", example = "2026-11-14T09:30:00Z")
    private Instant timestamp = Instant.now();

    @Schema(description = "HTTP status code", example = "400")
    private int status;

    @Schema(description = "Standard HTTP error reason phrase", example = "Bad Request")
    private String error;

    @Schema(description = "Detailed, human-readable error explanation", example = "Validation failed for input data")
    private String message;

    @Schema(description = "Endpoint URI where the failure originated", example = "/api/v1/projects")
    private String path;

    @Schema(description = "Field-level validation error mappings (present on 400 Bad Request)", example = "{\"roomWidthMm\": \"Room width must be at least 1500 mm\"}")
    private Map<String, String> validationErrors;
}
