package com.kitchencraft.service;

import com.kitchencraft.dto.request.CreateQuotationRequest;
import com.kitchencraft.dto.request.EstimateRequest;
import com.kitchencraft.dto.request.UpdateQuotationStatusRequest;
import com.kitchencraft.dto.response.CostEstimateResponse;
import com.kitchencraft.dto.response.ItemizedCostResponse;
import com.kitchencraft.dto.response.QuotationResponse;
import com.kitchencraft.entity.*;
import com.kitchencraft.repository.DesignRepository;
import com.kitchencraft.repository.ProjectRepository;
import com.kitchencraft.repository.QuotationRepository;
import com.kitchencraft.repository.UserRepository;
import com.kitchencraft.service.impl.PdfGenerationServiceImpl;
import com.kitchencraft.service.impl.QuotationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class QuotationServiceTest {

    @Mock
    private QuotationRepository quotationRepository;

    @Mock
    private DesignRepository designRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CostEstimationService costEstimationService;

    @Spy
    private PdfGenerationServiceImpl pdfGenerationService = new PdfGenerationServiceImpl();

    @InjectMocks
    private QuotationServiceImpl quotationService;

    private User testUser;
    private Project testProject;
    private Design testDesign;
    private CostEstimateResponse mockEstimate;

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
                .name("Mehta Luxury Residence")
                .clientName("Aarav Mehta")
                .build();

        testDesign = Design.builder()
                .id(100L)
                .project(testProject)
                .version(1)
                .name("Modern Island Layout")
                .roomWidthMm(5000)
                .roomLengthMm(4000)
                .roomHeightMm(2800)
                .cabinets(new ArrayList<>())
                .build();

        List<ItemizedCostResponse> lineItems = List.of(
                ItemizedCostResponse.builder()
                        .itemDescription("Carcass Panels: HDHMR Board 18mm")
                        .category("CARCASS")
                        .quantity(new BigDecimal("120.5000"))
                        .unit("SQFT")
                        .unitPrice(new BigDecimal("155.00"))
                        .totalCost(new BigDecimal("18677.50"))
                        .calculationDetails("Box panels (sides, top, bottom, back, shelf)")
                        .build(),
                ItemizedCostResponse.builder()
                        .itemDescription("Shutters: High Gloss Acrylic Sheet")
                        .category("SHUTTER")
                        .quantity(new BigDecimal("45.2000"))
                        .unit("SQFT")
                        .unitPrice(new BigDecimal("260.00"))
                        .totalCost(new BigDecimal("11752.00"))
                        .calculationDetails("Facial area with 2mm edge banding")
                        .build(),
                ItemizedCostResponse.builder()
                        .itemDescription("Countertop: Black Galaxy Granite (18mm)")
                        .category("COUNTERTOP")
                        .quantity(new BigDecimal("28.0000"))
                        .unit("SQFT")
                        .unitPrice(new BigDecimal("220.00"))
                        .totalCost(new BigDecimal("6160.00"))
                        .calculationDetails("Base surface + 20mm drip edge")
                        .build(),
                ItemizedCostResponse.builder()
                        .itemDescription("Soft-Close Concealed Hinges (Pair)")
                        .category("HARDWARE")
                        .quantity(new BigDecimal("8.0000"))
                        .unit("PAIR")
                        .unitPrice(new BigDecimal("320.00"))
                        .totalCost(new BigDecimal("2560.00"))
                        .calculationDetails("8 pairs 3D clip-on hinges")
                        .build()
        );

        mockEstimate = CostEstimateResponse.builder()
                .designId(100L)
                .designName("Modern Island Layout")
                .version(1)
                .totalCabinetCount(6)
                .carcassSubtotal(new BigDecimal("18677.50"))
                .shutterSubtotal(new BigDecimal("11752.00"))
                .countertopSubtotal(new BigDecimal("6160.00"))
                .hardwareSubtotal(new BigDecimal("2560.00"))
                .materialTotal(new BigDecimal("39149.50"))
                .wastagePercentage(new BigDecimal("10.00"))
                .wastageAmount(new BigDecimal("3914.95"))
                .laborPercentage(new BigDecimal("15.00"))
                .laborAmount(new BigDecimal("5872.43"))
                .installationPercentage(new BigDecimal("5.00"))
                .installationAmount(new BigDecimal("1957.48"))
                .grossSubtotal(new BigDecimal("50894.36"))
                .discountPercentage(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .netTaxableAmount(new BigDecimal("50894.36"))
                .taxPercentage(new BigDecimal("18.00"))
                .taxAmount(new BigDecimal("9160.98"))
                .grandTotal(new BigDecimal("60055.34"))
                .lineItems(lineItems)
                .quantityAssumptions(List.of("Tested snapshot rule"))
                .build();
    }

    @Test
    @DisplayName("Should create persistent quotation snapshot with itemized lines and frozen prices")
    void shouldCreateQuotationSnapshot() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(designRepository.findById(100L)).thenReturn(Optional.of(testDesign));
        when(costEstimationService.calculateEstimate(eq(100L), any(EstimateRequest.class), eq(testUser.getEmail())))
                .thenReturn(mockEstimate);
        when(quotationRepository.countByProjectId(10L)).thenReturn(0L);
        when(quotationRepository.save(any(Quotation.class))).thenAnswer(inv -> {
            Quotation q = inv.getArgument(0);
            q.setId(500L);
            q.setCreatedAt(Instant.now());
            return q;
        });

        CreateQuotationRequest request = CreateQuotationRequest.builder()
                .clientEmail("aarav.mehta@example.com")
                .clientPhone("+91 98765 43210")
                .notes("Standard 5-year hardware warranty")
                .validDays(45)
                .issueImmediately(false)
                .build();

        QuotationResponse response = quotationService.createQuotation(100L, request, testUser.getEmail());

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(500L);
        assertThat(response.getQuotationNumber()).startsWith("KC-QT-");
        assertThat(response.getStatus()).isEqualTo(QuotationStatus.DRAFT);
        assertThat(response.getClientName()).isEqualTo("Aarav Mehta");
        assertThat(response.getClientEmail()).isEqualTo("aarav.mehta@example.com");

        // Verify frozen financial snapshots
        assertThat(response.getMaterialSubtotal()).isEqualByComparingTo(new BigDecimal("39149.50"));
        assertThat(response.getGrossSubtotal()).isEqualByComparingTo(new BigDecimal("50894.36"));
        assertThat(response.getFinalTotal()).isEqualByComparingTo(new BigDecimal("60055.34"));

        // Verify line items snapshot
        assertThat(response.getItems()).hasSize(4);
        assertThat(response.getItems().get(0).getItemDescription()).contains("HDHMR Board 18mm");
        assertThat(response.getItems().get(0).getUnitPrice()).isEqualByComparingTo(new BigDecimal("155.00"));
        assertThat(response.getItems().get(0).getTotalPrice()).isEqualByComparingTo(new BigDecimal("18677.50"));

        verify(quotationRepository, times(1)).save(any(Quotation.class));
    }

    @Test
    @DisplayName("Should reject quotation creation when user does not own project")
    void shouldRejectWhenUserNotOwner() {
        User unauthorizedUser = User.builder()
                .id(999L)
                .email("intruder@example.com")
                .role(Role.ROLE_USER)
                .build();

        when(userRepository.findByEmail("intruder@example.com")).thenReturn(Optional.of(unauthorizedUser));
        when(designRepository.findById(100L)).thenReturn(Optional.of(testDesign));

        CreateQuotationRequest request = new CreateQuotationRequest();

        assertThatThrownBy(() -> quotationService.createQuotation(100L, request, "intruder@example.com"))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("permission to access quotations");
    }

    @Test
    @DisplayName("Should preserve historical quotation values even if catalogue prices change later")
    void shouldPreserveHistoricalQuotationValues() {
        // Build an existing saved quotation in database with historical prices
        Quotation historicalQuote = Quotation.builder()
                .id(200L)
                .quotationNumber("KC-QT-202610-0001")
                .project(testProject)
                .design(testDesign)
                .version(1)
                .status(QuotationStatus.ISSUED)
                .clientName("Aarav Mehta")
                .materialSubtotal(new BigDecimal("30000.00")) // Historical rate
                .wastagePercentage(new BigDecimal("10.00"))
                .wastageAmount(new BigDecimal("3000.00"))
                .laborPercentage(new BigDecimal("15.00"))
                .laborAmount(new BigDecimal("4500.00"))
                .installationPercentage(new BigDecimal("5.00"))
                .installationAmount(new BigDecimal("1500.00"))
                .grossSubtotal(new BigDecimal("39000.00"))
                .discountPercentage(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .netTaxableAmount(new BigDecimal("39000.00"))
                .taxPercentage(new BigDecimal("18.00"))
                .taxAmount(new BigDecimal("7020.00"))
                .finalTotal(new BigDecimal("46020.00"))
                .validUntil(LocalDate.now().plusDays(20))
                .issuedAt(Instant.now())
                .items(new ArrayList<>())
                .build();

        historicalQuote.addItem(QuotationItem.builder()
                .itemDescription("BWR Plywood (IS 303)")
                .category("CARCASS")
                .quantity(new BigDecimal("100.00"))
                .unit("SQFT")
                .unitPrice(new BigDecimal("140.00")) // Historical unit price
                .totalPrice(new BigDecimal("14000.00"))
                .build());

        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(quotationRepository.findByIdWithItemsAndProject(200L)).thenReturn(Optional.of(historicalQuote));

        // When retrieved later (even if catalogue prices for BWR plywood increased to 200/sqft)
        QuotationResponse retrieved = quotationService.getQuotationById(200L, testUser.getEmail());

        // Then: Values must stay strictly at the snapshotted historical values
        assertThat(retrieved.getFinalTotal()).isEqualByComparingTo(new BigDecimal("46020.00"));
        assertThat(retrieved.getItems().get(0).getUnitPrice()).isEqualByComparingTo(new BigDecimal("140.00"));
        assertThat(retrieved.getItems().get(0).getTotalPrice()).isEqualByComparingTo(new BigDecimal("14000.00"));
        // Cost estimation service must NOT be called when reading historical quote
        verifyNoInteractions(costEstimationService);
    }

    @Test
    @DisplayName("Should successfully transition status from DRAFT to ISSUED and then to CANCELLED")
    void shouldTransitionStatusesCorrectly() {
        Quotation quote = Quotation.builder()
                .id(300L)
                .quotationNumber("KC-QT-202611-0005")
                .project(testProject)
                .design(testDesign)
                .status(QuotationStatus.DRAFT)
                .items(new ArrayList<>())
                .build();

        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(quotationRepository.findByIdWithItemsAndProject(300L)).thenReturn(Optional.of(quote));
        when(quotationRepository.save(any(Quotation.class))).thenAnswer(inv -> inv.getArgument(0));

        // 1. Transition DRAFT -> ISSUED
        QuotationResponse issuedResponse = quotationService.updateQuotationStatus(
                300L,
                UpdateQuotationStatusRequest.builder().status(QuotationStatus.ISSUED).build(),
                testUser.getEmail()
        );
        assertThat(issuedResponse.getStatus()).isEqualTo(QuotationStatus.ISSUED);
        assertThat(issuedResponse.getIssuedAt()).isNotNull();

        // 2. Transition ISSUED -> CANCELLED
        QuotationResponse cancelledResponse = quotationService.updateQuotationStatus(
                300L,
                UpdateQuotationStatusRequest.builder().status(QuotationStatus.CANCELLED).build(),
                testUser.getEmail()
        );
        assertThat(cancelledResponse.getStatus()).isEqualTo(QuotationStatus.CANCELLED);
    }

    @Test
    @DisplayName("Should reject illegal status transition from CANCELLED to ISSUED")
    void shouldRejectIllegalStatusTransition() {
        Quotation cancelledQuote = Quotation.builder()
                .id(400L)
                .quotationNumber("KC-QT-202611-0006")
                .project(testProject)
                .design(testDesign)
                .status(QuotationStatus.CANCELLED)
                .items(new ArrayList<>())
                .build();

        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(quotationRepository.findByIdWithItemsAndProject(400L)).thenReturn(Optional.of(cancelledQuote));

        UpdateQuotationStatusRequest request = UpdateQuotationStatusRequest.builder()
                .status(QuotationStatus.ISSUED)
                .build();

        assertThatThrownBy(() -> quotationService.updateQuotationStatus(400L, request, testUser.getEmail()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid status transition from 'CANCELLED' to 'ISSUED'");
    }

    @Test
    @DisplayName("Should generate valid binary PDF with magic header %PDF-")
    void shouldGenerateValidPdfDocument() {
        Quotation quotation = Quotation.builder()
                .id(101L)
                .quotationNumber("KC-QT-202611-0088")
                .project(testProject)
                .design(testDesign)
                .version(1)
                .status(QuotationStatus.ISSUED)
                .clientName("Aarav Mehta")
                .clientEmail("aarav@example.com")
                .clientPhone("+91 99999 88888")
                .carcassMaterialSnapshot("HDHMR Board 18mm")
                .shutterMaterialSnapshot("High Gloss Acrylic Sheet")
                .countertopMaterialSnapshot("Black Galaxy Granite")
                .materialSubtotal(new BigDecimal("35000.00"))
                .wastagePercentage(new BigDecimal("10.00"))
                .wastageAmount(new BigDecimal("3500.00"))
                .laborPercentage(new BigDecimal("15.00"))
                .laborAmount(new BigDecimal("5250.00"))
                .installationPercentage(new BigDecimal("5.00"))
                .installationAmount(new BigDecimal("1750.00"))
                .grossSubtotal(new BigDecimal("45500.00"))
                .discountPercentage(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .netTaxableAmount(new BigDecimal("45500.00"))
                .taxPercentage(new BigDecimal("18.00"))
                .taxAmount(new BigDecimal("8190.00"))
                .finalTotal(new BigDecimal("53690.00"))
                .validUntil(LocalDate.now().plusDays(30))
                .issuedAt(Instant.now())
                .notes("Delivered within 21 business days")
                .items(new ArrayList<>())
                .build();

        quotation.addItem(QuotationItem.builder()
                .id(1L)
                .itemDescription("HDHMR Carcass Box")
                .category("CARCASS")
                .quantity(new BigDecimal("85.0000"))
                .unit("SQFT")
                .unitPrice(new BigDecimal("155.00"))
                .totalPrice(new BigDecimal("13175.00"))
                .calculationNotes("Tested carcass panel area")
                .sortOrder(1)
                .build());

        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(quotationRepository.findByIdWithItemsAndProject(101L)).thenReturn(Optional.of(quotation));

        byte[] pdfBytes = quotationService.generateQuotationPdf(101L, testUser.getEmail());

        assertThat(pdfBytes).isNotNull();
        assertThat(pdfBytes.length).isGreaterThan(1000);

        // Verify PDF Magic Bytes ("%PDF-")
        String header = new String(pdfBytes, 0, 5, StandardCharsets.US_ASCII);
        assertThat(header).isEqualTo("%PDF-");
    }
}
