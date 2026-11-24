package com.kitchencraft.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kitchencraft.dto.request.*;
import com.kitchencraft.entity.CabinetType;
import com.kitchencraft.entity.Material;
import com.kitchencraft.entity.MaterialCategory;
import com.kitchencraft.entity.MaterialUnit;
import com.kitchencraft.repository.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class FullPlatformEndToEndIntegrationTest {

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
    private MaterialRepository materialRepository;

    @Autowired
    private QuotationRepository quotationRepository;

    private Long carcassMatId;
    private Long shutterMatId;
    private Long countertopMatId;

    @BeforeEach
    void setUp() {
        cleanDatabase();

        // Seed materials for cost estimation
        Material carcass = materialRepository.save(Material.builder()
                .name("Action Tesa HDHMR 18mm")
                .category(MaterialCategory.CARCASS)
                .unit(MaterialUnit.SQFT)
                .unitPrice(new BigDecimal("155.00"))
                .active(true)
                .build());
        carcassMatId = carcass.getId();

        Material shutter = materialRepository.save(Material.builder()
                .name("High Gloss Acrylic 18mm")
                .category(MaterialCategory.SHUTTER)
                .unit(MaterialUnit.SQFT)
                .unitPrice(new BigDecimal("210.00"))
                .active(true)
                .build());
        shutterMatId = shutter.getId();

        Material countertop = materialRepository.save(Material.builder()
                .name("Black Galaxy Granite")
                .category(MaterialCategory.COUNTERTOP)
                .unit(MaterialUnit.SQFT)
                .unitPrice(new BigDecimal("280.00"))
                .active(true)
                .build());
        countertopMatId = countertop.getId();
    }

    @Test
    @DisplayName("Complete End-to-End User Journey: Register -> Design -> Estimate -> Quotation -> PDF -> Multi-Tenant Security Check")
    void executeFullPlatformLifecycle() throws Exception {
        // Step 1: Register User A
        RegisterRequest registerReq = new RegisterRequest();
        registerReq.setFullName("Master Designer");
        registerReq.setEmail("designer.master@kitchencraft.com");
        registerReq.setPassword("SecurePass123!");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.email", is("designer.master@kitchencraft.com")));

        // Step 2: Login User A and extract JWT
        LoginRequest loginReq = new LoginRequest();
        loginReq.setEmail("designer.master@kitchencraft.com");
        loginReq.setPassword("SecurePass123!");

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andReturn();

        String tokenJson = loginResult.getResponse().getContentAsString();
        JsonNode loginNode = objectMapper.readTree(tokenJson);
        String userAToken = "Bearer " + loginNode.get("token").asText();

        // Step 3: Create Project
        CreateProjectRequest projectReq = new CreateProjectRequest();
        projectReq.setName("Skyline Luxury Penthouse Kitchen");
        projectReq.setClientName("Vikram Singhania");
        projectReq.setClientEmail("vikram@singhaniagroup.com");
        projectReq.setClientPhone("+919876543210");
        projectReq.setClientAddress("42nd Floor, Imperial Towers, Mumbai");

        MvcResult projectResult = mockMvc.perform(post("/api/v1/projects")
                        .header("Authorization", userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(projectReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.name", is("Skyline Luxury Penthouse Kitchen")))
                .andReturn();

        Long projectId = objectMapper.readTree(projectResult.getResponse().getContentAsString()).get("id").asLong();

        // Step 4: Create Versioned Design with Room Dimensions
        CreateDesignRequest designReq = new CreateDesignRequest();
        designReq.setName("Contemporary Island Concept");
        designReq.setRoomWidthMm(5000);
        designReq.setRoomLengthMm(4000);
        designReq.setRoomHeightMm(2800);

        MvcResult designResult = mockMvc.perform(post("/api/v1/projects/" + projectId + "/designs")
                        .header("Authorization", userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(designReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.version", is(1)))
                .andExpect(jsonPath("$.roomWidthMm", is(5000)))
                .andReturn();

        Long designId = objectMapper.readTree(designResult.getResponse().getContentAsString()).get("id").asLong();

        // Step 5: Add Cabinets in 2D (Base, Wall, Tall)
        CabinetRequest baseCab = new CabinetRequest();
        baseCab.setCabinetType(CabinetType.BASE);
        baseCab.setPosX(0.0);
        baseCab.setPosY(0.0);
        baseCab.setPosZ(0.0);
        baseCab.setWidthMm(600);
        baseCab.setDepthMm(600);
        baseCab.setHeightMm(870);

        mockMvc.perform(post("/api/v1/designs/" + designId + "/cabinets")
                        .header("Authorization", userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(baseCab)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.cabinetType", is("BASE")));

        CabinetRequest wallCab = new CabinetRequest();
        wallCab.setCabinetType(CabinetType.WALL);
        wallCab.setPosX(0.0);
        wallCab.setPosY(0.0);
        wallCab.setPosZ(1450.0);
        wallCab.setWidthMm(600);
        wallCab.setDepthMm(350);
        wallCab.setHeightMm(720);

        mockMvc.perform(post("/api/v1/designs/" + designId + "/cabinets")
                        .header("Authorization", userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wallCab)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.cabinetType", is("WALL")));

        CabinetRequest tallCab = new CabinetRequest();
        tallCab.setCabinetType(CabinetType.TALL);
        tallCab.setPosX(600.0);
        tallCab.setPosY(0.0);
        tallCab.setPosZ(0.0);
        tallCab.setWidthMm(600);
        tallCab.setDepthMm(600);
        tallCab.setHeightMm(2100);

        mockMvc.perform(post("/api/v1/designs/" + designId + "/cabinets")
                        .header("Authorization", userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(tallCab)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.cabinetType", is("TALL")));

        // Step 6: Reload Design from Backend and verify arrangement
        mockMvc.perform(get("/api/v1/designs/" + designId)
                        .header("Authorization", userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(designId.intValue())))
                .andExpect(jsonPath("$.cabinets", hasSize(3)))
                .andExpect(jsonPath("$.cabinets[0].cabinetType", is("BASE")))
                .andExpect(jsonPath("$.cabinets[1].cabinetType", is("WALL")))
                .andExpect(jsonPath("$.cabinets[2].cabinetType", is("TALL")));

        // Step 7: Calculate Cost Estimate with Authorized Materials
        EstimateRequest estimateReq = new EstimateRequest();
        estimateReq.setCarcassMaterialId(carcassMatId);
        estimateReq.setShutterMaterialId(shutterMatId);
        estimateReq.setCountertopMaterialId(countertopMatId);
        estimateReq.setWastagePercentage(new BigDecimal("10.0"));
        estimateReq.setLaborPercentage(new BigDecimal("15.0"));
        estimateReq.setInstallationPercentage(new BigDecimal("5.0"));
        estimateReq.setDiscountPercentage(new BigDecimal("5.0"));
        estimateReq.setTaxPercentage(new BigDecimal("18.0"));

        mockMvc.perform(post("/api/v1/designs/" + designId + "/estimate")
                        .header("Authorization", userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(estimateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalCabinetCount", is(3)))
                .andExpect(jsonPath("$.carcassSubtotal", greaterThan(0.0)))
                .andExpect(jsonPath("$.shutterSubtotal", greaterThan(0.0)))
                .andExpect(jsonPath("$.countertopSubtotal", greaterThan(0.0)))
                .andExpect(jsonPath("$.hardwareSubtotal", greaterThan(0.0)))
                .andExpect(jsonPath("$.grandTotal", greaterThan(0.0)))
                .andExpect(jsonPath("$.lineItems", hasSize(greaterThan(0))));

        // Step 8: Side-by-Side Package Comparison
        EstimateComparisonRequest compareReq = new EstimateComparisonRequest();
        compareReq.setOptionA(estimateReq);
        compareReq.setOptionB(estimateReq);

        mockMvc.perform(post("/api/v1/designs/" + designId + "/estimate/compare")
                        .header("Authorization", userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(compareReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estimateA.grandTotal", greaterThan(0.0)))
                .andExpect(jsonPath("$.estimateB.grandTotal", greaterThan(0.0)));

        // Step 9: Create Quotation Snapshot
        CreateQuotationRequest quoteReq = new CreateQuotationRequest();
        quoteReq.setEstimateRequest(estimateReq);
        quoteReq.setClientName("Vikram Singhania");
        quoteReq.setClientEmail("vikram@singhaniagroup.com");
        quoteReq.setClientPhone("+919876543210");
        quoteReq.setNotes("Executive Master Kitchen quotation with premium hardware package");
        quoteReq.setValidDays(30);
        quoteReq.setIssueImmediately(false);

        MvcResult quoteResult = mockMvc.perform(post("/api/v1/designs/" + designId + "/quotations")
                        .header("Authorization", userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(quoteReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.quotationNumber", startsWith("KC-QT-")))
                .andExpect(jsonPath("$.status", is("DRAFT")))
                .andExpect(jsonPath("$.finalTotal", greaterThan(0.0)))
                .andExpect(jsonPath("$.items", hasSize(greaterThan(0))))
                .andReturn();

        Long quotationId = objectMapper.readTree(quoteResult.getResponse().getContentAsString()).get("id").asLong();

        // Step 10: Download and Verify Quotation PDF
        MvcResult pdfResult = mockMvc.perform(get("/api/v1/quotations/" + quotationId + "/pdf")
                        .header("Authorization", userAToken))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", is("application/pdf")))
                .andExpect(header().string("Content-Disposition", containsString("attachment; filename=\"KitchenCraft-Quotation-")))
                .andReturn();

        byte[] pdfBytes = pdfResult.getResponse().getContentAsByteArray();
        assertTrue(pdfBytes.length > 500, "Generated PDF must contain valid binary content");
        String pdfHeader = new String(pdfBytes, 0, Math.min(pdfBytes.length, 5));
        assertEquals("%PDF-", pdfHeader, "PDF binary must begin with standard magic bytes %PDF-");

        // Step 11: Multi-Tenant Boundary Check (Unauthorized User B)
        RegisterRequest registerB = new RegisterRequest();
        registerB.setFullName("Intruder Designer");
        registerB.setEmail("intruder@competitor.com");
        registerB.setPassword("IntruderPass999!");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerB)))
                .andExpect(status().isCreated());

        LoginRequest loginB = new LoginRequest();
        loginB.setEmail("intruder@competitor.com");
        loginB.setPassword("IntruderPass999!");

        MvcResult loginBResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginB)))
                .andExpect(status().isOk())
                .andReturn();

        String userBToken = "Bearer " + objectMapper.readTree(loginBResult.getResponse().getContentAsString()).get("token").asText();

        // Verify User B cannot access User A's project
        mockMvc.perform(get("/api/v1/projects/" + projectId)
                        .header("Authorization", userBToken))
                .andExpect(status().isForbidden());

        // Verify User B cannot access User A's design
        mockMvc.perform(get("/api/v1/designs/" + designId)
                        .header("Authorization", userBToken))
                .andExpect(status().isForbidden());

        // Verify User B cannot generate estimate for User A's design
        mockMvc.perform(post("/api/v1/designs/" + designId + "/estimate")
                        .header("Authorization", userBToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(estimateReq)))
                .andExpect(status().isForbidden());

        // Verify User B cannot view User A's quotation
        mockMvc.perform(get("/api/v1/quotations/" + quotationId)
                        .header("Authorization", userBToken))
                .andExpect(status().isForbidden());

        // Verify User B cannot download User A's quotation PDF
        mockMvc.perform(get("/api/v1/quotations/" + quotationId + "/pdf")
                        .header("Authorization", userBToken))
                .andExpect(status().isForbidden());
    }

    @AfterEach
    void tearDown() {
        cleanDatabase();
    }

    private void cleanDatabase() {
        quotationRepository.deleteAll();
        cabinetRepository.deleteAll();
        designRepository.deleteAll();
        projectRepository.deleteAll();
        materialRepository.deleteAll();
        userRepository.deleteAll();
    }
}
