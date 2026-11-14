package com.kitchencraft.dto.response;

import com.kitchencraft.entity.ProjectStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectResponse {
    private Long id;
    private Long ownerId;
    private String name;
    private String clientName;
    private String clientEmail;
    private String clientPhone;
    private String clientAddress;
    private ProjectStatus status;
    private int designCount;
    private Instant createdAt;
    private Instant updatedAt;
}
