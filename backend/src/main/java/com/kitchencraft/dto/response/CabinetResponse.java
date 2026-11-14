package com.kitchencraft.dto.response;

import com.kitchencraft.entity.CabinetType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CabinetResponse {
    private Long id;
    private Long designId;
    private CabinetType cabinetType;
    private Integer widthMm;
    private Integer depthMm;
    private Integer heightMm;
    private Double posX;
    private Double posY;
    private Double posZ;
    private Double rotation;
    private String carcassMaterial;
    private String shutterMaterial;
    private String finishColor;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;
}
