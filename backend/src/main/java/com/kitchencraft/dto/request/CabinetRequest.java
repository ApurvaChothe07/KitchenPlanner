package com.kitchencraft.dto.request;

import com.kitchencraft.entity.CabinetType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request payload for placing or resizing a cabinet unit")
public class CabinetRequest {

    @NotNull(message = "Cabinet type is required")
    @Schema(description = "Type category of modular cabinet unit", example = "BASE")
    private CabinetType cabinetType;

    @NotNull(message = "Width in mm is required")
    @Min(value = 150, message = "Width must be at least 150 mm")
    @Max(value = 3000, message = "Width cannot exceed 3000 mm")
    @Schema(description = "Width dimension in millimetres (mm)", example = "600")
    private Integer widthMm;

    @NotNull(message = "Depth in mm is required")
    @Min(value = 150, message = "Depth must be at least 150 mm")
    @Max(value = 1200, message = "Depth cannot exceed 1200 mm")
    @Schema(description = "Depth dimension in millimetres (mm)", example = "600")
    private Integer depthMm;

    @NotNull(message = "Height in mm is required")
    @Min(value = 200, message = "Height must be at least 200 mm")
    @Max(value = 3000, message = "Height cannot exceed 3000 mm")
    @Schema(description = "Height dimension in millimetres (mm)", example = "870")
    private Integer heightMm;

    @NotNull(message = "Position X in mm is required")
    @Builder.Default
    @Schema(description = "X-coordinate in millimeters relative to room origin", example = "1200.0")
    private Double posX = 0.0;

    @NotNull(message = "Position Y in mm is required")
    @Builder.Default
    @Schema(description = "Y-coordinate (depth on 2D floor) in millimeters", example = "0.0")
    private Double posY = 0.0;

    @NotNull(message = "Position Z in mm is required")
    @Builder.Default
    @Schema(description = "Elevation / height offset from floor in millimeters", example = "0.0")
    private Double posZ = 0.0;

    @NotNull(message = "Rotation in degrees is required")
    @Builder.Default
    @Schema(description = "Planar orientation rotation in degrees (0, 90, 180, 270)", example = "0.0")
    private Double rotation = 0.0;

    @Size(max = 100, message = "Carcass material name must not exceed 100 characters")
    @Schema(description = "Custom carcass material reference override", example = "BWR Plywood")
    private String carcassMaterial;

    @Size(max = 100, message = "Shutter material name must not exceed 100 characters")
    @Schema(description = "Custom shutter material reference override", example = "Acrylic 2mm")
    private String shutterMaterial;

    @Size(max = 100, message = "Finish color must not exceed 100 characters")
    @Schema(description = "Visual color hex code or finish shade name", example = "#1E293B")
    private String finishColor;

    @Size(max = 500, message = "Notes must not exceed 500 characters")
    @Schema(description = "Custom cabinet remarks or installation notes", example = "Includes spice pull-out insert")
    private String notes;
}
