package com.kitchencraft.service;

import com.kitchencraft.dto.request.LoginRequest;
import com.kitchencraft.dto.request.RegisterRequest;
import com.kitchencraft.dto.response.AuthResponse;
import com.kitchencraft.entity.Role;
import com.kitchencraft.entity.User;
import com.kitchencraft.exception.DuplicateResourceException;
import com.kitchencraft.exception.InvalidCredentialsException;
import com.kitchencraft.repository.UserRepository;
import com.kitchencraft.security.JwtService;
import com.kitchencraft.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthServiceImpl authService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .email("john@example.com")
                .fullName("John Doe")
                .passwordHash("hashed_password_123")
                .role(Role.ROLE_USER)
                .active(true)
                .build();
    }

    @Test
    @DisplayName("Register: Should successfully register a new user and return JWT")
    void shouldRegisterNewUser() {
        RegisterRequest request = RegisterRequest.builder()
                .email("john@example.com")
                .fullName("John Doe")
                .password("plain_password_123")
                .build();

        when(userRepository.existsByEmail("john@example.com")).thenReturn(false);
        when(passwordEncoder.encode("plain_password_123")).thenReturn("hashed_password_123");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);
        when(jwtService.generateToken(anyMap(), eq(sampleUser))).thenReturn("mocked.jwt.token");
        when(jwtService.getExpirationMs()).thenReturn(86400000L);

        AuthResponse response = authService.register(request);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("mocked.jwt.token");
        assertThat(response.getUser().getEmail()).isEqualTo("john@example.com");
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("Register: Should throw DuplicateResourceException if email already registered")
    void shouldThrowDuplicateResourceWhenEmailExists() {
        RegisterRequest request = RegisterRequest.builder()
                .email("john@example.com")
                .fullName("John Doe")
                .password("plain_password_123")
                .build();

        when(userRepository.existsByEmail("john@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("already exists");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Login: Should authenticate and return token when credentials are valid")
    void shouldLoginWithValidCredentials() {
        LoginRequest request = LoginRequest.builder()
                .email("john@example.com")
                .password("plain_password_123")
                .build();

        Authentication mockAuth = mock(Authentication.class);
        when(mockAuth.getPrincipal()).thenReturn(sampleUser);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(mockAuth);
        when(jwtService.generateToken(anyMap(), eq(sampleUser))).thenReturn("mocked.jwt.token");
        when(jwtService.getExpirationMs()).thenReturn(86400000L);

        AuthResponse response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("mocked.jwt.token");
        assertThat(response.getUser().getEmail()).isEqualTo("john@example.com");
    }

    @Test
    @DisplayName("Login: Should throw InvalidCredentialsException when bad credentials provided")
    void shouldThrowInvalidCredentialsOnBadPassword() {
        LoginRequest request = LoginRequest.builder()
                .email("john@example.com")
                .password("wrong_password")
                .build();

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessage("Invalid email or password");
    }

    @Test
    @DisplayName("GetCurrentUser: Should return user response for existing user")
    void shouldReturnCurrentUser() {
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(sampleUser));

        var userResponse = authService.getCurrentUser("john@example.com");

        assertThat(userResponse).isNotNull();
        assertThat(userResponse.getEmail()).isEqualTo("john@example.com");
        assertThat(userResponse.getFullName()).isEqualTo("John Doe");
    }
}
