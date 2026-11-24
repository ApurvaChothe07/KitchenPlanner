package com.kitchencraft.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kitchencraft.dto.request.*;
import com.kitchencraft.entity.*;
import com.kitchencraft.repository.*;
import com.kitchencraft.security.JwtService;
import org.junit.jupiter.api.AfterEach;
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

import java.math.BigDecimal;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MaterialAndEstimateIntegrationTest {

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

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private User owner;
    private String ownerToken;

    private User intruder;
    private String intruderToken;

    private Long designId;
    private Long materialId;

    @BeforeEach
    void setUp() throws Exception {
        cleanDatabase();

        // 1. Users
        owner = User.builder()
                .fullName("Designer Alice")
                .email("alice@kitchencraft.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(Role.ROLE_USER)
                .build();
        userRepository.save(owner);
        ownerToken = "Bearer " + jwtService.generateToken(owner);

        intruder = User.builder()
                .fullName("Intruder Bob")
                .email("bob@kitchencraft.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(Role.ROLE_USER)
                .build();
        userRepository.save(intruder);
        intruderToken = "Bearer " + jwtService.generateToken(intruder);

        // 2. Seed Baseline Material
        Material mat = Material.builder()
                .name("HDHMR Board 18mm")
                .category(MaterialCategory.CARCASS)
                .unit(MaterialUnit.SQFT)
                .unitPrice(new BigDecimal("155.00"))
                .active(true)
                .description("Action TESA moisture resistant board")
                .build();
        materialRepository.save(mat);
        materialId = mat.getId();

        // 3. Create Project & Design for Owner
        Project project = Project.builder()
                .owner(owner)
                .name("Alice Villa Kitchen")
                .clientName("Rohit Sharma")
                .build();
        projectRepository.save(project);

        Design design = Design.builder()
                .project(project)
                .name("L-Shape Modern")
                .version(1)
                .roomWidthMm(4000)
                .roomLengthMm(3000)
                .roomHeightMm(2700)
                .layoutType(LayoutType.L_SHAPED)
                .build();
        designRepository.save(design);
        designId = design.getId();

        // Add 1 Base Cabinet
        DesignCabinet cabinet = DesignCabinet.builder()
                .design(design)
                .cabinetType(CabinetType.BASE)
                .widthMm(600)
                .depthMm(600)
                .heightMm(870)
                .posX(0.0)
                .posY(0.0)
                .build();
        cabinetRepository.save(cabinet);
    }

    // =========================================================================
    // MATERIAL CATALOGUE TESTS
    // =========================================================================

    @Test
    @DisplayName("GET /api/v1/materials - Retrieves list of active materials")
    void testGetAllMaterials() throws Exception {
        mockMvc.perform(get("/api/v1/materials")
                        .header("Authorization", ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].name", is("HDHMR Board 18mm")))
                .andExpect(jsonPath("$[0].category", is("CARCASS")));
    }

    @Test
    @DisplayName("GET /api/v1/materials?category=CARCASS - Filters materials by category")
    void testGetMaterialsByCategory() throws Exception {
        mockMvc.perform(get("/api/v1/materials")
                        .param("category", "CARCASS")
                        .header("Authorization", ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].category", is("CARCASS")));
    }

    @Test
    @DisplayName("GET /api/v1/materials/{id} - Found vs 404 Not Found")
    void testGetMaterialById() throws Exception {
        // Success
        mockMvc.perform(get("/api/v1/materials/" + materialId)
                        .header("Authorization", ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(materialId.intValue())))
                .andExpect(jsonPath("$.unitPrice", is(155.00)));

        // 404 Not Found
        mockMvc.perform(get("/api/v1/materials/999999")
                        .header("Authorization", ownerToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error", is("Not Found")));
    }

    @Test
    @DisplayName("POST /api/v1/materials - Creates new material with validation and duplicate rejection")
    void testCreateMaterial() throws Exception {
        MaterialRequest request = MaterialRequest.builder()
                .name("Super Gloss Acrylic 2mm")
                .category(MaterialCategory.SHUTTER)
                .unit(MaterialUnit.SQFT)
                .unitPrice(new BigDecimal("280.00"))
                .description("Anti-scratch acrylic finish")
                .active(true)
                .build();

        // 1. Success 201 Created
        mockMvc.perform(post("/api/v1/materials")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name", is("Super Gloss Acrylic 2mm")))
                .andExpect(jsonPath("$.unitPrice", is(280.00)));

        // 2. Duplicate rejection 409 Conflict
        mockMvc.perform(post("/api/v1/materials")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error", is("Conflict")));

        // 3. Validation failure (blank name, negative price) 400 Bad Request
        MaterialRequest badRequest = MaterialRequest.builder()
                .name("   ")
                .category(MaterialCategory.SHUTTER)
                .unit(MaterialUnit.SQFT)
                .unitPrice(new BigDecimal("-50.00"))
                .build();

        mockMvc.perform(post("/api/v1/materials")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors.name").exists())
                .andExpect(jsonPath("$.validationErrors.unitPrice").exists());
    }

    @Test
    @DisplayName("PUT /api/v1/materials/{id} - Updates material specifications and unit rate")
    void testUpdateMaterial() throws Exception {
        MaterialRequest updateReq = MaterialRequest.builder()
                .name("HDHMR Board 18mm Premium")
                .category(MaterialCategory.CARCASS)
                .unit(MaterialUnit.SQFT)
                .unitPrice(new BigDecimal("165.00"))
                .active(true)
                .build();

        mockMvc.perform(put("/api/v1/materials/" + materialId)
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("HDHMR Board 18mm Premium")))
                .andExpect(jsonPath("$.unitPrice", is(165.00)));
    }

    // =========================================================================
    // COST ESTIMATION API TESTS
    // =========================================================================

    @Test
    @DisplayName("POST /api/v1/designs/{id}/estimate - Computes validated BOM cost estimate")
    void testCalculateEstimate() throws Exception {
        EstimateRequest request = EstimateRequest.builder()
                .wastagePercentage(new BigDecimal("10.00"))
                .laborPercentage(new BigDecimal("15.00"))
                .installationPercentage(new BigDecimal("5.00"))
                .discountPercentage(new BigDecimal("5.00"))
                .taxPercentage(new BigDecimal("18.00"))
                .build();

        mockMvc.perform(post("/api/v1/designs/" + designId + "/estimate")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.designId", is(designId.intValue())))
                .andExpect(jsonPath("$.totalCabinetCount", is(1)))
                .andExpect(jsonPath("$.materialTotal", greaterThan(0.0)))
                .andExpect(jsonPath("$.discountPercentage", is(5.00)))
                .andExpect(jsonPath("$.discountAmount", greaterThan(0.0)))
                .andExpect(jsonPath("$.grandTotal", greaterThan(0.0)))
                .andExpect(jsonPath("$.lineItems", not(empty())));
    }

    @Test
    @DisplayName("POST /api/v1/designs/{id}/estimate - Security check: Intruder access is rejected with 403 Forbidden")
    void testCalculateEstimateIntruderRejected() throws Exception {
        EstimateRequest request = new EstimateRequest();

        mockMvc.perform(post("/api/v1/designs/" + designId + "/estimate")
                        .header("Authorization", intruderToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/v1/designs/{id}/estimate/compare - Side-by-side comparison between Package A and Package B")
    void testCompareEstimates() throws Exception {
        EstimateComparisonRequest compareReq = EstimateComparisonRequest.builder()
                .optionA(EstimateRequest.builder().build())
                .optionB(EstimateRequest.builder().build())
                .build();

        mockMvc.perform(post("/api/v1/designs/" + designId + "/estimate/compare")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(compareReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estimateA").exists())
                .andExpect(jsonPath("$.estimateB").exists())
                .andExpect(jsonPath("$.totalDifference").exists())
                .andExpect(jsonPath("$.itemizedDifferences").exists());
    }

    @Test
    @DisplayName("POST /api/v1/designs/{id}/estimate - Validation failure on invalid percentage values")
    void testInvalidPercentagesRejected() throws Exception {
        EstimateRequest badReq = EstimateRequest.builder()
                .wastagePercentage(new BigDecimal("-10.00")) // Negative not allowed
                .discountPercentage(new BigDecimal("120.00")) // Exceeds 100%
                .build();

        mockMvc.perform(post("/api/v1/designs/" + designId + "/estimate")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors.wastagePercentage").exists())
                .andExpect(jsonPath("$.validationErrors.discountPercentage").exists());
    }

    @Test
    @DisplayName("Unauthorized requests without Bearer token must return 401 Unauthorized")
    void testUnauthenticatedAccessRejected() throws Exception {
        mockMvc.perform(get("/api/v1/materials"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/v1/designs/" + designId + "/estimate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
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
