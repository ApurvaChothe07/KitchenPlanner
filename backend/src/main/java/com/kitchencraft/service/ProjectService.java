package com.kitchencraft.service;

import com.kitchencraft.dto.request.CreateProjectRequest;
import com.kitchencraft.dto.request.UpdateProjectRequest;
import com.kitchencraft.dto.response.ProjectResponse;

import java.util.List;

public interface ProjectService {

    ProjectResponse createProject(CreateProjectRequest request, String userEmail);

    List<ProjectResponse> getProjects(String userEmail);

    ProjectResponse getProject(Long projectId, String userEmail);

    ProjectResponse updateProject(Long projectId, UpdateProjectRequest request, String userEmail);

    void deleteProject(Long projectId, String userEmail);
}
