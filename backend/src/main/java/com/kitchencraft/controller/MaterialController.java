package com.kitchencraft.controller;

import com.kitchencraft.dto.request.MaterialRequest;
import com.kitchencraft.dto.response.MaterialResponse;
import com.kitchencraft.entity.MaterialCategory;
import com.kitchencraft.service.MaterialService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/materials")
@RequiredArgsConstructor
@Tag(name = "Material Catalogue", description = "Endpoints for managing material catalog items, sample rates, and finish specifications")
@SecurityRequirement(name = "Bearer Authentication")
public class MaterialController {

    private final MaterialService materialService;

    @GetMapping
    @Operation(summary = "List materials", description = "Retrieves active materials, optionally filtered by category (CARCASS, SHUTTER, COUNTERTOP, HARDWARE, FINISH)")
    @ApiResponse(responseCode = "200", description = "Materials retrieved successfully")
    public ResponseEntity<List<MaterialResponse>> getAllMaterials(
            @RequestParam(required = false) MaterialCategory category) {
        List<MaterialResponse> materials = materialService.getAllMaterials(category);
        return ResponseEntity.ok(materials);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get material by ID", description = "Retrieves single material specifications and unit price")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Material found"),
            @ApiResponse(responseCode = "404", description = "Material not found")
    })
    public ResponseEntity<MaterialResponse> getMaterialById(@PathVariable Long id) {
        MaterialResponse material = materialService.getMaterialById(id);
        return ResponseEntity.ok(material);
    }

    @PostMapping
    @Operation(summary = "Create new catalogue material", description = "Adds a new material with rate, unit, and specification details")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Material created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request payload")
    })
    public ResponseEntity<MaterialResponse> createMaterial(@Valid @RequestBody MaterialRequest request) {
        MaterialResponse material = materialService.createMaterial(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(material);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update catalogue material", description = "Updates rate, specifications, or active status of a material")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Material updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request payload"),
            @ApiResponse(responseCode = "404", description = "Material not found")
    })
    public ResponseEntity<MaterialResponse> updateMaterial(
            @PathVariable Long id,
            @Valid @RequestBody MaterialRequest request) {
        MaterialResponse material = materialService.updateMaterial(id, request);
        return ResponseEntity.ok(material);
    }
}
