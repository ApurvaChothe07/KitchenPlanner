package com.kitchencraft.controller;

import com.kitchencraft.dto.request.CabinetRequest;
import com.kitchencraft.dto.request.UpdateDesignRequest;
import com.kitchencraft.dto.response.CabinetResponse;
import com.kitchencraft.dto.response.DesignDetailResponse;
import com.kitchencraft.service.DesignService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/designs")
@RequiredArgsConstructor
@Tag(name = "Design & Cabinet Management", description = "Endpoints for managing kitchen layout designs, room dimensions, and 2D/3D cabinet units")
@SecurityRequirement(name = "Bearer Authentication")
public class DesignController {

    private final DesignService designService;

    @GetMapping("/{id}")
    @Operation(summary = "Get full design details", description = "Returns design details, room dimensions, layout JSON, and all associated cabinets")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Design found"),
            @ApiResponse(responseCode = "403", description = "Access denied: Design owned by another user"),
            @ApiResponse(responseCode = "404", description = "Design not found")
    })
    public ResponseEntity<DesignDetailResponse> getDesign(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        DesignDetailResponse response = designService.getDesign(id, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update design room dimensions and layout metadata", description = "Updates room width, length, height in mm, layout type, and serialized canvas JSON")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Design updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid room dimensions"),
            @ApiResponse(responseCode = "403", description = "Access denied"),
            @ApiResponse(responseCode = "404", description = "Design not found")
    })
    public ResponseEntity<DesignDetailResponse> updateDesign(
            @PathVariable Long id,
            @Valid @RequestBody UpdateDesignRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        DesignDetailResponse response = designService.updateDesign(id, request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/cabinets")
    @Operation(summary = "Add cabinet to design", description = "Places a new cabinet into the design with dimensions and positions in millimetres")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Cabinet added successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid cabinet dimensions or coordinates"),
            @ApiResponse(responseCode = "403", description = "Access denied"),
            @ApiResponse(responseCode = "404", description = "Design not found")
    })
    public ResponseEntity<CabinetResponse> addCabinet(
            @PathVariable Long id,
            @Valid @RequestBody CabinetRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        CabinetResponse response = designService.addCabinet(id, request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}/cabinets/{cabinetId}")
    @Operation(summary = "Update cabinet properties", description = "Updates cabinet dimensions, position (X, Y, Z in mm), rotation, or material finish")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Cabinet updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid cabinet dimensions"),
            @ApiResponse(responseCode = "403", description = "Access denied"),
            @ApiResponse(responseCode = "404", description = "Cabinet or design not found")
    })
    public ResponseEntity<CabinetResponse> updateCabinet(
            @PathVariable Long id,
            @PathVariable Long cabinetId,
            @Valid @RequestBody CabinetRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        CabinetResponse response = designService.updateCabinet(id, cabinetId, request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}/cabinets/{cabinetId}")
    @Operation(summary = "Remove cabinet from design", description = "Deletes a cabinet from the design layout")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Cabinet deleted successfully"),
            @ApiResponse(responseCode = "403", description = "Access denied"),
            @ApiResponse(responseCode = "404", description = "Cabinet or design not found")
    })
    public ResponseEntity<Void> deleteCabinet(
            @PathVariable Long id,
            @PathVariable Long cabinetId,
            @AuthenticationPrincipal UserDetails userDetails) {
        designService.deleteCabinet(id, cabinetId, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}
