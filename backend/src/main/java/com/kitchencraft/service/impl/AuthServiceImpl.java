package com.kitchencraft.service.impl;

import com.kitchencraft.dto.request.LoginRequest;
import com.kitchencraft.dto.request.RegisterRequest;
import com.kitchencraft.dto.response.AuthResponse;
import com.kitchencraft.dto.response.UserResponse;
import com.kitchencraft.entity.Role;
import com.kitchencraft.entity.User;
import com.kitchencraft.exception.DuplicateResourceException;
import com.kitchencraft.exception.InvalidCredentialsException;
import com.kitchencraft.exception.ResourceNotFoundException;
import com.kitchencraft.repository.UserRepository;
import com.kitchencraft.security.JwtService;
import com.kitchencraft.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.getEmail().toLowerCase().trim();

        if (userRepository.existsByEmail(normalizedEmail)) {
            log.warn("Registration rejected: Email already registered [{}]", normalizedEmail);
            throw new DuplicateResourceException("An account with email '" + normalizedEmail + "' already exists");
        }

        User user = User.builder()
                .email(normalizedEmail)
                .fullName(request.getFullName().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.ROLE_USER)
                .active(true)
                .build();

        User savedUser = userRepository.save(user);
        log.info("Successfully registered new user ID: [{}], Email: [{}]", savedUser.getId(), savedUser.getEmail());

        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("userId", savedUser.getId());
        extraClaims.put("role", savedUser.getRole().name());

        String jwtToken = jwtService.generateToken(extraClaims, savedUser);

        return AuthResponse.builder()
                .token(jwtToken)
                .tokenType("Bearer")
                .expiresInMs(jwtService.getExpirationMs())
                .user(mapToUserResponse(savedUser))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.getEmail().toLowerCase().trim();

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword())
            );

            User user = (User) authentication.getPrincipal();
            log.info("User logged in successfully: [{}]", normalizedEmail);

            Map<String, Object> extraClaims = new HashMap<>();
            extraClaims.put("userId", user.getId());
            extraClaims.put("role", user.getRole().name());

            String jwtToken = jwtService.generateToken(extraClaims, user);

            return AuthResponse.builder()
                .token(jwtToken)
                .tokenType("Bearer")
                .expiresInMs(jwtService.getExpirationMs())
                .user(mapToUserResponse(user))
                .build();

        } catch (BadCredentialsException e) {
            log.warn("Login failed for user [{}]: Invalid credentials", normalizedEmail);
            throw new InvalidCredentialsException("Invalid email or password");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return mapToUserResponse(user);
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .active(user.isActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
