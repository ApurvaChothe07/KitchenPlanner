# KitchenCraft — Java Backend Developer & DevOps Interview Preparation Guide

This guide provides deep, code-backed answers to the 12 core architectural, design, and operational questions for the KitchenCraft platform. Each answer is formulated for technical interviews targeting a **Java Backend Developer with DevOps Skills**.

---

### 1. Why Spring Boot and PostgreSQL Were Selected

#### Question: "Why did you choose Spring Boot 3 with Java 21 and PostgreSQL 16 over alternatives like Node.js or MongoDB?"

**Key Talking Points:**
- **Strict Financial & Relational Integrity**: KitchenCraft models modular cabinetry, bill of materials (BOM), catalogue rates, and legal quotations. This domain requires rigid relational integrity (foreign keys with cascade rules), unique constraints (e.g. unique project versions and material names), and ACID transactions. PostgreSQL provides mature concurrency control, robust `NUMERIC(12,2)` fixed-point math, and JSONB capabilities if semi-structured layout blobs are ever needed.
- **Enterprise Type Safety & Performance in Java 21**: Java 21 LTS brings modern language features such as pattern matching, records, immutable collections, and Virtual Threads (Project Loom) capability. Spring Boot 3.3 offers native Ahead-Of-Time (AOT) compilation support, simplified configuration, Spring Security 6 with declarative authorization, and production-grade observability via Spring Boot Actuator.
- **Why Not MongoDB?**: In NoSQL databases, price updates require either multi-document distributed transactions or eventual consistency. If a material catalogue price changes during quotation generation, non-relational document stores risk calculating inconsistent line items or orphaned records. PostgreSQL enforces referential integrity at the database engine level.

---

### 2. Controller-Service-Repository Architecture

#### Question: "Explain the architectural layering in KitchenCraft. How do you separate concerns between layers?"

**Key Talking Points:**
- **Separation of Concerns**:
  1. **Controller Layer (`com.kitchencraft.controller`)**: Handles HTTP protocol concerns—request parsing, URL path parameter binding, validation via `@Valid`, and mapping to HTTP response codes (201 Created, 200 OK, 204 No Content, 400 Bad Request). Controllers contain **zero business logic**.
  2. **Service Layer (`com.kitchencraft.service` & `.service.impl`)**: Owns business logic, multi-entity transactions (`@Transactional`), tenant authorization checks, surface area mathematical calculations, and state machine transitions. Services accept and return strongly typed DTOs.
  3. **Repository Layer (`com.kitchencraft.repository`)**: Interfaces extending `JpaRepository` providing typed database operations. Custom queries use Spring Data JPA method name conventions or optimized JPQL (`@Query`) with `JOIN FETCH` to eliminate N+1 query problems.
- **DTO Isolation**: Database `@Entity` classes are never exposed directly to controllers or serialized to the client. Request DTOs validate incoming client payloads with Bean Validation (`@NotNull`, `@Min`, `@Max`, `@Size`), while Response DTOs format and sanitize data sent to the client.

---

### 3. JPA and Hibernate Entity Relationships

#### Question: "How are the entity relationships modeled in JPA/Hibernate? How do you prevent N+1 queries and memory leaks?"

**Key Talking Points:**
- **Core Relationships**:
  - `User` $\to$ `Project`: `@OneToMany(mappedBy = "owner", cascade = CascadeType.ALL, orphanRemoval = true)` with `fetch = FetchType.LAZY`.
  - `Project` $\to$ `Design`: `@OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)` with `fetch = FetchType.LAZY`.
  - `Design` $\to$ `DesignCabinet`: `@OneToMany(mappedBy = "design", cascade = CascadeType.ALL, orphanRemoval = true)` with `fetch = FetchType.LAZY`.
  - `Project` $\to$ `Quotation`: `@OneToMany(mappedBy = "project", cascade = CascadeType.ALL)`.
  - `Quotation` $\to$ `QuotationItem`: `@OneToMany(mappedBy = "quotation", cascade = CascadeType.ALL, orphanRemoval = true)`.
