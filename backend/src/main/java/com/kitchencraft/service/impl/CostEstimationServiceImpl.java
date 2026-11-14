package com.kitchencraft.service.impl;

import com.kitchencraft.dto.request.EstimateComparisonRequest;
import com.kitchencraft.dto.request.EstimateRequest;
import com.kitchencraft.dto.response.CostEstimateResponse;
import com.kitchencraft.dto.response.EstimateComparisonResponse;
import com.kitchencraft.dto.response.ItemizedCostResponse;
import com.kitchencraft.entity.*;
import com.kitchencraft.exception.ResourceNotFoundException;
import com.kitchencraft.repository.DesignRepository;
import com.kitchencraft.repository.MaterialRepository;
import com.kitchencraft.repository.UserRepository;
import com.kitchencraft.service.CostEstimationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class CostEstimationServiceImpl implements CostEstimationService {

    private final DesignRepository designRepository;
    private final MaterialRepository materialRepository;
    private final UserRepository userRepository;

    // 1 square foot = 92,903.04 square millimetres
    private static final BigDecimal MM2_TO_SQFT = new BigDecimal("92903.04");
    private static final BigDecimal HUNDRED = new BigDecimal("100.00");

    @Override
    @Transactional(readOnly = true)
    public CostEstimateResponse calculateEstimate(Long designId, EstimateRequest request, String userEmail) {
        User user = getUserOrThrow(userEmail);
        Design design = getDesignWithOwnershipCheck(designId, user);

        return computeEstimateInternal(design, request != null ? request : new EstimateRequest());
    }

    @Override
    @Transactional(readOnly = true)
    public EstimateComparisonResponse compareEstimates(Long designId, EstimateComparisonRequest request, String userEmail) {
        User user = getUserOrThrow(userEmail);
        Design design = getDesignWithOwnershipCheck(designId, user);

        CostEstimateResponse estimateA = computeEstimateInternal(design, request.getOptionA());
        CostEstimateResponse estimateB = computeEstimateInternal(design, request.getOptionB());

        BigDecimal totalDifference = estimateB.getGrandTotal().subtract(estimateA.getGrandTotal());

        BigDecimal percentageDiff = BigDecimal.ZERO;
        if (estimateA.getGrandTotal().compareTo(BigDecimal.ZERO) > 0) {
            percentageDiff = totalDifference
                    .multiply(HUNDRED)
                    .divide(estimateA.getGrandTotal(), 2, RoundingMode.HALF_UP);
        }

        Map<String, BigDecimal> itemizedDiff = new LinkedHashMap<>();
        itemizedDiff.put("carcassDifference", estimateB.getCarcassSubtotal().subtract(estimateA.getCarcassSubtotal()));
        itemizedDiff.put("shutterDifference", estimateB.getShutterSubtotal().subtract(estimateA.getShutterSubtotal()));
        itemizedDiff.put("countertopDifference", estimateB.getCountertopSubtotal().subtract(estimateA.getCountertopSubtotal()));
        itemizedDiff.put("hardwareDifference", estimateB.getHardwareSubtotal().subtract(estimateA.getHardwareSubtotal()));
        itemizedDiff.put("materialTotalDifference", estimateB.getMaterialTotal().subtract(estimateA.getMaterialTotal()));
        itemizedDiff.put("taxableAmountDifference", estimateB.getNetTaxableAmount().subtract(estimateA.getNetTaxableAmount()));
        itemizedDiff.put("taxDifference", estimateB.getTaxAmount().subtract(estimateA.getTaxAmount()));
        itemizedDiff.put("grandTotalDifference", totalDifference);

        return EstimateComparisonResponse.builder()
                .estimateA(estimateA)
                .estimateB(estimateB)
                .totalDifference(totalDifference)
                .percentageDifference(percentageDiff)
                .itemizedDifferences(itemizedDiff)
                .build();
    }

    private CostEstimateResponse computeEstimateInternal(Design design, EstimateRequest request) {
        // Resolve Materials from Database
        Material carcassMat = resolveMaterial(request.getCarcassMaterialId(), MaterialCategory.CARCASS, "BWR Plywood (IS 303)");
        Material shutterMat = resolveMaterial(request.getShutterMaterialId(), MaterialCategory.SHUTTER, "Anti-Fingerprint Matte Laminate");
        Material countertopMat = resolveMaterial(request.getCountertopMaterialId(), MaterialCategory.COUNTERTOP, "Black Galaxy Granite (18mm)");

        // Standard Hardware rates
        Material hingeMat = findMaterialOrFallback("Soft-Close Concealed Hinges (Pair)", MaterialCategory.HARDWARE, new BigDecimal("320.00"));
        Material drawerRunnerMat = findMaterialOrFallback("Tandem Drawer Runner Channels (Set)", MaterialCategory.HARDWARE, new BigDecimal("1850.00"));
        Material handleMat = findMaterialOrFallback("SS304 Edge Profile Handle", MaterialCategory.HARDWARE, new BigDecimal("240.00"));
        Material sinkMat = findMaterialOrFallback("SS304 Double Bowl Sink with Drainboard", MaterialCategory.HARDWARE, new BigDecimal("5800.00"));
        Material hobMat = findMaterialOrFallback("Twin Burner Toughened Glass Gas Hob", MaterialCategory.HARDWARE, new BigDecimal("7500.00"));
        Material liftUpMat = findMaterialOrFallback("Hydraulic Bi-Fold Lift-Up System", MaterialCategory.HARDWARE, new BigDecimal("3400.00"));

        List<ItemizedCostResponse> lineItems = new ArrayList<>();

        BigDecimal totalCarcassSqft = BigDecimal.ZERO;
        BigDecimal totalShutterSqft = BigDecimal.ZERO;
        BigDecimal totalCountertopSqft = BigDecimal.ZERO;

        int totalHingesPairs = 0;
        int totalDrawerRunnerSets = 0;
        int totalHandles = 0;
        int totalSinks = 0;
        int totalHobs = 0;
        int totalLiftUpSets = 0;

        List<DesignCabinet> cabinets = design.getCabinets() != null ? design.getCabinets() : Collections.emptyList();

        for (DesignCabinet cab : cabinets) {
            BigDecimal w = BigDecimal.valueOf(cab.getWidthMm());
            BigDecimal d = BigDecimal.valueOf(cab.getDepthMm());
            BigDecimal h = BigDecimal.valueOf(cab.getHeightMm());

            // 1. Carcass Area: 2*(D*H) + 3*(W*D) + (W*H) in mm2
            BigDecimal sidesArea = d.multiply(h).multiply(BigDecimal.valueOf(2));
            BigDecimal horizontalArea = w.multiply(d).multiply(BigDecimal.valueOf(3)); // Top + Bottom + 1 Shelf
            BigDecimal backArea = w.multiply(h);
            BigDecimal carcassMm2 = sidesArea.add(horizontalArea).add(backArea);
            BigDecimal carcassSqft = carcassMm2.divide(MM2_TO_SQFT, 4, RoundingMode.HALF_UP);
            totalCarcassSqft = totalCarcassSqft.add(carcassSqft);

            // 2. Shutter Area: W * H in mm2
            BigDecimal shutterMm2 = w.multiply(h);
            BigDecimal shutterSqft = shutterMm2.divide(MM2_TO_SQFT, 4, RoundingMode.HALF_UP);
            totalShutterSqft = totalShutterSqft.add(shutterSqft);

            // 3. Countertop Area (Applies only to floor base units)
            boolean isBase = cab.getCabinetType() == CabinetType.BASE ||
                             cab.getCabinetType() == CabinetType.SINK_BASE ||
                             cab.getCabinetType() == CabinetType.HOB_BASE ||
                             cab.getCabinetType() == CabinetType.DRAWER_BASE ||
                             cab.getCabinetType() == CabinetType.CORNER;

            if (isBase) {
                BigDecimal topDepthMm = d.add(BigDecimal.valueOf(20)); // 20mm overhang
                BigDecimal topMm2 = w.multiply(topDepthMm);
                BigDecimal topSqft = topMm2.divide(MM2_TO_SQFT, 4, RoundingMode.HALF_UP);
                totalCountertopSqft = totalCountertopSqft.add(topSqft);
            }

            // 4. Hardware Quantities
            if (cab.getCabinetType() == CabinetType.SINK_BASE) {
                totalSinks++;
                totalHingesPairs += 2;
                totalHandles += 2;
            } else if (cab.getCabinetType() == CabinetType.HOB_BASE) {
                totalHobs++;
                totalDrawerRunnerSets += 2; // Tandem pot/pan drawers
                totalHandles += 2;
            } else if (cab.getCabinetType() == CabinetType.DRAWER_BASE) {
                totalDrawerRunnerSets += 3;
                totalHandles += 3;
            } else if (cab.getCabinetType() == CabinetType.WALL) {
                if (cab.getWidthMm() > 700) {
                    totalLiftUpSets++;
                    totalHandles += 1;
                } else {
                    totalHingesPairs += 1;
                    totalHandles += 1;
                }
            } else if (cab.getCabinetType() == CabinetType.TALL) {
                totalHingesPairs += 3;
                totalHandles += 2;
            } else {
                // Standard Base
                totalHingesPairs += (cab.getWidthMm() > 500 ? 2 : 1);
                totalHandles += (cab.getWidthMm() > 500 ? 2 : 1);
            }
        }

        // --- Calculate Itemized Subtotals ---
        totalCarcassSqft = totalCarcassSqft.setScale(2, RoundingMode.HALF_UP);
        BigDecimal carcassSubtotal = totalCarcassSqft.multiply(carcassMat.getUnitPrice()).setScale(2, RoundingMode.HALF_UP);
        lineItems.add(ItemizedCostResponse.builder()
                .itemDescription("Carcass Core: " + carcassMat.getName())
                .category("CARCASS")
                .quantity(totalCarcassSqft)
                .unit(carcassMat.getUnit().name())
                .unitPrice(carcassMat.getUnitPrice())
                .totalCost(carcassSubtotal)
                .calculationDetails(cabinets.size() + " cabinets box panels + shelves")
                .build());

        totalShutterSqft = totalShutterSqft.setScale(2, RoundingMode.HALF_UP);
        BigDecimal shutterSubtotal = totalShutterSqft.multiply(shutterMat.getUnitPrice()).setScale(2, RoundingMode.HALF_UP);
        lineItems.add(ItemizedCostResponse.builder()
                .itemDescription("Shutter Finish: " + shutterMat.getName())
                .category("SHUTTER")
                .quantity(totalShutterSqft)
                .unit(shutterMat.getUnit().name())
                .unitPrice(shutterMat.getUnitPrice())
                .totalCost(shutterSubtotal)
                .calculationDetails("Front door panels with edge banding")
                .build());

        totalCountertopSqft = totalCountertopSqft.setScale(2, RoundingMode.HALF_UP);
        BigDecimal countertopSubtotal = totalCountertopSqft.multiply(countertopMat.getUnitPrice()).setScale(2, RoundingMode.HALF_UP);
        lineItems.add(ItemizedCostResponse.builder()
                .itemDescription("Countertop Slab: " + countertopMat.getName())
                .category("COUNTERTOP")
                .quantity(totalCountertopSqft)
                .unit(countertopMat.getUnit().name())
                .unitPrice(countertopMat.getUnitPrice())
                .totalCost(countertopSubtotal)
                .calculationDetails("Base units top surface + 20mm drip overhang")
                .build());

        // Hardware Line Items
        BigDecimal hardwareSubtotal = BigDecimal.ZERO;

        if (totalHingesPairs > 0) {
            BigDecimal hingesCost = BigDecimal.valueOf(totalHingesPairs).multiply(hingeMat.getUnitPrice()).setScale(2, RoundingMode.HALF_UP);
            hardwareSubtotal = hardwareSubtotal.add(hingesCost);
            lineItems.add(ItemizedCostResponse.builder()
                    .itemDescription(hingeMat.getName())
                    .category("HARDWARE")
                    .quantity(BigDecimal.valueOf(totalHingesPairs))
                    .unit("PAIR")
                    .unitPrice(hingeMat.getUnitPrice())
                    .totalCost(hingesCost)
                    .calculationDetails(totalHingesPairs + " pairs soft-close 3D hinges")
                    .build());
        }

        if (totalDrawerRunnerSets > 0) {
            BigDecimal drawersCost = BigDecimal.valueOf(totalDrawerRunnerSets).multiply(drawerRunnerMat.getUnitPrice()).setScale(2, RoundingMode.HALF_UP);
            hardwareSubtotal = hardwareSubtotal.add(drawersCost);
            lineItems.add(ItemizedCostResponse.builder()
                    .itemDescription(drawerRunnerMat.getName())
                    .category("HARDWARE")
                    .quantity(BigDecimal.valueOf(totalDrawerRunnerSets))
                    .unit("SET")
                    .unitPrice(drawerRunnerMat.getUnitPrice())
                    .totalCost(drawersCost)
                    .calculationDetails(totalDrawerRunnerSets + " tandem soft-close channel sets")
                    .build());
        }

        if (totalHandles > 0) {
            BigDecimal handlesCost = BigDecimal.valueOf(totalHandles).multiply(handleMat.getUnitPrice()).setScale(2, RoundingMode.HALF_UP);
            hardwareSubtotal = hardwareSubtotal.add(handlesCost);
            lineItems.add(ItemizedCostResponse.builder()
                    .itemDescription(handleMat.getName())
                    .category("HARDWARE")
                    .quantity(BigDecimal.valueOf(totalHandles))
                    .unit("PIECE")
                    .unitPrice(handleMat.getUnitPrice())
                    .totalCost(handlesCost)
                    .calculationDetails(totalHandles + " edge profile handles")
                    .build());
        }

        if (totalSinks > 0) {
            BigDecimal sinkCost = BigDecimal.valueOf(totalSinks).multiply(sinkMat.getUnitPrice()).setScale(2, RoundingMode.HALF_UP);
            hardwareSubtotal = hardwareSubtotal.add(sinkCost);
            lineItems.add(ItemizedCostResponse.builder()
                    .itemDescription(sinkMat.getName())
                    .category("APPLIANCE")
                    .quantity(BigDecimal.valueOf(totalSinks))
                    .unit("PIECE")
                    .unitPrice(sinkMat.getUnitPrice())
                    .totalCost(sinkCost)
                    .calculationDetails("Stainless steel double bowl sink insert")
                    .build());
        }

        if (totalHobs > 0) {
            BigDecimal hobCost = BigDecimal.valueOf(totalHobs).multiply(hobMat.getUnitPrice()).setScale(2, RoundingMode.HALF_UP);
            hardwareSubtotal = hardwareSubtotal.add(hobCost);
            lineItems.add(ItemizedCostResponse.builder()
                    .itemDescription(hobMat.getName())
                    .category("APPLIANCE")
                    .quantity(BigDecimal.valueOf(totalHobs))
                    .unit("PIECE")
                    .unitPrice(hobMat.getUnitPrice())
                    .totalCost(hobCost)
                    .calculationDetails("Built-in gas hob cooktop unit")
                    .build());
        }

        if (totalLiftUpSets > 0) {
            BigDecimal liftUpCost = BigDecimal.valueOf(totalLiftUpSets).multiply(liftUpMat.getUnitPrice()).setScale(2, RoundingMode.HALF_UP);
            hardwareSubtotal = hardwareSubtotal.add(liftUpCost);
            lineItems.add(ItemizedCostResponse.builder()
                    .itemDescription(liftUpMat.getName())
                    .category("HARDWARE")
                    .quantity(BigDecimal.valueOf(totalLiftUpSets))
                    .unit("SET")
                    .unitPrice(liftUpMat.getUnitPrice())
                    .totalCost(liftUpCost)
                    .calculationDetails("Bi-fold hydraulic lift-up stay mechanisms")
                    .build());
        }

        // --- Materials Subtotal ---
        BigDecimal materialTotal = carcassSubtotal
                .add(shutterSubtotal)
                .add(countertopSubtotal)
                .add(hardwareSubtotal)
                .setScale(2, RoundingMode.HALF_UP);

        // --- Wastage Allowance ---
        BigDecimal wastagePct = request.getWastagePercentage() != null ? request.getWastagePercentage() : new BigDecimal("10.0");
        BigDecimal wastageAmount = materialTotal.multiply(wastagePct).divide(HUNDRED, 2, RoundingMode.HALF_UP);

        // --- Labor & Assembly ---
        BigDecimal laborPct = request.getLaborPercentage() != null ? request.getLaborPercentage() : new BigDecimal("15.0");
        BigDecimal laborAmount = materialTotal.multiply(laborPct).divide(HUNDRED, 2, RoundingMode.HALF_UP);

        // --- Installation & Site Handling ---
        BigDecimal installPct = request.getInstallationPercentage() != null ? request.getInstallationPercentage() : new BigDecimal("5.0");
        BigDecimal installAmount = materialTotal.multiply(installPct).divide(HUNDRED, 2, RoundingMode.HALF_UP);

        // --- Gross Subtotal ---
        BigDecimal grossSubtotal = materialTotal
                .add(wastageAmount)
                .add(laborAmount)
                .add(installAmount)
                .setScale(2, RoundingMode.HALF_UP);

        // --- Discounts ---
        BigDecimal discountPct = request.getDiscountPercentage() != null ? request.getDiscountPercentage() : BigDecimal.ZERO;
        BigDecimal discountAmount = grossSubtotal.multiply(discountPct).divide(HUNDRED, 2, RoundingMode.HALF_UP);

        // --- Net Taxable Amount ---
        BigDecimal netTaxable = grossSubtotal.subtract(discountAmount).setScale(2, RoundingMode.HALF_UP);

        // --- Tax (GST) ---
        BigDecimal taxPct = request.getTaxPercentage() != null ? request.getTaxPercentage() : new BigDecimal("18.0");
        BigDecimal taxAmount = netTaxable.multiply(taxPct).divide(HUNDRED, 2, RoundingMode.HALF_UP);

        // --- Grand Total ---
        BigDecimal grandTotal = netTaxable.add(taxAmount).setScale(2, RoundingMode.HALF_UP);

        List<String> assumptions = List.of(
                "Carcass surface area assumes 2 sides, top, bottom, back panel, and 1 middle shelf per cabinet.",
                "Shutter area is calculated as full front facial area with standard 2mm edge banding allowance.",
                "Countertop area applies strictly to floor base units with an additional 20mm front drip edge overhang.",
                "Wastage allowance covers standard sheet optimization cutting kerf and edge trimming.",
                "Estimated pricing uses authorized backend catalogue rates and is indicative for preliminary estimation."
        );

        return CostEstimateResponse.builder()
                .designId(design.getId())
                .designName(design.getName())
                .version(design.getVersion())
                .totalCabinetCount(cabinets.size())
                .carcassSubtotal(carcassSubtotal)
                .shutterSubtotal(shutterSubtotal)
                .countertopSubtotal(countertopSubtotal)
                .hardwareSubtotal(hardwareSubtotal)
                .materialTotal(materialTotal)
                .wastagePercentage(wastagePct)
                .wastageAmount(wastageAmount)
                .laborPercentage(laborPct)
                .laborAmount(laborAmount)
                .installationPercentage(installPct)
                .installationAmount(installAmount)
                .grossSubtotal(grossSubtotal)
                .discountPercentage(discountPct)
                .discountAmount(discountAmount)
                .netTaxableAmount(netTaxable)
                .taxPercentage(taxPct)
                .taxAmount(taxAmount)
                .grandTotal(grandTotal)
                .lineItems(lineItems)
                .quantityAssumptions(assumptions)
                .build();
    }

    private Material resolveMaterial(Long materialId, MaterialCategory category, String fallbackName) {
        if (materialId != null) {
            return materialRepository.findById(materialId)
                    .orElseThrow(() -> new ResourceNotFoundException("Material not found with ID: " + materialId));
        }

        return materialRepository.findByNameIgnoreCase(fallbackName)
                .orElseGet(() -> {
                    List<Material> list = materialRepository.findAllByCategoryAndActiveTrueOrderByNameAsc(category);
                    if (!list.isEmpty()) {
                        return list.get(0);
                    }
                    return Material.builder()
                            .name(fallbackName)
                            .category(category)
                            .unit(MaterialUnit.SQFT)
                            .unitPrice(new BigDecimal("100.00"))
                            .build();
                });
    }

    private Material findMaterialOrFallback(String name, MaterialCategory category, BigDecimal fallbackRate) {
        return materialRepository.findByNameIgnoreCase(name)
                .orElseGet(() -> Material.builder()
                        .name(name)
                        .category(category)
                        .unit(MaterialUnit.PIECE)
                        .unitPrice(fallbackRate)
                        .build());
    }

    private User getUserOrThrow(String email) {
        return userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
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
}
