package com.kitchencraft.dto.response;

import com.kitchencraft.entity.MaterialCategory;
import com.kitchencraft.entity.MaterialUnit;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaterialResponse {
    private Long id;
    private String name;
    private MaterialCategory category;
    private MaterialUnit unit;
    private BigDecimal unitPrice;
    private String description;
    private boolean active;
    private Instant createdAt;
    private Instant updatedAt;
}
