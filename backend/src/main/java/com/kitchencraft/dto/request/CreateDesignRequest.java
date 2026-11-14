package com.kitchencraft.dto.request;

import com.kitchencraft.entity.LayoutType;
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
public class CreateDesignRequest {

    @Size(max = 200, message = "Design name must not exceed 200 characters")
    @Builder.Default
    private String name = "Initial Design";

    private Integer version;

    @NotNull(message = "Room width in mm is required")
    @Min(value = 1000, message = "Room width must be at least 1000 mm (1.0 m)")
    @Max(value = 30000, message = "Room width cannot exceed 30000 mm (30.0 m)")
    private Integer roomWidthMm;

    @NotNull(message = "Room length in mm is required")
    @Min(value = 1000, message = "Room length must be at least 1000 mm (1.0 m)")
    @Max(value = 30000, message = "Room length cannot exceed 30000 mm (30.0 m)")
    private Integer roomLengthMm;

    @NotNull(message = "Room height in mm is required")
    @Min(value = 1800, message = "Room height must be at least 1800 mm (1.8 m)")
    @Max(value = 6000, message = "Room height cannot exceed 6000 mm (6.0 m)")
    private Integer roomHeightMm;

    @Builder.Default
    private LayoutType layoutType = LayoutType.L_SHAPED;

    private String layoutDataJson;
}
