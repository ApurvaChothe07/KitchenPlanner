package com.kitchencraft.service.impl;

import com.kitchencraft.dto.request.CabinetRequest;
import com.kitchencraft.dto.request.CreateDesignRequest;
import com.kitchencraft.dto.request.UpdateDesignRequest;
import com.kitchencraft.dto.response.CabinetResponse;
import com.kitchencraft.dto.response.DesignDetailResponse;
import com.kitchencraft.dto.response.DesignSummaryResponse;
import com.kitchencraft.entity.*;
import com.kitchencraft.exception.DuplicateResourceException;
import com.kitchencraft.exception.ResourceNotFoundException;
import com.kitchencraft.repository.DesignCabinetRepository;
import com.kitchencraft.repository.DesignRepository;
import com.kitchencraft.repository.ProjectRepository;
import com.kitchencraft.repository.UserRepository;
import com.kitchencraft.service.DesignService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DesignServiceImpl implements DesignService {

    private final DesignRepository designRepository;
    private final DesignCabinetRepository cabinetRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public DesignDetailResponse createDesign(Long projectId, CreateDesignRequest request, String userEmail) {
        User user = getUserOrThrow(userEmail);
        Project project = getProjectWithOwnershipCheck(projectId, user);

        int version;
        if (request.getVersion() != null && request.getVersion() > 0) {
            if (designRepository.existsByProjectIdAndVersion(projectId, request.getVersion())) {
                log.warn("Design creation rejected: Version [{}] already exists for project ID [{}]", request.getVersion(), projectId);
                throw new DuplicateResourceException("Design version " + request.getVersion() + " already exists for project ID: " + projectId);
            }
            version = request.getVersion();
        } else {
            version = designRepository.findMaxVersionByProjectId(projectId).orElse(0) + 1;
        }

        Design design = Design.builder()
                .project(project)
                .name(request.getName() != null && !request.getName().isBlank() ? request.getName().trim() : "Design v" + version)
                .version(version)
                .roomWidthMm(request.getRoomWidthMm())
                .roomLengthMm(request.getRoomLengthMm())
                .roomHeightMm(request.getRoomHeightMm())
                .layoutType(request.getLayoutType() != null ? request.getLayoutType() : LayoutType.L_SHAPED)
                .layoutDataJson(request.getLayoutDataJson())
                .build();

        project.addDesign(design);
        Design savedDesign = designRepository.save(design);
        log.info("Design created: ID [{}], Version [{}], Project ID [{}], User [{}]", savedDesign.getId(), version, projectId, userEmail);
        return mapToDesignDetailResponse(savedDesign);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DesignSummaryResponse> getDesignsByProject(Long projectId, String userEmail) {
        User user = getUserOrThrow(userEmail);
        getProjectWithOwnershipCheck(projectId, user);

        List<Design> designs = designRepository.findAllByProjectIdOrderByVersionDesc(projectId);
        return designs.stream().map(this::mapToDesignSummaryResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public DesignDetailResponse getDesign(Long designId, String userEmail) {
        User user = getUserOrThrow(userEmail);
        Design design = getDesignWithOwnershipCheck(designId, user);
        return mapToDesignDetailResponse(design);
    }

    @Override
    @Transactional
    public DesignDetailResponse updateDesign(Long designId, UpdateDesignRequest request, String userEmail) {
        User user = getUserOrThrow(userEmail);
        Design design = getDesignWithOwnershipCheck(designId, user);

        if (request.getName() != null && !request.getName().isBlank()) {
            design.setName(request.getName().trim());
        }
        design.setRoomWidthMm(request.getRoomWidthMm());
        design.setRoomLengthMm(request.getRoomLengthMm());
        design.setRoomHeightMm(request.getRoomHeightMm());
        if (request.getLayoutType() != null) {
            design.setLayoutType(request.getLayoutType());
        }
        if (request.getLayoutDataJson() != null) {
            design.setLayoutDataJson(request.getLayoutDataJson());
        }

        Design updatedDesign = designRepository.save(design);
        log.info("Design updated: ID [{}], User [{}]", updatedDesign.getId(), userEmail);
        return mapToDesignDetailResponse(updatedDesign);
    }

    @Override
    @Transactional
    public CabinetResponse addCabinet(Long designId, CabinetRequest request, String userEmail) {
        User user = getUserOrThrow(userEmail);
        Design design = getDesignWithOwnershipCheck(designId, user);

        DesignCabinet cabinet = DesignCabinet.builder()
                .design(design)
                .cabinetType(request.getCabinetType())
                .widthMm(request.getWidthMm())
                .depthMm(request.getDepthMm())
                .heightMm(request.getHeightMm())
                .posX(request.getPosX())
                .posY(request.getPosY())
                .posZ(request.getPosZ())
                .rotation(request.getRotation())
                .carcassMaterial(request.getCarcassMaterial())
                .shutterMaterial(request.getShutterMaterial())
                .finishColor(request.getFinishColor())
                .notes(request.getNotes())
                .build();

        design.addCabinet(cabinet);
        DesignCabinet savedCabinet = cabinetRepository.save(cabinet);
        log.info("Cabinet added: ID [{}], Type [{}], Design ID [{}]", savedCabinet.getId(), savedCabinet.getCabinetType(), designId);
        return mapToCabinetResponse(savedCabinet);
    }

    @Override
    @Transactional
    public CabinetResponse updateCabinet(Long designId, Long cabinetId, CabinetRequest request, String userEmail) {
        User user = getUserOrThrow(userEmail);
        getDesignWithOwnershipCheck(designId, user);

        DesignCabinet cabinet = cabinetRepository.findByIdAndDesignId(cabinetId, designId)
                .orElseThrow(() -> new ResourceNotFoundException("Cabinet not found with ID: " + cabinetId + " for design ID: " + designId));

        cabinet.setCabinetType(request.getCabinetType());
        cabinet.setWidthMm(request.getWidthMm());
        cabinet.setDepthMm(request.getDepthMm());
        cabinet.setHeightMm(request.getHeightMm());
        cabinet.setPosX(request.getPosX());
        cabinet.setPosY(request.getPosY());
        cabinet.setPosZ(request.getPosZ());
        cabinet.setRotation(request.getRotation());
        cabinet.setCarcassMaterial(request.getCarcassMaterial());
        cabinet.setShutterMaterial(request.getShutterMaterial());
        cabinet.setFinishColor(request.getFinishColor());
        cabinet.setNotes(request.getNotes());

        DesignCabinet updatedCabinet = cabinetRepository.save(cabinet);
        log.info("Cabinet updated: ID [{}], Design ID [{}]", updatedCabinet.getId(), designId);
        return mapToCabinetResponse(updatedCabinet);
    }

    @Override
    @Transactional
    public void deleteCabinet(Long designId, Long cabinetId, String userEmail) {
        User user = getUserOrThrow(userEmail);
        Design design = getDesignWithOwnershipCheck(designId, user);

        DesignCabinet cabinet = cabinetRepository.findByIdAndDesignId(cabinetId, designId)
                .orElseThrow(() -> new ResourceNotFoundException("Cabinet not found with ID: " + cabinetId + " for design ID: " + designId));

        design.removeCabinet(cabinet);
        cabinetRepository.delete(cabinet);
        log.info("Cabinet deleted: ID [{}], Design ID [{}]", cabinetId, designId);
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

    private Design getDesignWithOwnershipCheck(Long designId, User user) {
        Design design = designRepository.findById(designId)
                .orElseThrow(() -> new ResourceNotFoundException("Design not found with ID: " + designId));

        if (!design.getProject().getOwner().getId().equals(user.getId())) {
            log.warn("Access denied: User ID [{}] attempted to access Design ID [{}] owned by User ID [{}]",
                    user.getId(), designId, design.getProject().getOwner().getId());
            throw new AccessDeniedException("You do not have permission to access design with ID: " + designId);
        }
        return design;
    }

    private DesignSummaryResponse mapToDesignSummaryResponse(Design design) {
        return DesignSummaryResponse.builder()
                .id(design.getId())
                .projectId(design.getProject().getId())
                .name(design.getName())
                .version(design.getVersion())
                .roomWidthMm(design.getRoomWidthMm())
                .roomLengthMm(design.getRoomLengthMm())
                .roomHeightMm(design.getRoomHeightMm())
                .layoutType(design.getLayoutType())
                .cabinetCount(design.getCabinets() != null ? design.getCabinets().size() : 0)
                .createdAt(design.getCreatedAt())
                .updatedAt(design.getUpdatedAt())
                .build();
    }

    private DesignDetailResponse mapToDesignDetailResponse(Design design) {
        List<CabinetResponse> cabinetResponses = design.getCabinets() != null
                ? design.getCabinets().stream().map(this::mapToCabinetResponse).toList()
                : Collections.emptyList();

        return DesignDetailResponse.builder()
                .id(design.getId())
                .projectId(design.getProject().getId())
                .name(design.getName())
                .version(design.getVersion())
                .roomWidthMm(design.getRoomWidthMm())
                .roomLengthMm(design.getRoomLengthMm())
                .roomHeightMm(design.getRoomHeightMm())
                .layoutType(design.getLayoutType())
                .layoutDataJson(design.getLayoutDataJson())
                .cabinets(cabinetResponses)
                .createdAt(design.getCreatedAt())
                .updatedAt(design.getUpdatedAt())
                .build();
    }

    private CabinetResponse mapToCabinetResponse(DesignCabinet cabinet) {
        return CabinetResponse.builder()
                .id(cabinet.getId())
                .designId(cabinet.getDesign().getId())
                .cabinetType(cabinet.getCabinetType())
                .widthMm(cabinet.getWidthMm())
                .depthMm(cabinet.getDepthMm())
                .heightMm(cabinet.getHeightMm())
                .posX(cabinet.getPosX())
                .posY(cabinet.getPosY())
                .posZ(cabinet.getPosZ())
                .rotation(cabinet.getRotation())
                .carcassMaterial(cabinet.getCarcassMaterial())
                .shutterMaterial(cabinet.getShutterMaterial())
                .finishColor(cabinet.getFinishColor())
                .notes(cabinet.getNotes())
                .createdAt(cabinet.getCreatedAt())
                .updatedAt(cabinet.getUpdatedAt())
                .build();
    }
}
