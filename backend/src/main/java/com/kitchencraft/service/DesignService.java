package com.kitchencraft.service;

import com.kitchencraft.dto.request.CabinetRequest;
import com.kitchencraft.dto.request.CreateDesignRequest;
import com.kitchencraft.dto.request.UpdateDesignRequest;
import com.kitchencraft.dto.response.CabinetResponse;
import com.kitchencraft.dto.response.DesignDetailResponse;
import com.kitchencraft.dto.response.DesignSummaryResponse;

import java.util.List;

public interface DesignService {

    DesignDetailResponse createDesign(Long projectId, CreateDesignRequest request, String userEmail);

    List<DesignSummaryResponse> getDesignsByProject(Long projectId, String userEmail);

    DesignDetailResponse getDesign(Long designId, String userEmail);

    DesignDetailResponse updateDesign(Long designId, UpdateDesignRequest request, String userEmail);

    CabinetResponse addCabinet(Long designId, CabinetRequest request, String userEmail);

    CabinetResponse updateCabinet(Long designId, Long cabinetId, CabinetRequest request, String userEmail);

    void deleteCabinet(Long designId, Long cabinetId, String userEmail);
}
