package com.kitchencraft.controller;

import com.kitchencraft.dto.request.CreateDesignRequest;
import com.kitchencraft.dto.request.CreateProjectRequest;
import com.kitchencraft.dto.request.UpdateProjectRequest;
import com.kitchencraft.dto.response.DesignDetailResponse;
import com.kitchencraft.dto.response.DesignSummaryResponse;
import com.kitchencraft.dto.response.ProjectResponse;
import com.kitchencraft.service.DesignService;
import com.kitchencraft.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
@Tag(name = "Project Management", description = "Endpoints for creating, managing, and organizing kitchen interior projects")
@SecurityRequirement(name = "Bearer Authentication")
public class ProjectController {

    private final ProjectService projectService;
    private final DesignService designService;

    @PostMapping
    @Operation(summary = "Create new kitchen project", description = "Creates a new project owned by the authenticated user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Project created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request payload"),
            @ApiResponse(responseCode = "401", description = "Unauthenticated")
    })
    public ResponseEntity<ProjectResponse> createProject(
            @Valid @RequestBody CreateProjectRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ProjectResponse response = projectService.createProject(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "List user projects", description = "Returns all kitchen projects owned by the authenticated user")
    public ResponseEntity<List<ProjectResponse>> getProjects(@AuthenticationPrincipal UserDetails userDetails) {
        List<ProjectResponse> response = projectService.getProjects(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get project details", description = "Returns a single project if owned by the authenticated user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Project found"),
            @ApiResponse(responseCode = "403", description = "Access denied: Project owned by another user"),
            @ApiResponse(responseCode = "404", description = "Project not found")
    })
    public ResponseEntity<ProjectResponse> getProject(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        ProjectResponse response = projectService.getProject(id, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update project metadata", description = "Updates project information, client details, or status")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Project updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request payload"),
            @ApiResponse(responseCode = "403", description = "Access denied"),
            @ApiResponse(responseCode = "404", description = "Project not found")
    })
    public ResponseEntity<ProjectResponse> updateProject(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProjectRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ProjectResponse response = projectService.updateProject(id, request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete project", description = "Deletes a project and cascades deletion to all associated designs and cabinets")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Project deleted successfully"),
            @ApiResponse(responseCode = "403", description = "Access denied"),
            @ApiResponse(responseCode = "404", description = "Project not found")
    })
    public ResponseEntity<Void> deleteProject(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        projectService.deleteProject(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/designs")
    @Operation(summary = "Create design for project", description = "Adds a new versioned design with room dimensions to the specified project")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Design created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid room dimensions or request payload"),
            @ApiResponse(responseCode = "403", description = "Access denied"),
            @ApiResponse(responseCode = "409", description = "Duplicate design version number within project")
    })
    public ResponseEntity<DesignDetailResponse> createDesign(
            @PathVariable Long id,
            @Valid @RequestBody CreateDesignRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        DesignDetailResponse response = designService.createDesign(id, request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}/designs")
    @Operation(summary = "List project designs", description = "Returns all versioned designs belonging to the specified project")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Designs retrieved successfully"),
            @ApiResponse(responseCode = "403", description = "Access denied"),
            @ApiResponse(responseCode = "404", description = "Project not found")
    })
    public ResponseEntity<List<DesignSummaryResponse>> getDesignsByProject(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        List<DesignSummaryResponse> response = designService.getDesignsByProject(id, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }
}
