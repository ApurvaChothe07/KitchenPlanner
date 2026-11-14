package com.kitchencraft.service;

import com.kitchencraft.dto.request.EstimateComparisonRequest;
import com.kitchencraft.dto.request.EstimateRequest;
import com.kitchencraft.dto.response.CostEstimateResponse;
import com.kitchencraft.dto.response.EstimateComparisonResponse;
import com.kitchencraft.entity.*;
import com.kitchencraft.repository.DesignRepository;
import com.kitchencraft.repository.MaterialRepository;
import com.kitchencraft.repository.UserRepository;
import com.kitchencraft.service.impl.CostEstimationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CostEstimationServiceTest {

    @Mock
    private DesignRepository designRepository;

    @Mock
    private MaterialRepository materialRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CostEstimationServiceImpl costEstimationService;

    private User testUser;
    private Project testProject;
    private Design testDesign;
    private Material carcassMaterial;
    private Material shutterMaterial;
    private Material countertopMaterial;
    private Material hingeMaterial;
    private Material handleMaterial;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .email("designer@kitchencraft.com")
                .passwordHash("hashed")
                .role(Role.ROLE_USER)
                .build();

        testProject = Project.builder()
                .id(10L)
                .owner(testUser)
                .name("Villa Kitchen")
                .clientName("Aarav Mehta")
                .build();

        testDesign = Design.builder()
                .id(100L)
                .project(testProject)
                .version(1)
                .name("Modern L-Shape")
                .roomWidthMm(4000)
                .roomLengthMm(3000)
                .roomHeightMm(2700)
                .cabinets(new ArrayList<>())
                .build();

        carcassMaterial = Material.builder()
                .id(1L)
                .name("BWR Plywood (IS 303)")
                .category(MaterialCategory.CARCASS)
                .unit(MaterialUnit.SQFT)
                .unitPrice(new BigDecimal("140.00"))
                .active(true)
                .build();

        shutterMaterial = Material.builder()
                .id(2L)
                .name("Anti-Fingerprint Matte Laminate")
                .category(MaterialCategory.SHUTTER)
                .unit(MaterialUnit.SQFT)
                .unitPrice(new BigDecimal("180.00"))
                .active(true)
                .build();

        countertopMaterial = Material.builder()
                .id(3L)
                .name("Black Galaxy Granite (18mm)")
                .category(MaterialCategory.COUNTERTOP)
                .unit(MaterialUnit.SQFT)
                .unitPrice(new BigDecimal("220.00"))
                .active(true)
                .build();

        hingeMaterial = Material.builder()
                .id(4L)
                .name("Soft-Close Concealed Hinges (Pair)")
                .category(MaterialCategory.HARDWARE)
                .unit(MaterialUnit.PIECE)
                .unitPrice(new BigDecimal("320.00"))
                .active(true)
                .build();

        handleMaterial = Material.builder()
                .id(5L)
                .name("SS304 Edge Profile Handle")
                .category(MaterialCategory.HARDWARE)
                .unit(MaterialUnit.PIECE)
                .unitPrice(new BigDecimal("240.00"))
                .active(true)
                .build();
    }

    private void setupDefaultMaterials() {
        when(materialRepository.findByNameIgnoreCase("BWR Plywood (IS 303)"))
                .thenReturn(Optional.of(carcassMaterial));
        when(materialRepository.findByNameIgnoreCase("Anti-Fingerprint Matte Laminate"))
                .thenReturn(Optional.of(shutterMaterial));
        when(materialRepository.findByNameIgnoreCase("Black Galaxy Granite (18mm)"))
                .thenReturn(Optional.of(countertopMaterial));
        when(materialRepository.findByNameIgnoreCase("Soft-Close Concealed Hinges (Pair)"))
                .thenReturn(Optional.of(hingeMaterial));
        when(materialRepository.findByNameIgnoreCase("SS304 Edge Profile Handle"))
                .thenReturn(Optional.of(handleMaterial));
    }

    @Test
    @DisplayName("Should compute accurate itemized BOM cost estimate for a design with base and wall cabinets")
    void shouldComputeAccurateEstimate() {
        // Given 1 BASE cabinet and 1 WALL cabinet
        DesignCabinet baseCabinet = DesignCabinet.builder()
                .id(1L)
                .design(testDesign)
                .cabinetType(CabinetType.BASE)
                .posX(0.0)
                .posY(0.0)
                .widthMm(600)
                .depthMm(600)
                .heightMm(870)
                .build();

        DesignCabinet wallCabinet = DesignCabinet.builder()
                .id(2L)
                .design(testDesign)
                .cabinetType(CabinetType.WALL)
                .posX(600.0)
                .posY(0.0)
                .widthMm(600)
                .depthMm(350)
                .heightMm(720)
                .build();

        testDesign.getCabinets().addAll(List.of(baseCabinet, wallCabinet));

        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(designRepository.findById(100L)).thenReturn(Optional.of(testDesign));
        setupDefaultMaterials();

        EstimateRequest request = EstimateRequest.builder()
                .wastagePercentage(new BigDecimal("10.00"))
                .laborPercentage(new BigDecimal("15.00"))
                .installationPercentage(new BigDecimal("5.00"))
                .discountPercentage(BigDecimal.ZERO)
                .taxPercentage(new BigDecimal("18.00"))
                .build();

        // When
        CostEstimateResponse response = costEstimationService.calculateEstimate(100L, request, testUser.getEmail());

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getDesignId()).isEqualTo(100L);
        assertThat(response.getTotalCabinetCount()).isEqualTo(2);

        // Verification of itemized breakdown
        assertThat(response.getLineItems()).isNotEmpty();
        assertThat(response.getMaterialTotal()).isGreaterThan(BigDecimal.ZERO);
        assertThat(response.getWastageAmount()).isGreaterThan(BigDecimal.ZERO);
        assertThat(response.getLaborAmount()).isGreaterThan(BigDecimal.ZERO);
        assertThat(response.getInstallationAmount()).isGreaterThan(BigDecimal.ZERO);
        assertThat(response.getGrossSubtotal()).isGreaterThan(response.getMaterialTotal());
        assertThat(response.getTaxAmount()).isGreaterThan(BigDecimal.ZERO);
        assertThat(response.getGrandTotal()).isGreaterThan(response.getNetTaxableAmount());

        // Exact arithmetic relationship checks
        BigDecimal expectedGross = response.getMaterialTotal()
                .add(response.getWastageAmount())
                .add(response.getLaborAmount())
                .add(response.getInstallationAmount());
        assertThat(response.getGrossSubtotal()).isEqualByComparingTo(expectedGross);

        BigDecimal expectedGrand = response.getNetTaxableAmount().add(response.getTaxAmount());
        assertThat(response.getGrandTotal()).isEqualByComparingTo(expectedGrand);
    }

    @Test
    @DisplayName("Should return zero totals gracefully when design has zero cabinets")
    void shouldHandleEmptyDesignGracefully() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(designRepository.findById(100L)).thenReturn(Optional.of(testDesign));
        setupDefaultMaterials();

        EstimateRequest request = new EstimateRequest();
        CostEstimateResponse response = costEstimationService.calculateEstimate(100L, request, testUser.getEmail());

        assertThat(response).isNotNull();
        assertThat(response.getTotalCabinetCount()).isZero();
        assertThat(response.getMaterialTotal()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(response.getGrandTotal()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(response.getTaxAmount()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("Should reject calculation when requester is not design owner")
    void shouldRejectWhenUserNotOwner() {
        User otherUser = User.builder()
                .id(999L)
                .email("intruder@kitchencraft.com")
                .role(Role.ROLE_USER)
                .build();

        when(userRepository.findByEmail("intruder@kitchencraft.com")).thenReturn(Optional.of(otherUser));
        when(designRepository.findById(100L)).thenReturn(Optional.of(testDesign));

        EstimateRequest request = new EstimateRequest();

        assertThatThrownBy(() -> costEstimationService.calculateEstimate(100L, request, "intruder@kitchencraft.com"))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("permission to access design");
    }

    @Test
    @DisplayName("Should apply material overrides and discount rate correctly")
    void shouldApplyOverridesAndDiscount() {
        DesignCabinet baseCabinet = DesignCabinet.builder()
                .id(1L)
                .design(testDesign)
                .cabinetType(CabinetType.BASE)
                .widthMm(900)
                .depthMm(600)
                .heightMm(870)
                .build();
        testDesign.getCabinets().add(baseCabinet);

        Material premiumCarcass = Material.builder()
                .id(10L)
                .name("Marine Grade BWP Plywood")
                .category(MaterialCategory.CARCASS)
                .unit(MaterialUnit.SQFT)
                .unitPrice(new BigDecimal("175.00"))
                .active(true)
                .build();

        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(designRepository.findById(100L)).thenReturn(Optional.of(testDesign));
        when(materialRepository.findById(10L)).thenReturn(Optional.of(premiumCarcass));
        setupDefaultMaterials();

        EstimateRequest request = EstimateRequest.builder()
                .carcassMaterialId(10L)
                .discountPercentage(new BigDecimal("10.00")) // 10% promotional discount
                .taxPercentage(new BigDecimal("18.00"))
                .build();

        CostEstimateResponse response = costEstimationService.calculateEstimate(100L, request, testUser.getEmail());

        assertThat(response).isNotNull();
        assertThat(response.getDiscountPercentage()).isEqualByComparingTo(new BigDecimal("10.00"));
        assertThat(response.getDiscountAmount()).isGreaterThan(BigDecimal.ZERO);

        // Verify carcass line item used the premium rate
        response.getLineItems().stream()
                .filter(item -> "CARCASS".equals(item.getCategory()))
                .findFirst()
                .ifPresent(carcassItem -> {
                    assertThat(carcassItem.getItemDescription()).contains("Marine Grade BWP Plywood");
                    assertThat(carcassItem.getUnitPrice()).isEqualByComparingTo(new BigDecimal("175.00"));
                });
    }

    @Test
    @DisplayName("Should compare two estimates side-by-side with accurate difference and percentage")
    void shouldCompareEstimatesAccurately() {
        DesignCabinet baseCabinet = DesignCabinet.builder()
                .id(1L)
                .design(testDesign)
                .cabinetType(CabinetType.BASE)
                .widthMm(1000)
                .depthMm(600)
                .heightMm(870)
                .build();
        testDesign.getCabinets().add(baseCabinet);

        Material premiumShutter = Material.builder()
                .id(20L)
                .name("High Gloss Acrylic Sheet")
                .category(MaterialCategory.SHUTTER)
                .unit(MaterialUnit.SQFT)
                .unitPrice(new BigDecimal("260.00")) // More expensive than 180 laminate
                .active(true)
                .build();

        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(designRepository.findById(100L)).thenReturn(Optional.of(testDesign));
        when(materialRepository.findById(20L)).thenReturn(Optional.of(premiumShutter));
        setupDefaultMaterials();

        EstimateComparisonRequest compareRequest = EstimateComparisonRequest.builder()
                .optionA(EstimateRequest.builder().build())
                .optionB(EstimateRequest.builder().shutterMaterialId(20L).build())
                .build();

        EstimateComparisonResponse comparison = costEstimationService.compareEstimates(100L, compareRequest, testUser.getEmail());

        assertThat(comparison).isNotNull();
        assertThat(comparison.getEstimateA()).isNotNull();
        assertThat(comparison.getEstimateB()).isNotNull();
        // Option B (Acrylic) should be more expensive than Option A (Laminate)
        assertThat(comparison.getEstimateB().getGrandTotal()).isGreaterThan(comparison.getEstimateA().getGrandTotal());
        assertThat(comparison.getTotalDifference()).isEqualByComparingTo(
                comparison.getEstimateB().getGrandTotal().subtract(comparison.getEstimateA().getGrandTotal())
        );
        assertThat(comparison.getPercentageDifference()).isGreaterThan(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("Should accurately estimate complex layout with TALL, CORNER, DRAWER, SINK, HOB, and wide WALL units")
    void shouldCalculateComplexMultiCabinetKitchen() {
        // 1. Tall Cabinet (600x600x2100)
        DesignCabinet tallCab = DesignCabinet.builder()
                .id(1L).design(testDesign).cabinetType(CabinetType.TALL)
                .widthMm(600).depthMm(600).heightMm(2100).build();

        // 2. Corner Base (900x900x870)
        DesignCabinet cornerCab = DesignCabinet.builder()
                .id(2L).design(testDesign).cabinetType(CabinetType.CORNER)
                .widthMm(900).depthMm(900).heightMm(870).build();

        // 3. Drawer Base (600x600x870)
        DesignCabinet drawerCab = DesignCabinet.builder()
                .id(3L).design(testDesign).cabinetType(CabinetType.DRAWER_BASE)
                .widthMm(600).depthMm(600).heightMm(870).build();

        // 4. Sink Base (800x600x870)
        DesignCabinet sinkCab = DesignCabinet.builder()
                .id(4L).design(testDesign).cabinetType(CabinetType.SINK_BASE)
                .widthMm(800).depthMm(600).heightMm(870).build();

        // 5. Hob Base (800x600x870)
        DesignCabinet hobCab = DesignCabinet.builder()
                .id(5L).design(testDesign).cabinetType(CabinetType.HOB_BASE)
                .widthMm(800).depthMm(600).heightMm(870).build();

        // 6. Wide Wall Unit (900x350x720) - trigger bi-fold lift-up system
        DesignCabinet wideWallCab = DesignCabinet.builder()
                .id(6L).design(testDesign).cabinetType(CabinetType.WALL)
                .widthMm(900).depthMm(350).heightMm(720).build();

        testDesign.getCabinets().addAll(List.of(tallCab, cornerCab, drawerCab, sinkCab, hobCab, wideWallCab));

        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(designRepository.findById(100L)).thenReturn(Optional.of(testDesign));
        setupDefaultMaterials();

        EstimateRequest request = EstimateRequest.builder()
                .wastagePercentage(new BigDecimal("12.00"))
                .laborPercentage(new BigDecimal("18.00"))
                .installationPercentage(new BigDecimal("6.00"))
                .taxPercentage(new BigDecimal("18.00"))
                .build();

        CostEstimateResponse response = costEstimationService.calculateEstimate(100L, request, testUser.getEmail());

        assertThat(response).isNotNull();
        assertThat(response.getTotalCabinetCount()).isEqualTo(6);

        // Verify that hardware breakdown includes sinks, hobs, and lift-up systems
        boolean hasSink = response.getLineItems().stream().anyMatch(i -> i.getItemDescription().contains("Sink"));
        boolean hasHob = response.getLineItems().stream().anyMatch(i -> i.getItemDescription().contains("Hob"));
        boolean hasLiftUp = response.getLineItems().stream().anyMatch(i -> i.getItemDescription().contains("Lift-Up"));

        assertThat(hasSink).isTrue();
        assertThat(hasHob).isTrue();
        assertThat(hasLiftUp).isTrue();

        // Financial sanity checks
        assertThat(response.getMaterialTotal()).isGreaterThan(new BigDecimal("10000.00"));
        assertThat(response.getGrandTotal()).isGreaterThan(response.getMaterialTotal());
    }

    @Test
    @DisplayName("Should handle boundary conditions: 50% discount and 0% tax with exact half-up arithmetic")
    void shouldCalculateBoundaryDiscountAndZeroTax() {
        DesignCabinet baseCab = DesignCabinet.builder()
                .id(1L).design(testDesign).cabinetType(CabinetType.BASE)
                .widthMm(600).depthMm(600).heightMm(870).build();
        testDesign.getCabinets().add(baseCab);

        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(designRepository.findById(100L)).thenReturn(Optional.of(testDesign));
        setupDefaultMaterials();

        EstimateRequest request = EstimateRequest.builder()
                .wastagePercentage(BigDecimal.ZERO)
                .laborPercentage(BigDecimal.ZERO)
                .installationPercentage(BigDecimal.ZERO)
                .discountPercentage(new BigDecimal("50.00")) // 50% discount
                .taxPercentage(BigDecimal.ZERO)              // 0% tax
                .build();

        CostEstimateResponse response = costEstimationService.calculateEstimate(100L, request, testUser.getEmail());

        assertThat(response).isNotNull();
        assertThat(response.getTaxAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        // At 50% discount with zero wastage/labor/tax, grand total should be exactly half of materialTotal
        BigDecimal halfMaterial = response.getMaterialTotal().divide(new BigDecimal("2.00"), 2, java.math.RoundingMode.HALF_UP);
        assertThat(response.getGrandTotal()).isEqualByComparingTo(halfMaterial);
    }
}
