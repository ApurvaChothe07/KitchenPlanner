package com.kitchencraft.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kitchencraft.dto.request.LoginRequest;
import com.kitchencraft.dto.request.RegisterRequest;
import com.kitchencraft.repository.UserRepository;
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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void cleanUp() {
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("POST /api/v1/auth/register: Should register new user and return 201 with JWT")
    void shouldRegisterNewUser() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .fullName("Alice Architect")
                .email("alice@kitchencraft.com")
                .password("securePassword123")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.tokenType", is("Bearer")))
                .andExpect(jsonPath("$.user.email", is("alice@kitchencraft.com")))
                .andExpect(jsonPath("$.user.fullName", is("Alice Architect")))
                .andExpect(jsonPath("$.user.role", is("ROLE_USER")));
    }

    @Test
    @DisplayName("POST /api/v1/auth/register: Should return 409 Conflict when registering duplicate email")
    void shouldRejectDuplicateEmail() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .fullName("Alice Architect")
                .email("alice@kitchencraft.com")
                .password("securePassword123")
                .build();

        // First registration
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Duplicate registration
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status", is(409)))
                .andExpect(jsonPath("$.message", containsString("already exists")));
    }

    @Test
    @DisplayName("POST /api/v1/auth/register: Should return 400 Bad Request on invalid input")
    void shouldValidateRegistrationPayload() throws Exception {
        RegisterRequest invalidRequest = RegisterRequest.builder()
                .fullName("")
                .email("not-an-email")
                .password("123") // too short (< 6)
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.validationErrors.email").exists())
                .andExpect(jsonPath("$.validationErrors.password").exists())
                .andExpect(jsonPath("$.validationErrors.fullName").exists());
    }

    @Test
    @DisplayName("POST /api/v1/auth/login: Should login successfully with valid credentials")
    void shouldLoginSuccessfully() throws Exception {
        // Register user first
        RegisterRequest registerReq = RegisterRequest.builder()
                .fullName("Bob Builder")
                .email("bob@kitchencraft.com")
                .password("strongPassword456")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated());

        // Login
        LoginRequest loginReq = LoginRequest.builder()
                .email("bob@kitchencraft.com")
                .password("strongPassword456")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.user.email", is("bob@kitchencraft.com")));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login: Should return 401 Unauthorized on invalid password")
    void shouldRejectInvalidPassword() throws Exception {
        RegisterRequest registerReq = RegisterRequest.builder()
                .fullName("Bob Builder")
                .email("bob@kitchencraft.com")
                .password("strongPassword456")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated());

        LoginRequest loginReq = LoginRequest.builder()
                .email("bob@kitchencraft.com")
                .password("incorrectPassword")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)))
                .andExpect(jsonPath("$.message", is("Invalid email or password")));
    }

    @Test
    @DisplayName("GET /api/v1/auth/me: Protected endpoint should reject unauthenticated requests with 401")
    void shouldRejectProtectedEndpointWithoutToken() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)));
    }

    @Test
    @DisplayName("GET /api/v1/auth/me: Should return authenticated user profile when valid Bearer token provided")
    void shouldAllowAccessWithValidToken() throws Exception {
        // Register user and grab token
        RegisterRequest registerReq = RegisterRequest.builder()
                .fullName("Charlie Chef")
                .email("charlie@kitchencraft.com")
                .password("charliePass789")
                .build();

        MvcResult registerResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String responseBody = registerResult.getResponse().getContentAsString();
        String token = objectMapper.readTree(responseBody).get("token").asText();

        // Call protected endpoint /api/v1/auth/me
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", is("charlie@kitchencraft.com")))
                .andExpect(jsonPath("$.fullName", is("Charlie Chef")))
                .andExpect(jsonPath("$.role", is("ROLE_USER")));

        // Call protected endpoint /api/v1/users/profile
        mockMvc.perform(get("/api/v1/users/profile")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", is("charlie@kitchencraft.com")));
    }

    @Test
    @DisplayName("GET /api/v1/health: Public health probe should return 200 without authentication")
    void shouldAllowPublicHealthCheck() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("UP")))
                .andExpect(jsonPath("$.service", is("KitchenCraft Backend")));
    }
}
