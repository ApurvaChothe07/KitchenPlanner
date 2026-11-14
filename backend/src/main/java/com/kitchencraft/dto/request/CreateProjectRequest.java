package com.kitchencraft.dto.request;

import com.kitchencraft.entity.ProjectStatus;
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
public class CreateProjectRequest {

    @NotBlank(message = "Project name is required")
    @Size(min = 2, max = 200, message = "Project name must be between 2 and 200 characters")
    private String name;

    @Size(max = 150, message = "Client name must not exceed 150 characters")
    private String clientName;

    @Email(message = "Client email must be a valid email address")
    private String clientEmail;

    @Size(max = 50, message = "Client phone must not exceed 50 characters")
    private String clientPhone;

    private String clientAddress;

    @Builder.Default
    private ProjectStatus status = ProjectStatus.DRAFT;
}
