package com.kitchencraft.controller;

import com.kitchencraft.dto.response.HealthResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/api/v1/health")
@Tag(name = "Health", description = "System health and status endpoints for monitoring and container readiness")
public class HealthController {

    @GetMapping
    @Operation(summary = "System health probe", description = "Returns system status for Docker and Kubernetes health checks")
    public ResponseEntity<HealthResponse> getHealth() {
        return ResponseEntity.ok(
                HealthResponse.builder()
                        .status("UP")
                        .service("KitchenCraft Backend")
                        .version("0.0.1-SNAPSHOT")
                        .timestamp(Instant.now())
                        .build()
        );
    }
}
