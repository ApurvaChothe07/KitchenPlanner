package com.kitchencraft.service;

import com.kitchencraft.dto.request.LoginRequest;
import com.kitchencraft.dto.request.RegisterRequest;
import com.kitchencraft.dto.response.AuthResponse;
import com.kitchencraft.dto.response.UserResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    UserResponse getCurrentUser(String email);
}
