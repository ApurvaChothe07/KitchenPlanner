package com.kitchencraft.controller;

import com.kitchencraft.dto.request.CreateQuotationRequest;
import com.kitchencraft.dto.request.UpdateQuotationStatusRequest;
import com.kitchencraft.dto.response.QuotationResponse;
import com.kitchencraft.dto.response.QuotationSummaryResponse;
import com.kitchencraft.service.QuotationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Quotation Management", description = "Endpoints for creating formal quotation snapshots, versioning, status workflows, and professional PDF generation")
@SecurityRequirement(name = "Bearer Authentication")
public class QuotationController {

    private final QuotationService quotationService;

    @PostMapping("/api/v1/designs/{id}/quotations")
    @Operation(summary = "Create quotation from design", description = "Creates a persistent, immutable quotation snapshot from an authorized design layout and validated BOM estimate")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Quotation created and snapshotted successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request payload"),
            @ApiResponse(responseCode = "403", description = "Access denied: Design owned by another user"),
            @ApiResponse(responseCode = "404", description = "Design not found")
    })
    public ResponseEntity<QuotationResponse> createQuotation(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) CreateQuotationRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        CreateQuotationRequest effectiveReq = (request != null) ? request : new CreateQuotationRequest();
        QuotationResponse response = quotationService.createQuotation(id, effectiveReq, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/api/v1/projects/{id}/quotations")
    @Operation(summary = "List project quotations", description = "Retrieves all quotation snapshots associated with the specified project")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Quotations retrieved successfully"),
            @ApiResponse(responseCode = "403", description = "Access denied: Project owned by another user"),
            @ApiResponse(responseCode = "404", description = "Project not found")
    })
    public ResponseEntity<List<QuotationSummaryResponse>> getQuotationsForProject(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        List<QuotationSummaryResponse> response = quotationService.getQuotationsForProject(id, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/v1/quotations/{id}")
    @Operation(summary = "Get quotation details", description = "Retrieves full quotation snapshot details, status, financial totals, and all itemized BOM lines")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Quotation found"),
            @ApiResponse(responseCode = "403", description = "Access denied: Quotation owned by another user"),
            @ApiResponse(responseCode = "404", description = "Quotation not found")
    })
    public ResponseEntity<QuotationResponse> getQuotation(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        QuotationResponse response = quotationService.getQuotationById(id, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/api/v1/quotations/{id}/status")
    @Operation(summary = "Update quotation status", description = "Transitions quotation status (DRAFT -> ISSUED, DRAFT -> CANCELLED, or ISSUED -> CANCELLED)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Status updated successfully"),
            @ApiResponse(responseCode = "400", description = "Illegal status transition"),
            @ApiResponse(responseCode = "403", description = "Access denied"),
            @ApiResponse(responseCode = "404", description = "Quotation not found")
    })
    public ResponseEntity<QuotationResponse> updateQuotationStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateQuotationStatusRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        QuotationResponse response = quotationService.updateQuotationStatus(id, request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/v1/quotations/{id}/pdf")
    @Operation(summary = "Download quotation PDF", description = "Generates and streams a professional corporate PDF quotation document")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "PDF streamed successfully"),
            @ApiResponse(responseCode = "403", description = "Access denied"),
            @ApiResponse(responseCode = "404", description = "Quotation not found")
    })
    public ResponseEntity<byte[]> downloadQuotationPdf(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        QuotationResponse quote = quotationService.getQuotationById(id, userDetails.getUsername());
        byte[] pdfBytes = quotationService.generateQuotationPdf(id, userDetails.getUsername());

        String filename = String.format("KitchenCraft-Quotation-%s.pdf", quote.getQuotationNumber());

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate")
                .body(pdfBytes);
    }
}
