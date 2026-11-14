package com.kitchencraft.dto.request;

import com.kitchencraft.entity.LayoutType;
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
@Schema(description = "Request payload for creating a versioned kitchen design layout")
public class CreateDesignRequest {

    @Size(max = 200, message = "Design name must not exceed 200 characters")
    @Builder.Default
    @Schema(description = "Title or description of layout variation", example = "Modern Open Kitchen v1")
    private String name = "Initial Design";

    @Schema(description = "Optional manual version number; if omitted, autoincrements sequentially", example = "1")
    private Integer version;

    @NotNull(message = "Room width in mm is required")
    @Min(value = 1000, message = "Room width must be at least 1000 mm (1.0 m)")
    @Max(value = 30000, message = "Room width cannot exceed 30000 mm (30.0 m)")
    @Schema(description = "Total room width in millimetres (mm)", example = "4500")
    private Integer roomWidthMm;

    @NotNull(message = "Room length in mm is required")
    @Min(value = 1000, message = "Room length must be at least 1000 mm (1.0 m)")
    @Max(value = 30000, message = "Room length cannot exceed 30000 mm (30.0 m)")
    @Schema(description = "Total room length in millimetres (mm)", example = "3600")
    private Integer roomLengthMm;

    @NotNull(message = "Room height in mm is required")
    @Min(value = 1800, message = "Room height must be at least 1800 mm (1.8 m)")
    @Max(value = 6000, message = "Room height cannot exceed 6000 mm (6.0 m)")
    @Schema(description = "Floor-to-ceiling room height in millimetres (mm)", example = "2800")
    private Integer roomHeightMm;

    @Builder.Default
    @Schema(description = "Kitchen architectural configuration", example = "L_SHAPED")
    private LayoutType layoutType = LayoutType.L_SHAPED;

    @Schema(description = "Serialized canvas metadata or custom room annotations in JSON format")
    private String layoutDataJson;
}
