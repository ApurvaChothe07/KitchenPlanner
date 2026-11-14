package com.kitchencraft.service;

import com.kitchencraft.dto.request.MaterialRequest;
import com.kitchencraft.dto.response.MaterialResponse;
import com.kitchencraft.entity.Material;
import com.kitchencraft.entity.MaterialCategory;
import com.kitchencraft.entity.MaterialUnit;
import com.kitchencraft.exception.DuplicateResourceException;
import com.kitchencraft.exception.ResourceNotFoundException;
import com.kitchencraft.repository.MaterialRepository;
import com.kitchencraft.service.impl.MaterialServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MaterialServiceTest {

    @Mock
    private MaterialRepository materialRepository;

    @InjectMocks
    private MaterialServiceImpl materialService;

    private Material sampleMaterial;

    @BeforeEach
    void setUp() {
        sampleMaterial = Material.builder()
                .id(1L)
                .name("HDHMR Board 18mm")
                .category(MaterialCategory.CARCASS)
                .unit(MaterialUnit.SQFT)
                .unitPrice(new BigDecimal("140.00"))
                .active(true)
                .description("Action TESA High Density High Moisture Resistance Board")
                .build();
    }

    @Test
    @DisplayName("Should return all active materials when category filter is null")
    void shouldReturnAllActiveMaterials() {
        when(materialRepository.findAllByActiveTrueOrderByCategoryAscNameAsc()).thenReturn(List.of(sampleMaterial));

        List<MaterialResponse> result = materialService.getAllMaterials(null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("HDHMR Board 18mm");
        verify(materialRepository, times(1)).findAllByActiveTrueOrderByCategoryAscNameAsc();
    }

    @Test
    @DisplayName("Should return materials filtered by category")
    void shouldReturnMaterialsFilteredByCategory() {
        when(materialRepository.findAllByCategoryAndActiveTrueOrderByNameAsc(MaterialCategory.CARCASS))
                .thenReturn(List.of(sampleMaterial));

        List<MaterialResponse> result = materialService.getAllMaterials(MaterialCategory.CARCASS);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getCategory()).isEqualTo(MaterialCategory.CARCASS);
        verify(materialRepository, times(1)).findAllByCategoryAndActiveTrueOrderByNameAsc(MaterialCategory.CARCASS);
    }

    @Test
    @DisplayName("Should return material response when found by ID")
    void shouldReturnMaterialWhenFound() {
        when(materialRepository.findById(1L)).thenReturn(Optional.of(sampleMaterial));

        MaterialResponse result = materialService.getMaterialById(1L);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getUnitPrice()).isEqualByComparingTo(new BigDecimal("140.00"));
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when material ID does not exist")
    void shouldThrowExceptionWhenNotFound() {
        when(materialRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> materialService.getMaterialById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Material not found with ID: 99");
    }

    @Test
    @DisplayName("Should create new material and persist to repository")
    void shouldCreateMaterial() {
        MaterialRequest request = MaterialRequest.builder()
                .name("Kalinga Stone Quartz")
                .category(MaterialCategory.COUNTERTOP)
                .unit(MaterialUnit.SQFT)
                .unitPrice(new BigDecimal("350.00"))
                .description("Engineered quartz slab 20mm")
                .active(true)
                .build();

        Material saved = Material.builder()
                .id(2L)
                .name(request.getName())
                .category(request.getCategory())
                .unit(request.getUnit())
                .unitPrice(request.getUnitPrice())
                .description(request.getDescription())
                .active(true)
                .build();

        when(materialRepository.existsByNameIgnoreCase("Kalinga Stone Quartz")).thenReturn(false);
        when(materialRepository.save(any(Material.class))).thenReturn(saved);

        MaterialResponse response = materialService.createMaterial(request);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(2L);
        assertThat(response.getName()).isEqualTo("Kalinga Stone Quartz");
    }

    @Test
    @DisplayName("Should reject creating material with duplicate name")
    void shouldRejectDuplicateMaterial() {
        MaterialRequest request = MaterialRequest.builder()
                .name("HDHMR Board 18mm")
                .category(MaterialCategory.CARCASS)
                .unit(MaterialUnit.SQFT)
                .unitPrice(new BigDecimal("140.00"))
                .build();

        when(materialRepository.existsByNameIgnoreCase("HDHMR Board 18mm")).thenReturn(true);

        assertThatThrownBy(() -> materialService.createMaterial(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("already exists");
    }

    @Test
    @DisplayName("Should update existing material properties")
    void shouldUpdateMaterial() {
        when(materialRepository.findById(1L)).thenReturn(Optional.of(sampleMaterial));
        when(materialRepository.save(any(Material.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MaterialRequest updateRequest = MaterialRequest.builder()
                .name("HDHMR Board 18mm Plus")
                .category(MaterialCategory.CARCASS)
                .unit(MaterialUnit.SQFT)
                .unitPrice(new BigDecimal("155.00"))
                .description("Updated specs")
                .active(true)
                .build();

        MaterialResponse response = materialService.updateMaterial(1L, updateRequest);

        assertThat(response).isNotNull();
        assertThat(response.getName()).isEqualTo("HDHMR Board 18mm Plus");
        assertThat(response.getUnitPrice()).isEqualByComparingTo(new BigDecimal("155.00"));
    }
}
