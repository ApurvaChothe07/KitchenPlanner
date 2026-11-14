package com.kitchencraft.security;

import com.kitchencraft.entity.Role;
import com.kitchencraft.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private JwtService jwtService;
    // 256-bit test secret (Base64 encoded)
    private static final String TEST_SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
    private static final long EXPIRATION_MS = 3600000; // 1 hour

    private User testUser;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", TEST_SECRET);
        ReflectionTestUtils.setField(jwtService, "jwtExpirationMs", EXPIRATION_MS);

        testUser = User.builder()
                .id(1L)
                .email("designer@kitchencraft.com")
                .fullName("Jane Designer")
                .role(Role.ROLE_USER)
                .active(true)
                .build();
    }

    @Test
    @DisplayName("Should generate valid JWT token and extract subject accurately")
    void shouldGenerateAndExtractUsername() {
        String token = jwtService.generateToken(testUser);

        assertThat(token).isNotBlank();
        String extractedUsername = jwtService.extractUsername(token);
        assertThat(extractedUsername).isEqualTo("designer@kitchencraft.com");
    }

    @Test
    @DisplayName("Should validate token against matching UserDetails")
    void shouldValidateTokenSuccessfully() {
        String token = jwtService.generateToken(Map.of("role", "ROLE_USER"), testUser);

        boolean isValid = jwtService.isTokenValid(token, testUser);
        assertThat(isValid).isTrue();
    }

    @Test
    @DisplayName("Should reject token when validated against a different user")
    void shouldRejectTokenForDifferentUser() {
        String token = jwtService.generateToken(testUser);

        User anotherUser = User.builder()
                .id(2L)
                .email("other@kitchencraft.com")
                .fullName("Other Person")
                .role(Role.ROLE_USER)
                .build();

        boolean isValid = jwtService.isTokenValid(token, anotherUser);
        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("Should reject malformed or tampered token")
    void shouldRejectMalformedToken() {
        String malformedToken = "invalid.token.structure";
        boolean isValid = jwtService.validateToken(malformedToken);
        assertThat(isValid).isFalse();
    }
}
