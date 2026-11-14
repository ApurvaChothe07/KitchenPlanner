package com.kitchencraft.controller;

import com.kitchencraft.dto.request.EstimateComparisonRequest;
import com.kitchencraft.dto.request.EstimateRequest;
import com.kitchencraft.dto.response.CostEstimateResponse;
import com.kitchencraft.dto.response.EstimateComparisonResponse;
import com.kitchencraft.service.CostEstimationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/designs")
@RequiredArgsConstructor
@Tag(name = "Cost Estimation", description = "Endpoints for computing deterministic BOM cost estimates and side-by-side material comparisons")
@SecurityRequirement(name = "Bearer Authentication")
public class EstimateController {

    private final CostEstimationService costEstimationService;

    @PostMapping("/{id}/estimate")
    @Operation(summary = "Calculate design cost estimate", description = "Calculates itemized BOM cost estimate for a design using verified backend rates and formulas")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Estimate computed successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request payload or percentages"),
            @ApiResponse(responseCode = "403", description = "Access denied: Design owned by another user"),
            @ApiResponse(responseCode = "404", description = "Design not found")
    })
    public ResponseEntity<CostEstimateResponse> calculateEstimate(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) EstimateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        EstimateRequest effectiveRequest = (request != null) ? request : new EstimateRequest();
        CostEstimateResponse response = costEstimationService.calculateEstimate(id, effectiveRequest, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/estimate/compare")
    @Operation(summary = "Compare two material options", description = "Calculates side-by-side estimates comparing Baseline Option A against Alternate Option B")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Comparison computed successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid comparison options"),
            @ApiResponse(responseCode = "403", description = "Access denied: Design owned by another user"),
            @ApiResponse(responseCode = "404", description = "Design not found")
    })
    public ResponseEntity<EstimateComparisonResponse> compareEstimates(
            @PathVariable Long id,
            @Valid @RequestBody EstimateComparisonRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        EstimateComparisonResponse response = costEstimationService.compareEstimates(id, request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }
}
