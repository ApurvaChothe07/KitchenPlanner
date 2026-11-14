package com.kitchencraft.service.impl;

import com.kitchencraft.dto.request.CreateProjectRequest;
import com.kitchencraft.dto.request.UpdateProjectRequest;
import com.kitchencraft.dto.response.ProjectResponse;
import com.kitchencraft.entity.Project;
import com.kitchencraft.entity.ProjectStatus;
import com.kitchencraft.entity.User;
import com.kitchencraft.exception.ResourceNotFoundException;
import com.kitchencraft.repository.ProjectRepository;
import com.kitchencraft.repository.UserRepository;
import com.kitchencraft.service.ProjectService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public ProjectResponse createProject(CreateProjectRequest request, String userEmail) {
        User user = getUserOrThrow(userEmail);

        Project project = Project.builder()
                .owner(user)
                .name(request.getName().trim())
                .clientName(request.getClientName() != null ? request.getClientName().trim() : null)
                .clientEmail(request.getClientEmail() != null ? request.getClientEmail().trim().toLowerCase() : null)
                .clientPhone(request.getClientPhone() != null ? request.getClientPhone().trim() : null)
                .clientAddress(request.getClientAddress() != null ? request.getClientAddress().trim() : null)
                .status(request.getStatus() != null ? request.getStatus() : ProjectStatus.DRAFT)
                .build();

        Project savedProject = projectRepository.save(project);
        log.info("Project created: ID [{}], Name [{}], Owner [{}]", savedProject.getId(), savedProject.getName(), userEmail);
        return mapToProjectResponse(savedProject);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProjectResponse> getProjects(String userEmail) {
        User user = getUserOrThrow(userEmail);
        List<Project> projects = projectRepository.findAllByOwnerOrderByUpdatedAtDesc(user);
        return projects.stream().map(this::mapToProjectResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ProjectResponse getProject(Long projectId, String userEmail) {
        User user = getUserOrThrow(userEmail);
        Project project = getProjectWithOwnershipCheck(projectId, user);
        return mapToProjectResponse(project);
    }

    @Override
    @Transactional
    public ProjectResponse updateProject(Long projectId, UpdateProjectRequest request, String userEmail) {
        User user = getUserOrThrow(userEmail);
        Project project = getProjectWithOwnershipCheck(projectId, user);

        project.setName(request.getName().trim());
        if (request.getClientName() != null) project.setClientName(request.getClientName().trim());
        if (request.getClientEmail() != null) project.setClientEmail(request.getClientEmail().trim().toLowerCase());
        if (request.getClientPhone() != null) project.setClientPhone(request.getClientPhone().trim());
        if (request.getClientAddress() != null) project.setClientAddress(request.getClientAddress().trim());
        if (request.getStatus() != null) project.setStatus(request.getStatus());

        Project updatedProject = projectRepository.save(project);
        log.info("Project updated: ID [{}], Owner [{}]", updatedProject.getId(), userEmail);
        return mapToProjectResponse(updatedProject);
    }

    @Override
    @Transactional
    public void deleteProject(Long projectId, String userEmail) {
        User user = getUserOrThrow(userEmail);
        Project project = getProjectWithOwnershipCheck(projectId, user);

        projectRepository.delete(project);
        log.info("Project deleted: ID [{}], Owner [{}]", projectId, userEmail);
    }

    private User getUserOrThrow(String email) {
        return userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    private Project getProjectWithOwnershipCheck(Long projectId, User user) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + projectId));

        if (!project.getOwner().getId().equals(user.getId())) {
            log.warn("Access denied: User ID [{}] attempted to access Project ID [{}] owned by User ID [{}]",
                    user.getId(), projectId, project.getOwner().getId());
            throw new AccessDeniedException("You do not have permission to access project with ID: " + projectId);
        }
        return project;
    }

    private ProjectResponse mapToProjectResponse(Project project) {
        return ProjectResponse.builder()
                .id(project.getId())
                .ownerId(project.getOwner().getId())
                .name(project.getName())
                .clientName(project.getClientName())
                .clientEmail(project.getClientEmail())
                .clientPhone(project.getClientPhone())
                .clientAddress(project.getClientAddress())
                .status(project.getStatus())
                .designCount(project.getDesigns() != null ? project.getDesigns().size() : 0)
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }
}
