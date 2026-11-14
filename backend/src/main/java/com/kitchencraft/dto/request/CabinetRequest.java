package com.kitchencraft.dto.request;

import com.kitchencraft.entity.CabinetType;
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
public class CabinetRequest {

    @NotNull(message = "Cabinet type is required")
    private CabinetType cabinetType;

    @NotNull(message = "Width in mm is required")
    @Min(value = 150, message = "Width must be at least 150 mm")
    @Max(value = 3000, message = "Width cannot exceed 3000 mm")
    private Integer widthMm;

    @NotNull(message = "Depth in mm is required")
    @Min(value = 150, message = "Depth must be at least 150 mm")
    @Max(value = 1200, message = "Depth cannot exceed 1200 mm")
    private Integer depthMm;

    @NotNull(message = "Height in mm is required")
    @Min(value = 200, message = "Height must be at least 200 mm")
    @Max(value = 3000, message = "Height cannot exceed 3000 mm")
    private Integer heightMm;

    @NotNull(message = "Position X in mm is required")
    @Builder.Default
    private Double posX = 0.0;

    @NotNull(message = "Position Y in mm is required")
    @Builder.Default
    private Double posY = 0.0;

    @NotNull(message = "Position Z in mm is required")
    @Builder.Default
    private Double posZ = 0.0;

    @NotNull(message = "Rotation in degrees is required")
    @Builder.Default
    private Double rotation = 0.0;

    @Size(max = 100, message = "Carcass material name must not exceed 100 characters")
    private String carcassMaterial;

    @Size(max = 100, message = "Shutter material name must not exceed 100 characters")
    private String shutterMaterial;

    @Size(max = 100, message = "Finish color must not exceed 100 characters")
    private String finishColor;

    private String notes;
}
