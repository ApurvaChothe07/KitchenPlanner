package com.kitchencraft.service;

import com.kitchencraft.dto.request.MaterialRequest;
import com.kitchencraft.dto.response.MaterialResponse;
import com.kitchencraft.entity.MaterialCategory;

import java.util.List;

public interface MaterialService {

    List<MaterialResponse> getAllMaterials(MaterialCategory category);

    MaterialResponse getMaterialById(Long id);

    MaterialResponse createMaterial(MaterialRequest request);

    MaterialResponse updateMaterial(Long id, MaterialRequest request);
}