- **Avoiding N+1 Query Traps**:
  - All relationships default to `FetchType.LAZY`. Eager loading is strictly forbidden to prevent cartesian explosion.
  - Where full hierarchy loading is required (e.g. rendering the design with all cabinets for cost estimation), repositories provide JPQL queries using `JOIN FETCH` (e.g. `SELECT d FROM Design d LEFT JOIN FETCH d.cabinets WHERE d.id = :id`).
- **Composite Unique Constraints**:
  - `Design`: `@Table(uniqueConstraints = @UniqueConstraint(name = "uk_project_design_version", columnNames = {"project_id", "version"}))` guarantees sequential, collision-free versions per project.
  - `Material`: `@Column(unique = true)` prevents duplicate catalogue entries.

---

### 4. JWT Authentication and Project Ownership (Multi-Tenancy)

#### Question: "How does authentication work, and how do you ensure User A cannot view or manipulate User B's designs or quotations?"

**Key Talking Points:**
- **Stateless JWT Security Filter Chain**:
  - Requests pass through `JwtAuthenticationFilter` before reaching Spring's `UsernamePasswordAuthenticationFilter`.
  - The filter extracts the `Authorization: Bearer <token>` header, verifies the HMAC-SHA256 signature using a secure 256-bit key via `io.jsonwebtoken (jjwt 0.12.6)`, validates expiration, extracts the username/userId, and injects an authenticated `UsernamePasswordAuthenticationToken` into `SecurityContextHolder`.
- **Horizontal Access Control (IDOR Prevention)**:
  - Knowing another user's numeric ID (e.g. Project ID 1) does **not** grant access.
  - In every service method (`ProjectServiceImpl`, `DesignServiceImpl`, `CostEstimationServiceImpl`, `QuotationServiceImpl`), the entity's owner is verified:
    ```java
    if (!project.getOwner().getId().equals(currentUser.getId())) {
        throw new AccessDeniedException("You do not have permission to access project with ID: " + id);
    }
    ```
  - Unauthorized attempts log security warnings with client IP/User ID and return standard `403 Forbidden` without leaking metadata.

---

### 5. How the 2D Editor Maps to the 3D Scene

#### Question: "How does the platform translate 2D canvas coordinates into an interactive 3D WebGL scene?"

**Key Talking Points:**
- **Single Source of Truth**: Both the 2D editor and 3D visualizer share the same backend design state (`roomWidthMm`, `roomLengthMm`, `roomHeightMm`, and cabinet array with `posX`, `posY`, `posZ`, `widthMm`, `depthMm`, `heightMm`, and `rotationDeg`).
- **Coordinate System Mapping**:
  - **2D Canvas (React Konva)**: Coordinates operate in top-down screen pixels with origin $(0, 0)$ at the top-left corner. A scaling factor ($0.2\text{ px/mm}$) maps millimeters to canvas pixels.
  - **3D World (Three.js / React Three Fiber)**: Coordinates operate in metric meters ($1\text{ m} = 1000\text{ mm}$) with origin $(0, 0, 0)$ at the center of the room floor.
  - **Transformation Formula**:
    $$X_{\text{3D}} = \frac{X_{\text{2D}} + \frac{W}{2} - \frac{\text{RoomW}}{2}}{1000}$$
    $$Y_{\text{3D}} = \frac{Z_{\text{elevation}} + \frac{H}{2}}{1000}$$
    $$Z_{\text{3D}} = \frac{Y_{\text{2D}} + \frac{D}{2} - \frac{\text{RoomL}}{2}}{1000}$$
- **Elevation Preservation**: Base cabinets rest on the floor ($Z_{\text{elevation}} = 0$). Wall cabinets elevate to standard mounting height ($Z_{\text{elevation}} = 1450\text{ mm}$), ensuring realistic clearance above countertops in both 2D collision detection and 3D rendering.

---

### 6. How the Java Cost Estimation Engine Works

#### Question: "Explain the financial calculation engine. Why can't the frontend calculate prices?"

