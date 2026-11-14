package com.kitchencraft.dto.request;

import com.kitchencraft.entity.ProjectStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request payload for creating a new kitchen interior project")
public class CreateProjectRequest {

    @NotBlank(message = "Project name is required")
    @Size(min = 2, max = 200, message = "Project name must be between 2 and 200 characters")
    @Schema(description = "Project title or site name", example = "Oberoi Sky City Kitchen")
    private String name;

    @Size(max = 150, message = "Client name must not exceed 150 characters")
    @Schema(description = "Customer full name", example = "Vikram Singhania")
    private String clientName;

    @Email(message = "Client email must be a valid email address")
    @Schema(description = "Customer primary email", example = "vikram.s@example.com")
    private String clientEmail;

    @Size(max = 50, message = "Client phone must not exceed 50 characters")
    @Schema(description = "Customer phone number", example = "+91 98200 12345")
    private String clientPhone;

    @Schema(description = "Installation site address", example = "Tower 3, Flat 1802, Borivali East, Mumbai")
    private String clientAddress;

    @Builder.Default
    @Schema(description = "Initial lifecycle status", example = "DRAFT")
    private ProjectStatus status = ProjectStatus.DRAFT;
}
