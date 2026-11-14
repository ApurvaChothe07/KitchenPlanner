package com.kitchencraft.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kitchencraft.dto.request.CabinetRequest;
import com.kitchencraft.dto.request.CreateDesignRequest;
import com.kitchencraft.dto.request.CreateProjectRequest;
import com.kitchencraft.dto.request.UpdateDesignRequest;
import com.kitchencraft.dto.request.UpdateProjectRequest;
import com.kitchencraft.entity.CabinetType;
import com.kitchencraft.entity.LayoutType;
import com.kitchencraft.entity.ProjectStatus;
import com.kitchencraft.entity.Role;
import com.kitchencraft.entity.User;
import com.kitchencraft.repository.DesignCabinetRepository;
import com.kitchencraft.repository.DesignRepository;
import com.kitchencraft.repository.ProjectRepository;
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

import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ProjectAndDesignIntegrationTest {

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
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private User ownerUser;
    private User attackerUser;
    private String ownerToken;
    private String attackerToken;

    @BeforeEach
    void setup() {
        cabinetRepository.deleteAll();
        designRepository.deleteAll();
        projectRepository.deleteAll();
        userRepository.deleteAll();

        ownerUser = userRepository.save(User.builder()
                .email("owner@kitchencraft.com")
                .fullName("Owner Architect")
                .passwordHash(passwordEncoder.encode("password123"))
                .role(Role.ROLE_USER)
                .active(true)
                .build());

        attackerUser = userRepository.save(User.builder()
                .email("attacker@kitchencraft.com")
                .fullName("Malicious User")
                .passwordHash(passwordEncoder.encode("password123"))
                .role(Role.ROLE_USER)
                .active(true)
                .build());

        ownerToken = "Bearer " + jwtService.generateToken(Map.of("userId", ownerUser.getId()), ownerUser);
        attackerToken = "Bearer " + jwtService.generateToken(Map.of("userId", attackerUser.getId()), attackerUser);
    }

    @Test
    @DisplayName("Complete Lifecycle: Create Project, Create Design with mm dimensions, Add Cabinet, Edit & Delete")
    void shouldCompleteProjectAndDesignLifecycle() throws Exception {
        // 1. Create Project
        CreateProjectRequest projectReq = CreateProjectRequest.builder()
                .name("Modern Penthouse Kitchen")
                .clientName("John Doe")
                .clientEmail("johndoe@example.com")
                .clientPhone("+91 9876543210")
                .clientAddress("Flat 402, Sky Tower, Mumbai")
                .status(ProjectStatus.IN_PLANNING)
                .build();

        MvcResult projectResult = mockMvc.perform(post("/api/v1/projects")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(projectReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name", is("Modern Penthouse Kitchen")))
                .andExpect(jsonPath("$.clientName", is("John Doe")))
                .andExpect(jsonPath("$.status", is("IN_PLANNING")))
                .andReturn();

        long projectId = objectMapper.readTree(projectResult.getResponse().getContentAsString()).get("id").asLong();

        // 2. List Projects
        mockMvc.perform(get("/api/v1/projects")
                        .header("Authorization", ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name", is("Modern Penthouse Kitchen")));

        // 3. Create Design for Project with room dimensions in millimetres
        CreateDesignRequest designReq = CreateDesignRequest.builder()
                .name("L-Shape Layout Option 1")
                .version(1)
                .roomWidthMm(4500)   // 4.5m
                .roomLengthMm(3600)  // 3.6m
                .roomHeightMm(2800)  // 2.8m
                .layoutType(LayoutType.L_SHAPED)
                .layoutDataJson("{\"grid\": 100, \"walls\": [{\"x1\": 0, \"y1\": 0, \"x2\": 4500, \"y2\": 0}]}")
                .build();

        MvcResult designResult = mockMvc.perform(post("/api/v1/projects/" + projectId + "/designs")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(designReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.version", is(1)))
                .andExpect(jsonPath("$.roomWidthMm", is(4500)))
                .andExpect(jsonPath("$.roomLengthMm", is(3600)))
                .andExpect(jsonPath("$.roomHeightMm", is(2800)))
                .andExpect(jsonPath("$.layoutType", is("L_SHAPED")))
                .andReturn();

        long designId = objectMapper.readTree(designResult.getResponse().getContentAsString()).get("id").asLong();

        // 4. Add Base Cabinet with mm dimensions and coordinates
        CabinetRequest cabinetReq = CabinetRequest.builder()
                .cabinetType(CabinetType.SINK_BASE)
                .widthMm(900)   // 900mm width
                .depthMm(600)   // 600mm standard counter depth
                .heightMm(860)  // 860mm standard base height
                .posX(1500.0)
                .posY(600.0)
                .posZ(0.0)
                .rotation(0.0)
                .carcassMaterial("BWR_PLYWOOD")
                .shutterMaterial("ACRYLIC_WHITE")
                .finishColor("#FFFFFF")
                .notes("Under-sink double door cabinet with plumbing cutout")
                .build();

        MvcResult cabinetResult = mockMvc.perform(post("/api/v1/designs/" + designId + "/cabinets")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cabinetReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.cabinetType", is("SINK_BASE")))
                .andExpect(jsonPath("$.widthMm", is(900)))
                .andExpect(jsonPath("$.depthMm", is(600)))
                .andExpect(jsonPath("$.heightMm", is(860)))
                .andExpect(jsonPath("$.carcassMaterial", is("BWR_PLYWOOD")))
                .andReturn();

        long cabinetId = objectMapper.readTree(cabinetResult.getResponse().getContentAsString()).get("id").asLong();

        // 5. Get Full Design Details (includes the saved cabinet)
        mockMvc.perform(get("/api/v1/designs/" + designId)
                        .header("Authorization", ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is((int) designId)))
                .andExpect(jsonPath("$.cabinets", hasSize(1)))
                .andExpect(jsonPath("$.cabinets[0].id", is((int) cabinetId)))
                .andExpect(jsonPath("$.cabinets[0].widthMm", is(900)));

        // 6. Update Cabinet dimensions
        cabinetReq.setWidthMm(1000); // Expanded to 1000mm
        mockMvc.perform(put("/api/v1/designs/" + designId + "/cabinets/" + cabinetId)
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cabinetReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.widthMm", is(1000)));

        // 7. Update Design room dimensions
        UpdateDesignRequest updateDesignReq = UpdateDesignRequest.builder()
                .name("Expanded L-Shape Design")
                .roomWidthMm(5000)
                .roomLengthMm(4000)
                .roomHeightMm(2900)
                .layoutType(LayoutType.L_SHAPED)
                .build();

        mockMvc.perform(put("/api/v1/designs/" + designId)
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDesignReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roomWidthMm", is(5000)))
                .andExpect(jsonPath("$.roomLengthMm", is(4000)));

        // 8. Delete Cabinet
        mockMvc.perform(delete("/api/v1/designs/" + designId + "/cabinets/" + cabinetId)
                        .header("Authorization", ownerToken))
                .andExpect(status().isNoContent());

        // Verify cabinet was removed
        mockMvc.perform(get("/api/v1/designs/" + designId)
                        .header("Authorization", ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cabinets", hasSize(0)));

        // 9. Delete Project
        mockMvc.perform(delete("/api/v1/projects/" + projectId)
                        .header("Authorization", ownerToken))
                .andExpect(status().isNoContent());

        // Verify project is gone
        mockMvc.perform(get("/api/v1/projects/" + projectId)
                        .header("Authorization", ownerToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Security Enforcement: Attacker cannot access, modify, or delete another user's project or design")
    void shouldRejectUnauthorizedUserAccess() throws Exception {
        // Owner creates project and design
        CreateProjectRequest projectReq = CreateProjectRequest.builder()
                .name("Confidential Villa Kitchen")
                .build();

        MvcResult projectResult = mockMvc.perform(post("/api/v1/projects")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(projectReq)))
                .andExpect(status().isCreated())
                .andReturn();

        long projectId = objectMapper.readTree(projectResult.getResponse().getContentAsString()).get("id").asLong();

        CreateDesignRequest designReq = CreateDesignRequest.builder()
                .name("Villa Design v1")
                .roomWidthMm(6000)
                .roomLengthMm(5000)
                .roomHeightMm(3000)
                .build();

        MvcResult designResult = mockMvc.perform(post("/api/v1/projects/" + projectId + "/designs")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(designReq)))
                .andExpect(status().isCreated())
                .andReturn();

        long designId = objectMapper.readTree(designResult.getResponse().getContentAsString()).get("id").asLong();

        // 1. Attacker tries to read owner's project -> 403 Forbidden
        mockMvc.perform(get("/api/v1/projects/" + projectId)
                        .header("Authorization", attackerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)));

        // 2. Attacker tries to update owner's project -> 403 Forbidden
        UpdateProjectRequest updateReq = UpdateProjectRequest.builder()
                .name("Hacked Name")
                .build();
        mockMvc.perform(put("/api/v1/projects/" + projectId)
                        .header("Authorization", attackerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isForbidden());

        // 3. Attacker tries to read owner's design -> 403 Forbidden
        mockMvc.perform(get("/api/v1/designs/" + designId)
                        .header("Authorization", attackerToken))
                .andExpect(status().isForbidden());

        // 4. Attacker tries to add cabinet to owner's design -> 403 Forbidden
        CabinetRequest cabinetReq = CabinetRequest.builder()
                .cabinetType(CabinetType.BASE)
                .widthMm(600)
                .depthMm(600)
                .heightMm(860)
                .build();
        mockMvc.perform(post("/api/v1/designs/" + designId + "/cabinets")
                        .header("Authorization", attackerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cabinetReq)))
                .andExpect(status().isForbidden());

        // 5. Attacker tries to delete owner's project -> 403 Forbidden
        mockMvc.perform(delete("/api/v1/projects/" + projectId)
                        .header("Authorization", attackerToken))
                .andExpect(status().isForbidden());

        // Verify owner's project is completely intact
        mockMvc.perform(get("/api/v1/projects/" + projectId)
                        .header("Authorization", ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Confidential Villa Kitchen")));
    }

    @Test
    @DisplayName("Validation: Should reject duplicate design versions within the same project with 409 Conflict")
    void shouldRejectDuplicateDesignVersion() throws Exception {
        CreateProjectRequest projectReq = CreateProjectRequest.builder()
                .name("Duplication Test Project")
                .build();

        MvcResult projectResult = mockMvc.perform(post("/api/v1/projects")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(projectReq)))
                .andExpect(status().isCreated())
                .andReturn();

        long projectId = objectMapper.readTree(projectResult.getResponse().getContentAsString()).get("id").asLong();

        CreateDesignRequest designReq = CreateDesignRequest.builder()
                .name("Version 1 Design")
                .version(1)
                .roomWidthMm(4000)
                .roomLengthMm(3000)
                .roomHeightMm(2600)
                .build();

        // First design with version 1 -> 201 Created
        mockMvc.perform(post("/api/v1/projects/" + projectId + "/designs")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(designReq)))
                .andExpect(status().isCreated());

        // Second design with same version 1 -> 409 Conflict
        mockMvc.perform(post("/api/v1/projects/" + projectId + "/designs")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(designReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status", is(409)))
                .andExpect(jsonPath("$.message", containsString("already exists")));
    }

    @Test
    @DisplayName("Validation: Should reject invalid room and cabinet dimensions with 400 Bad Request")
    void shouldRejectInvalidDimensions() throws Exception {
        CreateProjectRequest projectReq = CreateProjectRequest.builder()
                .name("Validation Project")
                .build();

        MvcResult projectResult = mockMvc.perform(post("/api/v1/projects")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(projectReq)))
                .andExpect(status().isCreated())
                .andReturn();

        long projectId = objectMapper.readTree(projectResult.getResponse().getContentAsString()).get("id").asLong();

        // Invalid Room Dimensions: roomWidthMm is 500mm (min is 1000mm)
        CreateDesignRequest invalidDesign = CreateDesignRequest.builder()
                .name("Too small room")
                .roomWidthMm(500) // below 1000mm min
                .roomLengthMm(3000)
                .roomHeightMm(2500)
                .build();

        mockMvc.perform(post("/api/v1/projects/" + projectId + "/designs")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidDesign)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.validationErrors.roomWidthMm").exists());
    }
}
