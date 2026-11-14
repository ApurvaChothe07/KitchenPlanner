package com.kitchencraft.service.impl;

import com.kitchencraft.dto.request.CreateQuotationRequest;
import com.kitchencraft.dto.request.EstimateRequest;
import com.kitchencraft.dto.request.UpdateQuotationStatusRequest;
import com.kitchencraft.dto.response.*;
import com.kitchencraft.entity.*;
import com.kitchencraft.exception.ResourceNotFoundException;
import com.kitchencraft.repository.DesignRepository;
import com.kitchencraft.repository.ProjectRepository;
import com.kitchencraft.repository.QuotationRepository;
import com.kitchencraft.repository.UserRepository;
import com.kitchencraft.service.CostEstimationService;
import com.kitchencraft.service.PdfGenerationService;
import com.kitchencraft.service.QuotationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuotationServiceImpl implements QuotationService {

    private final QuotationRepository quotationRepository;
    private final DesignRepository designRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final CostEstimationService costEstimationService;
    private final PdfGenerationService pdfGenerationService;

    private static final DateTimeFormatter QUOTE_MONTH_FMT = DateTimeFormatter.ofPattern("yyyyMM");

    @Override
    @Transactional
    public QuotationResponse createQuotation(Long designId, CreateQuotationRequest request, String userEmail) {
        User user = getUserOrThrow(userEmail);
        Design design = designRepository.findById(designId)
                .orElseThrow(() -> new ResourceNotFoundException("Design not found with ID: " + designId));

        Project project = design.getProject();
        validateProjectOwnership(project, user);

        CreateQuotationRequest effectiveReq = (request != null) ? request : new CreateQuotationRequest();
        EstimateRequest estimateReq = effectiveReq.getEstimateRequest() != null
                ? effectiveReq.getEstimateRequest()
                : new EstimateRequest();

        // 1. Calculate or retrieve validated estimate using backend CostEstimationService
        CostEstimateResponse estimate = costEstimationService.calculateEstimate(designId, estimateReq, userEmail);

        // 2. Generate unique human-readable quotation number: KC-QT-YYYYMM-XXXX
        long projectQuoteCount = quotationRepository.countByProjectId(project.getId());
        String quoteNumber = generateUniqueQuotationNumber(projectQuoteCount + 1);

        // 3. Resolve snapshot material names from itemized breakdown
        String carcassSnapshot = estimate.getLineItems().stream()
                .filter(item -> "CARCASS".equalsIgnoreCase(item.getCategory()))
                .map(ItemizedCostResponse::getItemDescription)
                .findFirst().orElse("Standard Carcass Core");

        String shutterSnapshot = estimate.getLineItems().stream()
                .filter(item -> "SHUTTER".equalsIgnoreCase(item.getCategory()))
                .map(ItemizedCostResponse::getItemDescription)
                .findFirst().orElse("Standard Shutter Finish");

        String countertopSnapshot = estimate.getLineItems().stream()
                .filter(item -> "COUNTERTOP".equalsIgnoreCase(item.getCategory()))
                .map(ItemizedCostResponse::getItemDescription)
                .findFirst().orElse("Standard Countertop");

        boolean issueNow = Boolean.TRUE.equals(effectiveReq.getIssueImmediately());
        QuotationStatus initialStatus = issueNow ? QuotationStatus.ISSUED : QuotationStatus.DRAFT;
        Instant issuedAt = issueNow ? Instant.now() : null;

        int validDays = effectiveReq.getValidDays() != null ? effectiveReq.getValidDays() : 30;
        LocalDate validUntil = LocalDate.now().plusDays(validDays);

        String clientName = (effectiveReq.getClientName() != null && !effectiveReq.getClientName().isBlank())
                ? effectiveReq.getClientName().trim()
                : project.getClientName();

        // 4. Construct Quotation entity with full financial snapshots
        Quotation quotation = Quotation.builder()
                .quotationNumber(quoteNumber)
                .project(project)
                .design(design)
                .version((int) projectQuoteCount + 1)
                .status(initialStatus)
                .clientName(clientName)
                .clientEmail(effectiveReq.getClientEmail())
                .clientPhone(effectiveReq.getClientPhone())
                .carcassMaterialSnapshot(carcassSnapshot)
                .shutterMaterialSnapshot(shutterSnapshot)
                .countertopMaterialSnapshot(countertopSnapshot)
                .materialSubtotal(estimate.getMaterialTotal())
                .wastagePercentage(estimate.getWastagePercentage())
                .wastageAmount(estimate.getWastageAmount())
                .laborPercentage(estimate.getLaborPercentage())
                .laborAmount(estimate.getLaborAmount())
                .installationPercentage(estimate.getInstallationPercentage())
                .installationAmount(estimate.getInstallationAmount())
                .grossSubtotal(estimate.getGrossSubtotal())
                .discountPercentage(estimate.getDiscountPercentage())
                .discountAmount(estimate.getDiscountAmount())
                .netTaxableAmount(estimate.getNetTaxableAmount())
                .taxPercentage(estimate.getTaxPercentage())
                .taxAmount(estimate.getTaxAmount())
                .finalTotal(estimate.getGrandTotal())
                .validUntil(validUntil)
                .issuedAt(issuedAt)
                .notes(effectiveReq.getNotes())
                .build();

        // 5. Snapshot itemized BOM lines (historical prices and quantities)
        int order = 1;
        for (ItemizedCostResponse line : estimate.getLineItems()) {
            QuotationItem item = QuotationItem.builder()
                    .itemDescription(line.getItemDescription())
                    .category(line.getCategory())
                    .quantity(line.getQuantity())
                    .unit(line.getUnit())
                    .unitPrice(line.getUnitPrice()) // Snapshotted immutable unit price
                    .totalPrice(line.getTotalCost()) // Snapshotted immutable line total
                    .calculationNotes(line.getCalculationDetails())
                    .sortOrder(order++)
                    .build();
            quotation.addItem(item);
        }

        Quotation saved = quotationRepository.save(quotation);
        log.info("Quotation created successfully: ID [{}], Number [{}], Project ID [{}], Total [{}]",
                saved.getId(), saved.getQuotationNumber(), project.getId(), saved.getFinalTotal());

        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuotationSummaryResponse> getQuotationsForProject(Long projectId, String userEmail) {
        User user = getUserOrThrow(userEmail);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + projectId));

        validateProjectOwnership(project, user);

        List<Quotation> quotations = quotationRepository.findAllByProjectIdOrderByCreatedAtDesc(projectId);
        return quotations.stream().map(this::mapToSummaryResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public QuotationResponse getQuotationById(Long id, String userEmail) {
        User user = getUserOrThrow(userEmail);
        Quotation quotation = quotationRepository.findByIdWithItemsAndProject(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quotation not found with ID: " + id));

        validateProjectOwnership(quotation.getProject(), user);

        return mapToResponse(quotation);
    }

    @Override
    @Transactional
    public QuotationResponse updateQuotationStatus(Long id, UpdateQuotationStatusRequest request, String userEmail) {
        User user = getUserOrThrow(userEmail);
        Quotation quotation = quotationRepository.findByIdWithItemsAndProject(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quotation not found with ID: " + id));

        validateProjectOwnership(quotation.getProject(), user);

        QuotationStatus currentStatus = quotation.getStatus();
        QuotationStatus targetStatus = request.getStatus();

        if (!currentStatus.canTransitionTo(targetStatus)) {
            log.warn("Invalid quotation status transition attempted: [{}] -> [{}] for Quotation ID [{}]",
                    currentStatus, targetStatus, id);
            throw new IllegalArgumentException(
                    String.format("Invalid status transition from '%s' to '%s'. Cancelled quotations cannot be modified.",
                            currentStatus, targetStatus));
        }

        quotation.setStatus(targetStatus);
        if (targetStatus == QuotationStatus.ISSUED && quotation.getIssuedAt() == null) {
            quotation.setIssuedAt(Instant.now());
        }

        Quotation updated = quotationRepository.save(quotation);
        log.info("Quotation ID [{}] status updated from [{}] to [{}]", id, currentStatus, targetStatus);
        return mapToResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] generateQuotationPdf(Long id, String userEmail) {
        User user = getUserOrThrow(userEmail);
        Quotation quotation = quotationRepository.findByIdWithItemsAndProject(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quotation not found with ID: " + id));

        validateProjectOwnership(quotation.getProject(), user);

        return pdfGenerationService.generateQuotationPdf(quotation);
    }

    private String generateUniqueQuotationNumber(long sequence) {
        String yearMonth = LocalDate.now().format(QUOTE_MONTH_FMT);
        String candidate = String.format("KC-QT-%s-%04d", yearMonth, sequence);

        if (!quotationRepository.existsByQuotationNumber(candidate)) {
            return candidate;
        }

        // Collision safety fallback with random suffix
        String randomSuffix = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        return String.format("KC-QT-%s-%04d-%s", yearMonth, sequence, randomSuffix);
    }

    private User getUserOrThrow(String email) {
        return userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    private void validateProjectOwnership(Project project, User user) {
        if (!project.getOwner().getId().equals(user.getId())) {
            log.warn("Access denied: User ID [{}] attempted to access Project ID [{}] owned by User ID [{}]",
                    user.getId(), project.getId(), project.getOwner().getId());
            throw new AccessDeniedException("You do not have permission to access quotations for this project");
        }
    }

    private QuotationResponse mapToResponse(Quotation q) {
        List<QuotationItemResponse> itemResponses = q.getItems() != null
                ? q.getItems().stream().map(this::mapItemToResponse).toList()
                : List.of();

        return QuotationResponse.builder()
                .id(q.getId())
                .quotationNumber(q.getQuotationNumber())
                .projectId(q.getProject().getId())
                .projectName(q.getProject().getName())
                .designId(q.getDesign().getId())
                .designName(q.getDesign().getName())
                .version(q.getVersion())
                .status(q.getStatus())
                .clientName(q.getClientName())
                .clientEmail(q.getClientEmail())
                .clientPhone(q.getClientPhone())
                .carcassMaterialSnapshot(q.getCarcassMaterialSnapshot())
                .shutterMaterialSnapshot(q.getShutterMaterialSnapshot())
                .countertopMaterialSnapshot(q.getCountertopMaterialSnapshot())
                .materialSubtotal(q.getMaterialSubtotal())
                .wastagePercentage(q.getWastagePercentage())
                .wastageAmount(q.getWastageAmount())
                .laborPercentage(q.getLaborPercentage())
                .laborAmount(q.getLaborAmount())
                .installationPercentage(q.getInstallationPercentage())
                .installationAmount(q.getInstallationAmount())
                .grossSubtotal(q.getGrossSubtotal())
                .discountPercentage(q.getDiscountPercentage())
                .discountAmount(q.getDiscountAmount())
                .netTaxableAmount(q.getNetTaxableAmount())
                .taxPercentage(q.getTaxPercentage())
                .taxAmount(q.getTaxAmount())
                .finalTotal(q.getFinalTotal())
                .validUntil(q.getValidUntil())
                .issuedAt(q.getIssuedAt())
                .notes(q.getNotes())
                .items(itemResponses)
                .createdAt(q.getCreatedAt())
                .updatedAt(q.getUpdatedAt())
                .build();
    }

    private QuotationItemResponse mapItemToResponse(QuotationItem item) {
        return QuotationItemResponse.builder()
                .id(item.getId())
                .itemDescription(item.getItemDescription())
                .category(item.getCategory())
                .quantity(item.getQuantity())
                .unit(item.getUnit())
                .unitPrice(item.getUnitPrice())
                .totalPrice(item.getTotalPrice())
                .calculationNotes(item.getCalculationNotes())
                .sortOrder(item.getSortOrder())
                .build();
    }

    private QuotationSummaryResponse mapToSummaryResponse(Quotation q) {
        return QuotationSummaryResponse.builder()
                .id(q.getId())
                .quotationNumber(q.getQuotationNumber())
                .projectId(q.getProject().getId())
                .designId(q.getDesign().getId())
                .designName(q.getDesign().getName())
                .version(q.getVersion())
                .status(q.getStatus())
                .clientName(q.getClientName())
                .materialSubtotal(q.getMaterialSubtotal())
                .netTaxableAmount(q.getNetTaxableAmount())
                .taxAmount(q.getTaxAmount())
                .finalTotal(q.getFinalTotal())
                .itemCount(q.getItems() != null ? q.getItems().size() : 0)
                .validUntil(q.getValidUntil())
                .issuedAt(q.getIssuedAt())
                .createdAt(q.getCreatedAt())
                .build();
    }
}
