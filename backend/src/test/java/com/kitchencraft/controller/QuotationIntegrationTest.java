package com.kitchencraft.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kitchencraft.dto.request.CabinetRequest;
import com.kitchencraft.dto.request.CreateDesignRequest;
import com.kitchencraft.dto.request.CreateProjectRequest;
import com.kitchencraft.dto.request.CreateQuotationRequest;
import com.kitchencraft.dto.request.UpdateQuotationStatusRequest;
import com.kitchencraft.entity.CabinetType;
import com.kitchencraft.entity.LayoutType;
import com.kitchencraft.entity.QuotationStatus;
import com.kitchencraft.entity.Role;
import com.kitchencraft.entity.User;
import com.kitchencraft.repository.DesignCabinetRepository;
import com.kitchencraft.repository.DesignRepository;
import com.kitchencraft.repository.ProjectRepository;
import com.kitchencraft.repository.QuotationRepository;
import com.kitchencraft.repository.UserRepository;
import com.kitchencraft.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class QuotationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private DesignRepository designRepository;

    @Autowired
    private DesignCabinetRepository cabinetRepository;

    @Autowired
    private QuotationRepository quotationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private User owner;
    private String ownerToken;

    private User intruder;
    private String intruderToken;

    private Long projectId;
    private Long designId;

    @BeforeEach
    void setUp() throws Exception {
        quotationRepository.deleteAll();
        cabinetRepository.deleteAll();
        designRepository.deleteAll();
        projectRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Owner Setup
        owner = User.builder()
                .fullName("Contractor Admin")
                .email("contractor@kitchencraft.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(Role.ROLE_USER)
                .build();
        userRepository.save(owner);
        ownerToken = "Bearer " + jwtService.generateToken(owner);

        // 2. Intruder Setup
        intruder = User.builder()
                .fullName("Intruder Spy")
                .email("spy@othercraft.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(Role.ROLE_USER)
                .build();
        userRepository.save(intruder);
        intruderToken = "Bearer " + jwtService.generateToken(intruder);

        // 3. Create Project via MockMvc
        CreateProjectRequest projectReq = CreateProjectRequest.builder()
                .name("Kharghar Skyline Penthouse")
                .clientName("Siddharth Roy")
                .clientPhone("+91 91234 56789")
                .build();

        MvcResult projResult = mockMvc.perform(post("/api/v1/projects")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(projectReq)))
                .andExpect(status().isCreated())
                .andReturn();

        projectId = objectMapper.readTree(projResult.getResponse().getContentAsString()).get("id").asLong();

        // 4. Create Design
        CreateDesignRequest designReq = CreateDesignRequest.builder()
                .name("Modern Parallel Kitchen")
                .roomWidthMm(4500)
                .roomLengthMm(3200)
                .roomHeightMm(2750)
                .layoutType(LayoutType.PARALLEL)
                .build();

        MvcResult designResult = mockMvc.perform(post("/api/v1/projects/" + projectId + "/designs")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(designReq)))
                .andExpect(status().isCreated())
                .andReturn();

        designId = objectMapper.readTree(designResult.getResponse().getContentAsString()).get("id").asLong();

        // 5. Add Cabinets to Design
        CabinetRequest baseCab = CabinetRequest.builder()
                .cabinetType(CabinetType.BASE)
                .widthMm(600)
                .depthMm(600)
                .heightMm(870)
                .posX(0.0)
                .posY(0.0)
                .build();

        mockMvc.perform(post("/api/v1/designs/" + designId + "/cabinets")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(baseCab)))
                .andExpect(status().isCreated());

        CabinetRequest sinkCab = CabinetRequest.builder()
                .cabinetType(CabinetType.SINK_BASE)
                .widthMm(800)
                .depthMm(600)
                .heightMm(870)
                .posX(600.0)
                .posY(0.0)
                .build();

        mockMvc.perform(post("/api/v1/designs/" + designId + "/cabinets")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sinkCab)))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("Complete Quotation Lifecycle: Create, List, Detail, Status Update, and PDF Download")
    void testFullQuotationLifecycle() throws Exception {
        // Step 1: Create Quotation Snapshot
        CreateQuotationRequest quoteReq = CreateQuotationRequest.builder()
                .clientEmail("siddharth.roy@example.com")
                .clientPhone("+91 91234 56789")
                .notes("Special launch offer with complimentary sink install")
                .validDays(30)
                .issueImmediately(false)
                .build();

        MvcResult createResult = mockMvc.perform(post("/api/v1/designs/" + designId + "/quotations")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(quoteReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.quotationNumber", startsWith("KC-QT-")))
                .andExpect(jsonPath("$.status", is("DRAFT")))
                .andExpect(jsonPath("$.clientName", is("Siddharth Roy")))
                .andExpect(jsonPath("$.materialSubtotal", greaterThan(0.0)))
                .andExpect(jsonPath("$.grossSubtotal", greaterThan(0.0)))
                .andExpect(jsonPath("$.finalTotal", greaterThan(0.0)))
                .andExpect(jsonPath("$.items", hasSize(greaterThanOrEqualTo(3))))
                .andReturn();

        Long quoteId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

        // Step 2: List Project Quotations
        mockMvc.perform(get("/api/v1/projects/" + projectId + "/quotations")
                        .header("Authorization", ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id", is(quoteId.intValue())))
                .andExpect(jsonPath("$[0].status", is("DRAFT")));

        // Step 3: Get Detailed Quotation
        mockMvc.perform(get("/api/v1/quotations/" + quoteId)
                        .header("Authorization", ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(quoteId.intValue())))
                .andExpect(jsonPath("$.items", hasSize(greaterThanOrEqualTo(3))))
                .andExpect(jsonPath("$.notes", containsString("Special launch offer")));

        // Step 4: Update Status (DRAFT -> ISSUED)
        UpdateQuotationStatusRequest updateReq = UpdateQuotationStatusRequest.builder()
                .status(QuotationStatus.ISSUED)
                .build();

        mockMvc.perform(patch("/api/v1/quotations/" + quoteId + "/status")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("ISSUED")))
                .andExpect(jsonPath("$.issuedAt").isNotEmpty());

        // Step 5: Download PDF
        MvcResult pdfResult = mockMvc.perform(get("/api/v1/quotations/" + quoteId + "/pdf")
                        .header("Authorization", ownerToken))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(header().string("Content-Disposition", containsString("attachment; filename=\"KitchenCraft-Quotation-")))
                .andReturn();

        byte[] pdfBytes = pdfResult.getResponse().getContentAsByteArray();
        assertThat(pdfBytes).isNotEmpty();
        assertThat(pdfBytes.length).isGreaterThan(1000);

        String pdfHeader = new String(pdfBytes, 0, 5, StandardCharsets.US_ASCII);
        assertThat(pdfHeader).isEqualTo("%PDF-");

        // Step 6: Security Verification - Intruder Access Denied
        mockMvc.perform(get("/api/v1/quotations/" + quoteId)
                        .header("Authorization", intruderToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/quotations/" + quoteId + "/pdf")
                        .header("Authorization", intruderToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/projects/" + projectId + "/quotations")
                        .header("Authorization", intruderToken))
                .andExpect(status().isForbidden());
    }
}
