package com.kitchencraft.service.impl;

import com.kitchencraft.dto.request.MaterialRequest;
import com.kitchencraft.dto.response.MaterialResponse;
import com.kitchencraft.entity.Material;
import com.kitchencraft.entity.MaterialCategory;
import com.kitchencraft.exception.DuplicateResourceException;
import com.kitchencraft.exception.ResourceNotFoundException;
import com.kitchencraft.repository.MaterialRepository;
import com.kitchencraft.service.MaterialService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MaterialServiceImpl implements MaterialService {

    private final MaterialRepository materialRepository;

    @Override
    @Transactional(readOnly = true)
    public List<MaterialResponse> getAllMaterials(MaterialCategory category) {
        List<Material> materials = category != null
                ? materialRepository.findAllByCategoryAndActiveTrueOrderByNameAsc(category)
                : materialRepository.findAllByActiveTrueOrderByCategoryAscNameAsc();

        return materials.stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public MaterialResponse getMaterialById(Long id) {
        Material material = materialRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Material not found with ID: " + id));
        return mapToResponse(material);
    }

    @Override
    @Transactional
    public MaterialResponse createMaterial(MaterialRequest request) {
        String trimmedName = request.getName().trim();
        if (materialRepository.existsByNameIgnoreCase(trimmedName)) {
            throw new DuplicateResourceException("Material with name '" + trimmedName + "' already exists");
        }

        Material material = Material.builder()
                .name(trimmedName)
                .category(request.getCategory())
                .unit(request.getUnit())
                .unitPrice(request.getUnitPrice())
                .description(request.getDescription())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        Material saved = materialRepository.save(material);
        log.info("Material created: ID [{}], Name [{}]", saved.getId(), saved.getName());
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public MaterialResponse updateMaterial(Long id, MaterialRequest request) {
        Material material = materialRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Material not found with ID: " + id));

        String trimmedName = request.getName().trim();
        if (!material.getName().equalsIgnoreCase(trimmedName) && materialRepository.existsByNameIgnoreCase(trimmedName)) {
            throw new DuplicateResourceException("Material with name '" + trimmedName + "' already exists");
        }

        material.setName(trimmedName);
        material.setCategory(request.getCategory());
        material.setUnit(request.getUnit());
        material.setUnitPrice(request.getUnitPrice());
        material.setDescription(request.getDescription());
        if (request.getActive() != null) {
            material.setActive(request.getActive());
        }

        Material updated = materialRepository.save(material);
        log.info("Material updated: ID [{}], Name [{}]", updated.getId(), updated.getName());
        return mapToResponse(updated);
    }

    private MaterialResponse mapToResponse(Material m) {
        return MaterialResponse.builder()
                .id(m.getId())
                .name(m.getName())
                .category(m.getCategory())
                .unit(m.getUnit())
                .unitPrice(m.getUnitPrice())
                .description(m.getDescription())
                .active(m.isActive())
                .createdAt(m.getCreatedAt())
                .updatedAt(m.getUpdatedAt())
                .build();
    }
}
