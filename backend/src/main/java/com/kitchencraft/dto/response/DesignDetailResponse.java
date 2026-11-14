package com.kitchencraft.dto.response;

import com.kitchencraft.entity.LayoutType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DesignDetailResponse {
    private Long id;
    private Long projectId;
    private String name;
    private Integer version;
    private Integer roomWidthMm;
    private Integer roomLengthMm;
    private Integer roomHeightMm;
    private LayoutType layoutType;
    private String layoutDataJson;
    private List<CabinetResponse> cabinets;
    private Instant createdAt;
    private Instant updatedAt;
}