**Key Talking Points:**
- **Zero-Trust Client Principle**: The frontend is untrusted. Malicious clients could manipulate prices or discounts in HTTP payloads. Therefore, the client submits only selected material IDs; the backend looks up verified catalogue rates from the database.
- **Deterministic Surface Area Derivation**:
  - All room and cabinet coordinates are stored in millimeters ($\text{mm}$).
  - Conversion constant: $1\text{ sq.ft} = 92,903.04\text{ mm}^2$.
  - **Carcass Box Surface Area**: 2 side panels, 1 top panel, 1 bottom panel, 1 back panel, and 1 middle shelf:
    $$\text{Area}_{\text{carcass}} = 2(D \times H) + 3(W \times D) + (W \times H)$$
  - **Shutter Face Area**: Front door panel:
    $$\text{Area}_{\text{shutter}} = W \times H$$
  - **Countertop Slab Area**: Applies strictly to floor base units (`BASE`, `SINK_BASE`, `HOB_BASE`, `DRAWER_BASE`, `CORNER`) with a $20\text{ mm}$ anti-drip overhang:
    $$\text{Area}_{\text{countertop}} = W \times (D + 20\text{ mm})$$
- **Markup Pipeline**:
  $$\text{Subtotal} = \text{Materials Total} + \text{Wastage (10\%)} + \text{Labour (15\%)} + \text{Installation (5\%)}$$
  $$\text{Grand Total} = (\text{Subtotal} - \text{Discount}) + \text{GST (18\%) }$$

---

### 7. Why BigDecimal is Used for Money

#### Question: "Why did you use `BigDecimal` instead of `double` or `float` for currency calculations?"

**Key Talking Points:**
- **Binary Floating-Point Imprecision**: Primitive `double` and `float` represent numbers using IEEE 754 binary floating-point representation. Many decimal fractions (like $0.1$ or $0.7$) cannot be represented exactly in binary powers of 2.
- **Accumulated Rounding Drift**: Repeated operations with `double` lead to precision errors (e.g., `0.1 + 0.2 = 0.30000000000000004`). In taxation, invoicing, and contract quotations, a discrepancy of even $\pm 1$ paisa or cent causes audit failures.
- **Controlled Scale & Rounding Mode**: `BigDecimal` provides arbitrary-precision signed decimals with explicit rounding semantics:
  ```java
  amount.setScale(2, RoundingMode.HALF_UP)
  ```
  `RoundingMode.HALF_UP` implements standard commercial rounding ("round half toward nearest neighbor, or up if equidistant").

---

### 8. Why Quotation Snapshots are Necessary

#### Question: "Why store snapshot prices in quotations instead of joining the material table when viewing past quotations?"

**Key Talking Points:**
- **Legal & Contractual Immutability**: A quotation is a legal offer. If material rates rise by 25% six months later, existing quotations issued to customers must **never** change.
- **Temporal Decoupling**: If quotation lines merely foreign-keyed to `materials.unit_price`, updating a material rate would retroactively alter past financial records, skew revenue history, and corrupt downloaded PDFs.
- **Implementation Strategy**:
  - When a quotation is generated, `QuotationServiceImpl` copies descriptions, quantities, unit prices, and totals as immutable scalar `NUMERIC(12,2)` columns in `quotation_items`.
  - Material names and specifications are snapshotted as text strings (`carcass_material_snapshot`).
  - An automated integration test explicitly alters database catalogue rates and verifies that existing quotation records and PDFs remain 100% identical.

---

### 9. What Unit Tests and Integration Tests Verify

#### Question: "How did you design your test suite? What is the difference between your unit tests and integration tests?"

**Key Talking Points:**
- **Unit Tests (`CostEstimationServiceTest`, `MaterialServiceTest`, `QuotationServiceTest`, `JwtServiceTest`)**:
  - Test pure business logic in isolation using JUnit 5 and Mockito.
  - Repositories and external dependencies are mocked with `@Mock` and `@InjectMocks`.
  - Verify boundary edge cases (0% tax, 50% discount, zero cabinets, lift-up wall units, status state machines) without starting a Spring application context or connecting to a database (executes in milliseconds).
