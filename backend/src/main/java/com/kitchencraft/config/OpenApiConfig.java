package com.kitchencraft.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME = "Bearer Authentication";

    @Value("${server.port:8080}")
    private String serverPort;

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("KitchenCraft Backend REST API")
                        .version("1.0.0")
                        .description("""
                                # KitchenCraft — Kitchen Interior Planner & Cost Estimation Platform
                                
                                Comprehensive, enterprise-grade REST API backend built on Java 21, Spring Boot 3, and PostgreSQL.
                                
                                ### Key Architectural Capabilities:
                                - **Authentication & Authorization**: Stateless JWT authentication with BCrypt hashing, role-based controls, and complete cross-tenant isolation.
                                - **Project & Versioned Design Management**: Multi-version kitchen design tracking with millimetric precision and layout constraints.
                                - **2D Canvas & 3D Spatial Synchronizer**: Millimeter-to-meter coordinate transformation engine and collision detection.
                                - **Zero-Trust Cost Estimation Engine**: Deterministic surface area formulas, live catalogue resolution, configurable wastage, labor, install, discounts, and GST tax with `BigDecimal` rounding.
                                - **Historical Quotation Snapshots & PDF Engine**: Immutable price freezing and corporate PDF generation with OpenPDF.
                                
                                ### Authentication Requirements:
                                Public endpoints (`/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/health`, `/swagger-ui/**`) do not require credentials.
                                All other endpoints require an HTTP `Authorization` header containing a valid JWT bearer token:
                                `Authorization: Bearer <your_jwt_token>`
                                """)
                        .contact(new Contact()
                                .name("KitchenCraft Engineering Team")
                                .email("engineering@kitchencraft.com")
                                .url("https://kitchencraft.example.com"))
                        .license(new License()
                                .name("Apache License 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0")))
                .servers(List.of(
                        new Server().url("http://localhost:" + serverPort).description("Local Development Server"),
                        new Server().url("https://api.kitchencraft.example.com").description("Production Cloud Gateway")
                ))
                .tags(List.of(
                        new Tag().name("Authentication").description("Registration, login, and JWT validation endpoints"),
                        new Tag().name("Project Management").description("Customer kitchen projects, client metadata, and status lifecycle"),
                        new Tag().name("Design & Cabinet Management").description("Kitchen room geometry, 2D/3D cabinet placement, and layout persistence"),
                        new Tag().name("Material Catalogue").description("Core board, shutter finish, countertop, and hardware rates and specs"),
                        new Tag().name("Cost Estimation").description("Real-time mathematical BOM calculations and side-by-side comparison engine"),
                        new Tag().name("Quotation Management").description("Persistent quotation records, status state machine, and PDF streaming"),
                        new Tag().name("Health").description("Deployment and orchestrator liveness and readiness probes")
                ))
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME, new SecurityScheme()
                                .name(SECURITY_SCHEME_NAME)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Enter your JWT token (e.g., Bearer eyJhbGciOi...) to authorize private endpoints.")));
    }
}