- **Integration Tests (`FullPlatformEndToEndIntegrationTest`, `AuthControllerTest`, `ProjectAndDesignIntegrationTest`, `MaterialAndEstimateIntegrationTest`, `QuotationIntegrationTest`)**:
  - Use `@SpringBootTest` and `@AutoConfigureMockMvc` with `@ActiveProfiles("test")`.
  - Test the entire HTTP filter pipeline: JSON deserialization, validation rules (`@Valid`), Spring Security filters, database transactions, JPA cascade operations, and HTTP status codes.
  - Verify multi-tenant access boundaries, ensuring intruder tokens receive HTTP 403 Forbidden.

---

### 10. What Docker and GitHub Actions Accomplish

#### Question: "What was your DevOps approach? How do containerization and CI protect application stability?"

**Key Talking Points:**
- **Reproducible Container Builds (Multi-Stage Dockerfile)**:
  - Eliminates "it works on my machine" syndrome.
  - Stage 1 compiles with JDK 21 Alpine using cached dependency layers.
  - Stage 2 copies only the runnable JAR to a lightweight JRE Alpine image, reducing image size to under 250MB and running as an unprivileged user (`spring:spring`).
- **Orchestration (`docker-compose.yml`)**:
  - Spawns PostgreSQL 16 Alpine with named volume persistence (`postgres_data`).
  - Implements service readiness checks (`pg_isready` for DB, `/actuator/health` for Spring Boot), preventing race conditions during startup.
- **Continuous Integration (`.github/workflows/ci.yml`)**:
  - Automates quality gates on every push/PR: runs PostgreSQL service container, executes `./mvnw -B verify` (55 tests), runs frontend tests (`npm test`), verifies Vite production bundle, and builds Docker images using Docker Buildx.
  - Prevents broken code from merging to `main`.

---

### 11. How Deployment Configuration and Secrets are Managed

#### Question: "How do you manage configuration across environments (dev, test, prod)? How are production secrets secured?"

**Key Talking Points:**
- **Twelve-Factor App Methodology**: Configuration is externalized from code into environment variables.
- **Spring Profile Strategy**:
  - `dev` (default in `application.yml`): Connects to local PostgreSQL or container.
  - `test` (`application-test.yml`): Uses in-memory H2 in PostgreSQL compatibility mode for instant, isolated test execution without external dependencies.
  - `prod`: Activates when `SPRING_PROFILES_ACTIVE=prod`. Requires explicit database credentials and secrets.
- **Zero Secrets in Source Control**:
  - Secret keys (JWT signing key, database passwords) are injected via host environment variables or secret managers (e.g. AWS Secrets Manager, Railway/Render environment secrets).
  - `.env.example` provides template keys with clear documentation and placeholder defaults. Real `.env` files are ignored via `.gitignore`.

---

### 12. Trade-offs and Remaining Architectural Limitations

#### Question: "What trade-offs did you make, and what would you improve in future architectural iterations?"

**Key Talking Points:**
- **Synchronous PDF Generation vs. Async Queue**:
  - *Current Trade-off*: PDFs are generated synchronously via OpenPDF in the HTTP thread. This works seamlessly for low-to-moderate quotation traffic (generation takes <100ms).
  - *Improvement*: At enterprise scale (thousands of concurrent quotations), PDF generation should be offloaded to an asynchronous message queue (e.g. RabbitMQ/Kafka) with workers storing output in S3/GCS and notifying clients via WebSockets.
- **In-Memory H2 in Tests vs. Testcontainers**:
  - *Current Trade-off*: Tests use H2 in PostgreSQL compatibility mode for instant execution without requiring Docker Desktop running on the developer workstation.
  - *Improvement*: For CI pipelines with Docker daemon access, Testcontainers spinning up an actual PostgreSQL 16 container guarantees 100% dialect fidelity.
- **Basic 3D Primitives vs. Complex GLTF Meshes**:
  - *Current Trade-off*: Cabinets render as parameterized procedural 3D box meshes with metric materials. This keeps bundle sizes light and rendering performance at 60 FPS on all devices.
  - *Improvement*: Add GLTF/GLB asset loading for realistic handles, textured wood grains, sinks, and hobs.
