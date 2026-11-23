# KITCHENPLANNER (KITCHENCRAFT) — COMPREHENSIVE PROJECT AUDIT & DEVELOPMENT ROADMAP

**Audit Date:** November 23, 2026  
**Auditor Roles:** Senior Software Architect, Senior Java Backend Developer, Senior React Frontend Developer, PostgreSQL Database Architect, 2D CAD & Three.js Specialist, SaaS Product Architect, DevOps Engineer, Application Security Engineer, QA & Test Engineer, UI/UX Analyst, Legal & Compliance Consultant.  
**Repository Working Directory:** `d:\KitchenPlanner`  
**Current Branch / Commit:** `main` (`ad20e0b`)  
**Audit Scope:** Full codebase, database migrations, configuration, test suites, container orchestration, CI/CD pipelines, security posture, legal/compliance, commercial business model, and architectural roadmap.  
**Operating Constraint:** Zero code modifications performed. Read-only audit and analysis.

---

## 1. Executive Summary

The **KitchenPlanner** platform (internally packaged and branded as **KitchenCraft** across the source tree) is a full-stack modular kitchen interior planning, cost estimation, and formal quotation generation application. 

### Current Project Maturity
The system currently exists as an **advanced, functional single-tenant MVP / late-stage prototype**. It possesses a remarkably solid engineering foundation in core domain mathematics, deterministic financial pipelines, and modern visual canvas technologies. However, it requires deliberate architectural evolution, multi-tenant isolation, security hardening, and commercial infrastructure before it can operate safely as a commercial SaaS product in the Indian modular kitchen market.

### Key Technical Strengths
1. **Deterministic Financial Pipeline & Zero-Trust Architecture:** Financial calculations are never computed on the frontend. The backend calculates panel surface areas (carcass boxes, shutter faces, countertop slabs with anti-drip overhangs, and hardware lines) using verified database catalogue rates with `BigDecimal` arithmetic and `RoundingMode.HALF_UP`.
2. **Legal Immutability of Quotations:** When quotations are generated, material specifications, quantities, and rates are permanently snapshotted into `quotation_items`, preventing retroactive drift if catalogue rates rise in subsequent months.
3. **Synchronized 2D & 3D Visual Planning:** The platform maintains bidirectional millimeter-to-meter coordinate synchronicity between the 2D floor planner (React Konva) and the 3D visualizer (Three.js / React Three Fiber), featuring 50 mm grid snapping, boundary wall clamping, and axis-aligned bounding box (AABB) collision checks.
4. **Strong Backend Engineering & Testing Rigor:** Layered Spring Boot 3.3.5 / Java 21 architecture with **55 passing automated backend tests** spanning unit, service, security, and Spring `MockMvc` integration tests with zero failures.
5. **Modern Containerization & CI:** Multi-stage Alpine Dockerfiles for both backend and frontend, healthcheck probes, unified Docker Compose orchestration, and automated GitHub Actions verification.

### Critical Gaps & Vulnerabilities Requiring Immediate Remediation
1. **Single-Tenant User Ownership Model:** Data ownership is strictly tied to individual `users.id`. There is no concept of a `Business`, `Tenant`, `Workspace`, or multi-user team hierarchy. A modular kitchen studio owner cannot add design staff, share project portfolios, or restrict pricing margins.
2. **Hardcoded Seed Credentials & Demonstration Data:** `DataInitializer.java` automatically seeds user accounts with hardcoded default passwords upon server boot, and `AuthModal.jsx` exposes an auto-fill demo banner directly in the login dialog.
3. **Public H2 Web Console & Test Dialect Mismatch:** The Spring Security configuration permits public access to `/h2-console/**`. In the GitHub Actions CI pipeline and test profile, an in-memory H2 database is used with Flyway migrations disabled (`flyway.enabled: false`), meaning database migrations are never verified against the live PostgreSQL 16 container during CI runs.
4. **Sequential HTTP Save Bottleneck (N+1 Writes):** When saving a kitchen layout with multiple cabinets, `KitchenEditor.jsx` iterates sequentially over cabinets, firing individual HTTP POST/PUT/DELETE requests for each cabinet rather than submitting a single atomic transactional bulk payload.
5. **Absence of Server-Side File Storage:** The "Realistic Studio" site photo visualizer operates entirely in the browser using client-side in-memory `FileReader` data URLs. There is no backend object storage (e.g., S3/MinIO) or file upload endpoint.
6. **Token Expiration & Refresh Strategy:** JWT tokens have a static 24-hour expiration window with no refresh token rotation, revocation blacklist, or secure HTTP-only cookie delivery.

---

## 2. Project Overview

### Project Identity & Historical Evolution
The project was initiated as a monolithic Java and React solution to solve the fragmentation in modular kitchen contracting: manual site measurements, error-prone spreadsheet calculations, disconnected 3D renderings, and delayed client quotations.

- **Codename / Package:** `com.kitchencraft` (`kitchencraft-backend`, `kitchencraft-frontend`)
- **Target Market:** Initial launch focused on Indian modular kitchen studios, independent interior designers, freelance kitchen consultants, modular cabinet manufacturers, and homeowners. Secondary expansion targets Southeast Asia and the Middle East.
- **Strategic Purpose:** Designed simultaneously as a commercial SaaS offering for interior businesses and a showcase portfolio project demonstrating senior-level Java 21 Spring Boot development, PostgreSQL relational integrity, and DevOps automation.

---

## 3. Workspace and Technology Inventory

Every component and library in the workspace was inspected directly from dependency manifests:

### Backend Stack (`backend/pom.xml`)
| Technology / Dependency | Version | Purpose in Project |
| :--- | :--- | :--- |
| **Java Runtime** | OpenJDK 21 LTS | Language runtime utilizing modern records, pattern matching, and performance enhancements |
| **Spring Boot Parent** | 3.3.5 | Core enterprise application framework |
| **Spring Boot Starter Web** | 3.3.5 | Embedded Tomcat, REST controllers, JSON Jackson serialization |
| **Spring Boot Starter Security** | 3.3.5 | Security filter chain, stateless authentication, password hashing |
| **Spring Boot Starter Data JPA** | 3.3.5 | Hibernate 6.5 ORM, entity management, repository abstractions |
| **Spring Boot Starter Validation** | 3.3.5 | Jakarta / Hibernate Bean Validation (`@Valid`, `@NotNull`, `@Size`) |
| **Spring Boot Starter Actuator** | 3.3.5 | Production health probes (`/actuator/health`) and metrics |
| **PostgreSQL JDBC Driver** | 42.7.4 | Native relational database connectivity |
| **H2 Database** | 2.2.224 | Local standalone execution and in-memory test dialect |
| **Flyway Core & PostgreSQL** | 10.10.0 | Versioned database migration management (`V1` through `V4`) |
| **JJWT (`jjwt-api`, `impl`, `jackson`)** | 0.12.6 | HMAC-SHA256 stateless JSON Web Token issuance and parsing |
| **Springdoc OpenAPI UI** | 2.6.0 | Swagger UI documentation generation (`/swagger-ui.html`) |
| **OpenPDF (`librepdf/openpdf`)** | 2.0.3 | LGPL/MPL open-source PDF rendering engine for quotations |
| **Project Lombok** | 1.18.34 | Compile-time boilerplate reduction (`@Getter`, `@Setter`, `@Builder`) |
| **Spring Boot Starter Test** | 3.3.5 | JUnit 5 Jupiter, Mockito, AssertJ, Spring MockMvc |
| **Spring Security Test** | 6.3.4 | Security context mocking and unauthorized request assertions |

### Frontend Stack (`frontend/package.json`)
| Technology / Package | Version | Purpose in Project |
| :--- | :--- | :--- |
| **Node.js Environment** | Node 20 LTS | Build and development execution environment |
| **React & React-DOM** | 18.3.1 | Core UI framework with component lifecycle and hooks |
| **Vite** | 5.4.10 | High-performance bundling and local HMR dev server |
| **Tailwind CSS & PostCSS** | 3.4.14 / 8.4.47 | Utility-first styling framework with custom slate-950 theme |
| **Lucide React** | 0.460.0 | Iconography library for toolbars, badges, and modal actions |
| **Axios** | 1.7.7 | Promise-based HTTP client with request/response JWT interceptors |
| **Konva** | 9.3.18 | High-performance 2D HTML5 canvas library |
| **React-Konva** | 18.2.10 | React bindings for Konva stages, layers, shapes, and groups |
| **Three.js** | 0.187.0 | WebGL 3D rendering engine |
| **@react-three/fiber** | 8.18.0 | React declarative renderer for Three.js |
| **@react-three/drei** | 9.122.0 | Three.js helper components (OrbitControls, TransformControls) |

### Infrastructure & DevOps Stack
| Component | Implementation | Purpose |
| :--- | :--- | :--- |
| **Database Container** | `postgres:16-alpine` | Production-grade isolated relational database |
| **Backend Container** | Multi-stage `eclipse-temurin:21-jdk-alpine` $\to$ `jre-alpine` | Hardened, unprivileged (`spring:spring`) backend runtime |
| **Frontend Container** | Multi-stage `node:20-alpine` $\to$ `nginx:alpine` | Compiled SPA static asset serving with reverse proxy |
| **Orchestration** | `docker-compose.yml` (v3.8) | Unified local and containerized system management |
| **Continuous Integration** | `.github/workflows/ci.yml` | Multi-job automated build, test, and container verification |

---

## 4. Existing Project Structure

```
d:\KitchenPlanner
├── .github/
│   └── workflows/
│       └── ci.yml                          # GitHub Actions CI workflow (3 jobs)
├── backend/
│   ├── data/                               # Local persistent H2 database files
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/kitchencraft/
│   │   │   │   ├── config/                 # SecurityConfig, OpenApiConfig, ApplicationConfig, DataInitializer
│   │   │   │   ├── controller/             # Auth, Project, Design, Material, Estimate, Quotation, User, Health
│   │   │   │   ├── dto/
│   │   │   │   │   ├── request/            # 11 Request DTOs with Bean Validation
│   │   │   │   │   └── response/           # 12 Response DTOs
│   │   │   │   ├── entity/                 # User, Project, Design, DesignCabinet, Material, Quotation, QuotationItem
│   │   │   │   ├── exception/              # GlobalExceptionHandler, Custom Runtime Exceptions
│   │   │   │   ├── repository/             # 7 Spring Data JPA Repositories
│   │   │   │   ├── security/               # JwtService, JwtAuthenticationFilter, JwtAuthenticationEntryPoint
│   │   │   │   ├── service/                # Business interfaces
│   │   │   │   │   └── impl/               # Transactional service implementations
│   │   │   │   └── KitchenCraftApplication.java
│   │   │   └── resources/
│   │   │       ├── db/migration/           # Flyway SQL migrations: V1, V2, V3, V4
│   │   │       ├── application.yml         # Base configuration with environment overrides
│   │   │       ├── application-local.yml   # Local file-based H2 profile
│   │   │       └── application-test.yml    # In-memory test profile
│   │   └── test/java/com/kitchencraft/     # 11 Test Classes (55 automated tests)
│   ├── Dockerfile                          # Multi-stage Java 21 Alpine image
│   ├── mvnw / mvnw.cmd                     # Maven Wrapper v3.9+
│   └── pom.xml                             # Maven build configuration
├── frontend/
│   ├── public/                             # Static favicon and assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/                       # AuthModal.jsx (Sign in / Register)
│   │   │   ├── canvas/                     # KitchenCanvas.jsx, GridLayer.jsx, CabinetItem.jsx (Konva 2D)
│   │   │   ├── canvas3d/                   # KitchenScene3D.jsx, Room3D.jsx, CabinetMesh.jsx (Three.js 3D)
│   │   │   ├── dashboard/                  # ProjectDashboard.jsx
│   │   │   ├── editor/                     # KitchenEditor.jsx, Toolbar, Catalog, Inspector, Dimensions
│   │   │   ├── estimate/                   # EstimateModal.jsx, ComparisonModal.jsx
│   │   │   ├── quotation/                  # QuotationsModal.jsx
│   │   │   └── studio/                     # RealisticVisualizer.jsx, RealisticScene3D.jsx, RealisticCabinet3D.jsx
│   │   ├── services/                       # 7 Axios service modules (api, auth, project, design, etc.)
│   │   ├── utils/                          # coordinates.js, coordinates.test.js, layoutTemplates.js, realisticTextures.js
│   │   ├── App.jsx                         # Root application shell (state-driven conditional view)
│   │   ├── index.css                       # Tailwind directives
│   │   └── main.jsx                        # React 18 DOM entry point
│   ├── Dockerfile                          # Multi-stage Node 20 -> Nginx Alpine image
│   ├── nginx.conf                          # Nginx reverse proxy, gzip, SPA fallback, caching
│   ├── package.json                        # Frontend dependencies & scripts
│   └── vite.config.js                      # Vite bundling configuration
├── docs/
│   └── INTERVIEW_PREPARATION_GUIDE.md      # Comprehensive technical interview guide
├── documentation/
│   └── .gitkeep
├── .env.example                            # Externalized environment variables template
├── docker-compose.yml                      # Full-stack Docker Compose definition
└── README.md                               # Complete system documentation
```

---

## 5. Feature Implementation Inventory

The table below catalogs every functional area evaluated against the real codebase:

| Feature / Area | Current Status | Evidence / File Location | Identified Problems & Limitations | Technical Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **1. Authentication & Authorization** | Partially Implemented | `AuthController.java`, `JwtService.java`, `SecurityConfig.java` | 24-hour static JWT; no refresh token rotation; tokens stored in browser `localStorage` (XSS vulnerability). Hardcoded demo seed. | Implement refresh token rotation via HTTP-only Secure SameSite cookies; add password complexity validation. |
| **2. User Management** | Partially Implemented | `User.java`, `UserController.java`, `UserRepository.java` | Only self-profile (`/api/v1/users/profile`) is exposed. No password reset, user profile editing, or user administration APIs. | Build user profile update, password reset flow (tokenized email), and platform administration endpoints. |
| **3. Business Management** | Missing | None in codebase | No `Business` or `Tenant` entity exists. The application cannot model design firms, manufacturers, or branches. | Create `businesses` table, tenant scoping on all operational tables, and business profile configuration. |
| **4. Customer Management** | Partially Implemented | `Project.java` (columns `client_name`, `client_email`, `client_phone`) | Customers are flattened as non-relational strings inside `projects` and `quotations`. No standalone Customer entity. | Extract dedicated `customers` entity with communication logs, address books, and project associations. |
| **5. Kitchen Project Management** | Fully Implemented | `ProjectController.java`, `ProjectServiceImpl.java`, `Project.java` | Projects support CRUD, status tracking, and strict ownership isolation per authenticated user. | Add pagination, full-text search, and project duplication / archiving features. |
| **6. Room Measurements** | Fully Implemented | `Design.java`, `RoomDimensionsPanel.jsx`, `coordinates.js` | Dimension fields (`roomWidthMm`, `roomLengthMm`, `roomHeightMm`) with live boundary clamping. Only supports rectangular rooms. | Introduce polygon/L-shaped room boundary definitions, angled walls, and architectural door/window cutouts. |
| **7. 2D Kitchen Design** | Fully Implemented | `KitchenCanvas.jsx`, `CabinetItem.jsx`, `GridLayer.jsx` | 50mm grid snapping, millimeter scaling, AABB collision detection, and drag-and-drop placement. No undo/redo stack. | Implement an in-memory Command Pattern undo/redo history stack and oriented bounding box (OBB) collision checks. |
| **8. 3D Kitchen Visualization** | Fully Implemented | `KitchenScene3D.jsx`, `Room3D.jsx`, `CabinetMesh.jsx` | Synchronized WebGL 3D rendering, OrbitControls, direct floor dragging, WebGLErrorBoundary. Basic parametric geometry only. | Introduce GLTF/GLB asset loading for realistic cabinet door profiles, handles, sinks, and built-in appliances. |
| **9. Cabinets & Components** | Fully Implemented | `CabinetType.java`, `DesignCabinet.java`, `CabinetCatalogPanel.jsx` | 7 core types supported (`BASE`, `SINK_BASE`, `HOB_BASE`, `DRAWER_BASE`, `WALL`, `TALL`, `CORNER`) with metric dimensions. | Allow custom parametric dimensions, filler strips, corner blind units, and internal drawer/shelf configurations. |
| **10. Materials & Finishes** | Fully Implemented | `MaterialController.java`, `MaterialServiceImpl.java`, `V3 Migration` | Catalogue for Carcass, Shutter, Countertop, and Hardware with rates. Catalogue is currently global across all users. | Scope materials to specific businesses (`tenant_id`) and allow custom contractor price markups. |
| **11. Appliances & Fixtures** | Partially Implemented | Seeded in `V3 Migration` under `HARDWARE` category | Appliances (Hob, Sink) exist only as hardware cost line items, not as distinct 3D visual geometry fixtures. | Create dedicated `Appliances` catalogue with cut-out dimensions and realistic 3D mesh representations. |
| **12. Cost Estimation** | Fully Implemented | `CostEstimationServiceImpl.java`, `EstimateController.java` | Mathematical panel derivations, zero-trust backend computation, customizable wastage, labour, installation, discount, and tax. | Add tier-based margin rules, hardware accessory multipliers, and multi-tier contractor pricing packages. |
| **13. Quotations** | Fully Implemented | `QuotationServiceImpl.java`, `QuotationController.java`, `V4 Migration` | Immutable price snapshots, state machine (`DRAFT` $\to$ `ISSUED` $\to$ `CANCELLED`), unique quotation numbers. | Add client quotation acceptance portals with electronic signatures and client revision requests. |
| **14. PDF Generation** | Fully Implemented | `PdfGenerationServiceImpl.java`, OpenPDF 2.0.3 | Renders professional branded A4 PDFs with itemized BOM tables, GST breakdowns, terms, and signature blocks. | Offload synchronous generation to background worker queue for high-concurrency enterprise workloads. |
| **15. Design Saving & Loading** | Implemented (Sub-optimal) | `KitchenEditor.jsx` (`handleSave`), `DesignServiceImpl.java` | Saving a layout triggers sequential individual HTTP requests per cabinet (N+1 network calls), causing latency and partial saves. | Implement a single atomic batch save endpoint (`PUT /api/v1/designs/{id}/layout`) wrapped in a single database transaction. |
| **16. Design Version History** | Partially Implemented | `Design.java` (column `version`), composite unique constraint | Backend schema supports version numbering per project, but frontend lacks a version switching / branching UI. | Build frontend version management UI allowing designers to branch, compare, and roll back layout versions. |
| **17. File & Image Uploads** | Missing (Client-only) | `RealisticVisualizer.jsx` (local `FileReader` dataURL) | No backend file upload controller or storage service exists. Photos cannot be saved to the database or shared across devices. | Integrate AWS S3 or MinIO storage with secure presigned URLs and image validation pipelines. |
| **18. Dashboard & Analytics** | Partially Implemented | `ProjectDashboard.jsx` | Lists user projects with creation dates and client names. No analytics, conversion rates, or revenue pipeline tracking. | Add dashboard widgets showing total quotation value, win/loss ratios, active project stages, and material costs. |
| **19. Responsive UI** | Partially Implemented | `ProjectDashboard.jsx`, `KitchenEditor.jsx` | Dashboard is mobile-friendly; 2D/3D Editor is heavily desktop-optimized and unworkable on screens under 1024px. | Provide a dedicated read-only mobile 3D client viewer and tablet-optimized touch manipulation mode. |
| **20. Security Enforcement** | Partially Implemented | `JwtAuthenticationFilter.java`, `SecurityConfig.java` | Strong horizontal IDOR project checks in services. Public H2 console enabled; demo account passwords hardcoded in code. | Remove demo seeding from production profiles; disable H2 console in production; add rate limiting. |
| **21. Automated Testing** | Partially Implemented | 55 backend tests in `backend/src/test`; 1 test script in frontend | Backend test coverage is exceptional (100% pass rate). Frontend has zero Jest/Vitest UI component tests. | Setup Vitest and React Testing Library for frontend components and Playwright for browser E2E flows. |
| **22. Deployment Automation** | Partially Implemented | `Dockerfile`, `docker-compose.yml`, `.github/workflows/ci.yml` | Multi-stage Docker and CI build verification exist. No automated CD deployment to cloud staging or production. | Add automated GitHub Actions deployment jobs deploying backend to Render/Railway and frontend to Vercel. |

---

## 6. Current Architecture Assessment

```mermaid
flowchart TD
    subgraph Client["Frontend Client Tier (React 18 + Vite)"]
        UI["React SPA (Tailwind CSS)"]
        Router["State-Driven Navigation (App.jsx)"]
        Konva2D["2D Floor Planner (React Konva)"]
        Scene3D["3D Spatial Visualizer (Three.js / R3F)"]
        Studio["Realistic Room Photo Composite (Studio)"]
        AxiosClient["Axios Interceptor (Bearer JWT)"]

        UI --> Router
        Router --> Konva2D
        Router --> Scene3D
        Router --> Studio
        Konva2D --> AxiosClient
        Scene3D --> AxiosClient
    end

    subgraph Edge["Gateway & Web Server Tier"]
        Nginx["Nginx Reverse Proxy (:80)"]
        CORS["CORS Preflight & Security Headers"]
        Nginx --> CORS
        CORS --> AxiosClient
    end

    subgraph Security["Spring Security 6 Tier"]
        AuthFilter["JwtAuthenticationFilter"]
        EntryPoint["JwtAuthenticationEntryPoint"]
        SecurityConfig["Stateless SecurityFilterChain"]
        AuthFilter --> SecurityConfig
    end

    subgraph Application["Application Service Tier (Spring Boot 3.3.5)"]
        AuthCtrl["AuthController / UserController"]
        ProjectCtrl["ProjectController"]
        DesignCtrl["DesignController"]
        EstimateCtrl["EstimateController"]
        QuoteCtrl["QuotationController"]
        MaterialCtrl["MaterialController"]

        AuthService["AuthServiceImpl (BCrypt, JJWT)"]
        ProjectService["ProjectServiceImpl (@Transactional)"]
        DesignService["DesignServiceImpl (@Transactional)"]
        CostEngine["CostEstimationServiceImpl (BigDecimal Engine)"]
        QuoteService["QuotationServiceImpl (State Machine)"]
        PdfEngine["PdfGenerationServiceImpl (OpenPDF A4)"]
        MaterialService["MaterialServiceImpl"]

        SecurityConfig --> AuthCtrl & ProjectCtrl & DesignCtrl & EstimateCtrl & QuoteCtrl & MaterialCtrl

        AuthCtrl --> AuthService
        ProjectCtrl --> ProjectService
        DesignCtrl --> DesignService
        EstimateCtrl --> CostEngine
        QuoteCtrl --> QuoteService
        QuoteService --> PdfEngine
        MaterialCtrl --> MaterialService
    end

    subgraph Data["Persistence Tier (Spring Data JPA)"]
        Repos["JPA Repositories (Fetch Joins)"]
        Flyway["Flyway Migration Engine (V1 - V4)"]
        Postgres[("PostgreSQL 16 DB (Prod/Dev)")]
        H2File[("Local H2 File DB (data/kitchencraft_db)")]

        ProjectService & DesignService & CostEngine & QuoteService & MaterialService --> Repos
        Repos --> Postgres
        Repos -.-> H2File
        Flyway --> Postgres
    end

    Edge --> Security
```

### Architectural Evaluation
- **Monolith vs. Microservices:** The application is architecturally constructed as a **modular monolith**. This is an **excellent, pragmatic decision** for the current team size (1 developer) and target market scale. Distributing this system into microservices (e.g., separating quotation, 3D assets, and pricing into distinct services) would introduce massive distributed transaction overhead, network latency, and operational complexity without justifiable benefit.
- **Tightly Coupled State in Editor:** `KitchenEditor.jsx` manages 446 lines of component state (cabinets, dirty flags, modals, view modes, errors, dimensions). While manageable, as features grow (undo/redo, multi-room, lighting adjustments), this state should be centralized using a lightweight store such as **Zustand**.
- **The Sequential Network Loop (N+1 HTTP Calls):**
  In `KitchenEditor.jsx` (lines 280–313):
  ```javascript
  // Anti-pattern: Sequential network calls in a loop
  for (const delId of deletedCabinetIds) {
    await designService.deleteCabinet(design.id, delId);
  }
  for (const cab of design.cabinets) {
    if (cab.id < 0) {
      await designService.addCabinet(design.id, payload);
    } else {
      await designService.updateCabinet(design.id, cab.id, payload);
    }
  }
  ```
  If a design has 20 cabinets and the user moves 5 of them and deletes 2, saving causes 7 sequential HTTP requests. If the 4th request encounters a network dropout, the server is left in an inconsistent state.

---

## 7. Frontend Audit

### Component Architecture & State Management
- **Conditional Rendering Shell:** `App.jsx` uses simple local state (`isAuthenticated`, `activeProject`, `activeDesign`) to switch between `<AuthModal>`, `<ProjectDashboard>`, and `<KitchenEditor>`. There is no router library (`react-router-dom`). Consequently:
  - Deep linking is impossible (users cannot bookmark or share a direct link to a design).
  - The browser's native Back and Forward buttons break application flow, reloading or exiting the editor.
- **Styling & Theming:** Implemented with Tailwind CSS using a slate dark theme (`bg-slate-950`, `bg-slate-900`, `text-brand-400`). Contrast ratios on interactive controls are sharp and visually appealing.
- **Responsive Design Audit:**
  - `ProjectDashboard.jsx`: Fully responsive across mobile, tablet, and desktop viewports using CSS grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).
  - `KitchenEditor.jsx`: Rigidly fixed to desktop displays. On mobile viewports (< 768px), the 2D Konva canvas, catalog panel, and inspector panel collide and become unreadable.
- **Error Handling & Feedback:**
  - Network errors are captured by Axios interceptors (`frontend/src/services/api.js`).
  - An unsaved changes warning (`beforeunload` event) prevents accidental tab closure when `isDirty` is true.

---

## 8. Backend Audit

### Spring Boot & Java 21 Code Quality
- **Layering Integrity:** Strict separation between Controller, DTO, Entity, Repository, and Service layers. Controllers contain no business or mathematical logic.
- **DTO Safety:** Entities are never returned directly from controllers. All responses are strongly typed DTOs mapped explicitly.
- **Database Transaction Boundaries:** Service methods modifying multiple entities (e.g., `QuotationServiceImpl.createQuotation`) are decorated with `@Transactional`, guaranteeing ACID compliance.
- **Exception Handling:** `GlobalExceptionHandler.java` catches validation errors, entity conflicts, not-found exceptions, and authorization failures, transforming them into standard RFC-7807-style error payloads.

```java
// Evidence: Exception Handling Structure (GlobalExceptionHandler.java)
@ExceptionHandler(ResourceNotFoundException.class)
public ResponseEntity<ErrorResponse> handleResourceNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
    ErrorResponse error = ErrorResponse.builder()
            .timestamp(Instant.now())
            .status(HttpStatus.NOT_FOUND.value())
            .error(HttpStatus.NOT_FOUND.getReasonPhrase())
            .message(ex.getMessage())
            .path(request.getRequestURI())
            .build();
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
}
```

---

## 9. PostgreSQL and Database Audit

### Database Schemas & Migrations (Flyway)
The production schema is managed through 4 automated Flyway SQL migrations:
1. `V1__create_users_table.sql`: Creates `users` table with unique email index and role columns.
2. `V2__create_projects_and_designs_schema.sql`: Creates `projects`, `designs`, and `design_cabinets` with cascading foreign keys and unique version constraints.
3. `V3__create_materials_schema_and_seed.sql`: Creates `materials` table and populates benchmark pricing for Carcass, Shutter, Countertop, and Hardware fittings.
4. `V4__create_quotations_schema.sql`: Creates `quotations` and `quotation_items` snapshot tables.

### Existing Entity-Relationship Diagram (Verified Codebase)

```mermaid
erDiagram
    USERS ||--o{ PROJECTS : "owns"
    PROJECTS ||--o{ DESIGNS : "contains"
    DESIGNS ||--o{ DESIGN_CABINETS : "places"
    PROJECTS ||--o{ QUOTATIONS : "issues"
    DESIGNS ||--o{ QUOTATIONS : "references"
    QUOTATIONS ||--o{ QUOTATION_ITEMS : "details"

    USERS {
        bigint id PK
        string email UK
        string password_hash
        string full_name
        string role
        boolean active
        timestamp created_at
        timestamp updated_at
    }

    PROJECTS {
        bigint id PK
        bigint owner_id FK
        string name
        string client_name
        string client_email
        string client_phone
        text client_address
        string status
        timestamp created_at
        timestamp updated_at
    }

    DESIGNS {
        bigint id PK
        bigint project_id FK
        string name
        int version
        int room_width_mm
        int room_length_mm
        int room_height_mm
        string layout_type
        text layout_data_json
        timestamp created_at
        timestamp updated_at
    }

    DESIGN_CABINETS {
        bigint id PK
        bigint design_id FK
        string cabinet_type
        int width_mm
        int depth_mm
        int height_mm
        double pos_x_mm
        double pos_y_mm
        double pos_z_mm
        double rotation_deg
        string carcass_material
        string shutter_material
        string finish_color
        text notes
        timestamp created_at
        timestamp updated_at
    }

    MATERIALS {
        bigint id PK
        string name UK
        string category
        string unit
        numeric unit_price
        text description
        boolean active
        timestamp created_at
        timestamp updated_at
    }

    QUOTATIONS {
        bigint id PK
        bigint project_id FK
        bigint design_id FK
        string quotation_number UK
        int version
        string status
        string client_name
        string client_email
        string client_phone
        string carcass_material_snapshot
        string shutter_material_snapshot
        string countertop_material_snapshot
        numeric material_subtotal
        numeric wastage_percentage
        numeric wastage_amount
        numeric labor_percentage
        numeric labor_amount
        numeric installation_percentage
        numeric installation_amount
        numeric gross_subtotal
        numeric discount_percentage
        numeric discount_amount
        numeric net_taxable_amount
        numeric tax_percentage
        numeric tax_amount
        numeric final_total
        date valid_until
        timestamp issued_at
        text notes
        timestamp created_at
        timestamp updated_at
    }

    QUOTATION_ITEMS {
        bigint id PK
        bigint quotation_id FK
        string item_description
        string category
        numeric quantity
        string unit
        numeric unit_price
        numeric total_price
        string calculation_notes
        int sort_order
    }
```

### Critical Database Integrity Findings
1. **Dialect Mismatch in CI & Local Dev:** Both `application-local.yml` and `application-test.yml` disable Flyway (`flyway.enabled: false`) and rely on Hibernate schema auto-generation (`hibernate.ddl-auto: update` or `create-drop`) using H2. While this enables rapid local development without Docker, it means **Flyway scripts are never validated during automated CI pushes**.
2. **Missing Database Indexes:**
   - In `designs`, there is an index on `project_id`, but no composite index on `(project_id, updated_at DESC)` for high-speed listing.
   - In `quotations`, `quotation_number` has a unique index, but query-heavy filtering by `(project_id, status)` requires a composite index.

---

## 10. API Audit

All existing REST APIs were verified directly against Spring MVC controllers:

| Method | Endpoint | Purpose | Exists? | Authentication | Required Role | Current Implementation Status |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| `POST` | `/api/v1/auth/register` | Register new user account | Yes | Public | None | Fully Working (BCrypt hashing, returns JWT) |
| `POST` | `/api/v1/auth/login` | Authenticate credentials | Yes | Public | None | Fully Working (Validates password, returns JWT) |
| `GET` | `/api/v1/auth/me` | Fetch authenticated profile | Yes | Bearer JWT | Authenticated | Fully Working (Resolves from SecurityContext) |
| `GET` | `/api/v1/users/profile` | Get current user profile | Yes | Bearer JWT | Authenticated | Fully Working (Duplicate of `/auth/me`) |
| `POST` | `/api/v1/projects` | Create kitchen project | Yes | Bearer JWT | Authenticated | Fully Working (Assigns owner to current user) |
| `GET` | `/api/v1/projects` | List user's projects | Yes | Bearer JWT | Authenticated | Fully Working (Filters by owner ID) |
| `GET` | `/api/v1/projects/{id}` | Get project details | Yes | Bearer JWT | Authenticated | Fully Working (Enforces owner check) |
| `PUT` | `/api/v1/projects/{id}` | Update project metadata | Yes | Bearer JWT | Authenticated | Fully Working (Enforces owner check) |
| `DELETE` | `/api/v1/projects/{id}` | Delete project & cascade | Yes | Bearer JWT | Authenticated | Fully Working (Cascades deletion) |
| `POST` | `/api/v1/projects/{id}/designs` | Create design version | Yes | Bearer JWT | Authenticated | Fully Working (Validates room dimensions) |
| `GET` | `/api/v1/projects/{id}/designs` | List project designs | Yes | Bearer JWT | Authenticated | Fully Working (Returns version summaries) |
| `GET` | `/api/v1/designs/{id}` | Get full design layout | Yes | Bearer JWT | Authenticated | Fully Working (Fetch joins all cabinets) |
| `PUT` | `/api/v1/designs/{id}` | Update room & layout | Yes | Bearer JWT | Authenticated | Fully Working (Updates dimensions & JSON) |
| `POST` | `/api/v1/designs/{id}/cabinets` | Add single cabinet | Yes | Bearer JWT | Authenticated | Fully Working (Appends cabinet to design) |
| `PUT` | `/api/v1/designs/{id}/cabinets/{cId}` | Move/update cabinet | Yes | Bearer JWT | Authenticated | Fully Working (Updates pos, rot, finish) |
| `DELETE` | `/api/v1/designs/{id}/cabinets/{cId}` | Remove cabinet | Yes | Bearer JWT | Authenticated | Fully Working (Removes cabinet record) |
| `GET` | `/api/v1/materials` | List active catalogue items | Yes | Bearer JWT | Authenticated | Fully Working (Optional `?category=` filter) |
| `GET` | `/api/v1/materials/{id}` | Get single material | Yes | Bearer JWT | Authenticated | Fully Working |
| `POST` | `/api/v1/materials` | Add new catalogue item | Yes | Bearer JWT | Authenticated | **Vulnerability:** Open to ALL authenticated users |
| `PUT` | `/api/v1/materials/{id}` | Update catalogue item | Yes | Bearer JWT | Authenticated | **Vulnerability:** Open to ALL authenticated users |
| `POST` | `/api/v1/designs/{id}/estimate` | Calculate itemized BOM | Yes | Bearer JWT | Authenticated | Fully Working (Deterministic backend calculation) |
| `POST` | `/api/v1/designs/{id}/estimate/compare` | Compare 2 material options | Yes | Bearer JWT | Authenticated | Fully Working (Side-by-side package variance) |
| `POST` | `/api/v1/designs/{id}/quotations` | Freeze immutable quotation | Yes | Bearer JWT | Authenticated | Fully Working (Creates snapshot records) |
| `GET` | `/api/v1/projects/{id}/quotations` | List project quotations | Yes | Bearer JWT | Authenticated | Fully Working (Summarizes quote versions) |
| `GET` | `/api/v1/quotations/{id}` | Get quotation breakdown | Yes | Bearer JWT | Authenticated | Fully Working (Itemized BOM snapshot) |
| `PATCH` | `/api/v1/quotations/{id}/status` | Transition quote status | Yes | Bearer JWT | Authenticated | Fully Working (Enforces state machine) |
| `GET` | `/api/v1/quotations/{id}/pdf` | Download official PDF | Yes | Bearer JWT | Authenticated | Fully Working (Streams binary PDF header) |
| `GET` | `/api/v1/health` | Application health probe | Yes | Public | None | Fully Working (Returns JSON status) |
| `GET` | `/actuator/health` | Spring Boot Actuator | Yes | Public | None | Fully Working (Docker healthcheck target) |

---

## 11. Authentication and Security Audit

### Threat Modeling & Risk Categorization

#### 1. CRITICAL: Hardcoded Demonstration Accounts in Source Code
- **Location:** `backend/src/main/java/com/kitchencraft/config/DataInitializer.java` (lines 31–32)
- **Finding:** The backend automatically seeds user accounts with plaintext passwords on every startup:
  ```java
  seedUserAccount("apurvachothe@gmail.com", "Apurva Chothe", "Password123!");
  seedUserAccount("demo@kitchencraft.com", "Demo Designer", "Password123!");
  ```
- **Risk:** If deployed to production with `application.yml`, an attacker can authenticate immediately using these hardcoded accounts and compromise the system.
- **Remediation:** Remove hardcoded credentials. Wrap development seeding strictly inside an `@Profile({"dev", "local"})` annotation.

#### 2. HIGH: Unprotected Material Catalogue Modification (Privilege Escalation)
- **Location:** `backend/src/main/java/com/kitchencraft/controller/MaterialController.java` (lines 49–72)
- **Finding:** Endpoints `POST /api/v1/materials` and `PUT /api/v1/materials/{id}` are authenticated, but lack role restrictions (`@PreAuthorize("hasRole('ADMIN')")`). Any registered standard user can overwrite benchmark material rates, altering cost calculations across the entire platform.
- **Remediation:** Annotate write methods with `@PreAuthorize("hasRole('ADMIN')")` or scope materials per tenant.

#### 3. HIGH: Static JWT Lifespan & Lack of Refresh Token Rotation
- **Location:** `backend/src/main/java/com/kitchencraft/security/JwtService.java`
- **Finding:** Tokens are issued with a 24-hour expiration (`86,400,000 ms`) and stored in the browser's `localStorage`. No refresh token mechanism exists. If an access token is intercepted or exfiltrated via XSS, the attacker has a 24-hour window with zero possibility of token revocation.
- **Remediation:** Shorten access token lifespan to 15 minutes. Implement a rotating refresh token stored in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie backed by a database revocation table.

#### 4. MEDIUM: Public H2 Console Exposure in Security Filter
- **Location:** `backend/src/main/java/com/kitchencraft/config/SecurityConfig.java` (line 56)
- **Finding:** `/h2-console/**` is permitted publicly in the Spring Security filter chain.
- **Remediation:** Wrap `/h2-console/**` matcher inside an active profile condition so it is never exposed in production.

#### 5. MEDIUM: Lack of Authentication Rate Limiting
- **Location:** `backend/src/main/java/com/kitchencraft/controller/AuthController.java`
- **Finding:** No rate limiting or brute-force protection exists on `/api/v1/auth/login` or `/api/v1/auth/register`.
- **Remediation:** Integrate Bucket4j or Redis rate limiting to enforce a maximum of 5 failed login attempts per minute per IP.

---

## 12. 2D Design Engine Audit

### Implementation Assessment (`KitchenCanvas.jsx`, `CabinetItem.jsx`)
- **Coordinate Transformation:** The engine maps real-world millimeters into screen pixels dynamically:
  $$\text{Scale} = \min\left(\frac{\text{AvailableWidth}}{\text{RoomWidth}_{\text{mm}}}, \frac{\text{AvailableHeight}}{\text{RoomLength}_{\text{mm}}}\right)$$
  Cabinets render at exact scale with a 50 mm visual grid step and automatic room centering.
- **Boundary Clamping:** Clamps cabinet coordinates inside wall limits:
  $$\text{maxX} = \text{roomWidthMm} - \text{widthMm}, \quad \text{maxY} = \text{roomLengthMm} - \text{depthMm}$$
  Prevents cabinets from accidentally floating outside the room blueprint.
- **Vertical Level Collision Logic:**
  Wall cabinets mounted at standard height ($Z \ge 1400\text{ mm}$) do not trigger collision warnings when positioned above floor base units ($Z < 1000\text{ mm}$), matching real-world architectural design.

### Technical Limitations in Current 2D Engine
1. **Unrotated Bounding Box Assumption:** Collision detection in `coordinates.js` uses standard Axis-Aligned Bounding Boxes (AABB). If a cabinet is rotated by 90° or 270°, its physical footprint on the floor swaps width and depth ($600 \times 300 \to 300 \times 600$), but the collision check continues testing unrotated dimensions.
2. **Absence of Undo / Redo History:** There is no history stack (`undoList` / `redoList`). If a user accidentally deletes a cabinet or moves an item, the action cannot be undone.
3. **Rectangular-Only Geometry:** Rooms can only be modeled as simple 4-wall rectangles. Irregular architectural rooms (angled cutouts, columns, chimney breasts) cannot be represented.

---

## 13. 3D Visualization Audit

### Implementation Assessment (`KitchenScene3D.jsx`, `RealisticVisualizer.jsx`)
- **Metric Transformation:** Seamlessly converts top-left 2D millimeter space into centered 3D meter space:
  $$X_{\text{3D}} = \frac{X_{\text{2D}} + \frac{W}{2} - \frac{\text{RoomW}}{2}}{1000}, \quad Y_{\text{3D}} = \frac{Z + \frac{H}{2}}{1000}, \quad Z_{\text{3D}} = \frac{Y_{\text{2D}} + \frac{D}{2} - \frac{\text{RoomL}}{2}}{1000}$$
- **Direct Floor Dragging & Transform Controls Gizmo:** Designers can click and drag cabinets directly across the 3D floor plane with camera lock, or toggle a translation/rotation gizmo for millimeter adjustments.
- **Procedural PBR Textures (`realisticTextures.js`):** Generates procedural HTML5 canvas textures for Terrazzo stone, natural oak wood grain, and marble veins. This eliminates heavy texture image downloads while maintaining high visual realism.
- **Realistic Studio Visualizer:** Features an interactive before/after split slider comparing raw site room photos against the live 3D cabinet composite.

### Technical Limitations in Current 3D Engine
1. **Parameterized Box Meshes:** Cabinets are rendered as solid procedural boxes with color shaders rather than detailed 3D models with recessed handles, shaker panels, or bevelled edges.
2. **Client-Only Photo Composite:** Site photos uploaded into `RealisticVisualizer.jsx` reside strictly in browser memory via `FileReader.readAsDataURL()`. They are lost as soon as the designer refreshes the page.

---

## 14. SaaS and Multi-Tenant Readiness

Currently, KitchenPlanner is a **single-user system**. Every project and design is owned by an individual user (`owner_id = user.id`). To evolve into a commercial platform for modular kitchen companies, it must support multi-tenant organizations.

### Multi-Tenancy Architecture Comparison

| Model | Isolation Level | Infrastructure Cost | Operational Complexity | Suitability for KitchenPlanner |
| :--- | :--- | :--- | :--- | :--- |
| **1. Shared DB, Shared Schema (Tenant ID)** | Logical (Row-Level Security / Hibernate Filters) | **Lowest** (Single DB instance, maximum connection pooling) | Low (Requires `tenant_id` on all operational tables) | **Strongly Recommended (Initial to Medium Scale)** |
| **2. Separate Schema per Tenant** | Medium (Distinct schemas inside single PostgreSQL DB) | Moderate (Higher metadata overhead as schemas grow) | High (Migration scripts must run across hundreds of schemas) | Not Recommended for current stage |
| **3. Separate Database per Tenant** | Physical (Dedicated DB per customer) | High (Massive idle memory, expensive cloud DBs) | Very High (Complex routing, cross-tenant analytics impossible) | Overkill; only justifiable for enterprise on-premise |

### Recommended Multi-Tenant Structure
Adopt **Model 1 (Shared Database, Shared Schema with Tenant ID)**:
- Create a `businesses` table representing the tenant.
- Create a `business_members` join table mapping `users` to `businesses` with specific organization roles:
  - `OWNER`: Full administrative, billing, and margin control.
  - `MANAGER`: Can view all projects, approve quotations, and adjust catalogues.
  - `DESIGNER`: Can draft 2D/3D layouts and generate cost estimates.
  - `CLIENT / VIEWER`: Read-only 3D layout viewer access.
- Scope `materials`, `projects`, `customers`, and `quotations` to `business_id`.

---

## 15. Proposed Future Database Design

The following comprehensive relational schema is designed for multi-tenant commercial operations without requiring changes to existing database entities today:

```mermaid
erDiagram
    BUSINESSES ||--o{ BUSINESS_MEMBERS : "employs"
    USERS ||--o{ BUSINESS_MEMBERS : "joins"
    BUSINESSES ||--o{ CUSTOMERS : "manages"
    BUSINESSES ||--o{ PROJECTS : "owns"
    CUSTOMERS ||--o{ PROJECTS : "commissions"
    PROJECTS ||--o{ KITCHEN_ROOMS : "contains"
    KITCHEN_ROOMS ||--o{ DESIGNS : "houses"
    DESIGNS ||--o{ DESIGN_VERSIONS : "versions"
    DESIGN_VERSIONS ||--o{ CABINETS : "places"
    BUSINESSES ||--o{ MATERIALS : "catalogues"
    MATERIALS ||--o{ MATERIAL_VARIANTS : "specifies"
    BUSINESSES ||--o{ APPLIANCES : "catalogues"
    DESIGN_VERSIONS ||--o{ ESTIMATES : "calculates"
    ESTIMATES ||--o{ ESTIMATE_ITEMS : "details"
    PROJECTS ||--o{ QUOTATIONS : "issues"
    QUOTATIONS ||--o{ QUOTATION_ITEMS : "details"
    BUSINESSES ||--o{ SUBSCRIPTIONS : "subscribes"
    SUBSCRIPTIONS ||--o{ PAYMENTS : "records"
    BUSINESSES ||--o{ AUDIT_LOGS : "logs"

    BUSINESSES {
        uuid id PK
        string legal_name
        string brand_name
        string gstin
        string contact_email
        string contact_phone
        string address_json
        string logo_url
        boolean active
        timestamp created_at
    }

    BUSINESS_MEMBERS {
        uuid id PK
        uuid business_id FK
        bigint user_id FK
        string role
        boolean active
        timestamp joined_at
    }

    CUSTOMERS {
        uuid id PK
        uuid business_id FK
        string full_name
        string email
        string phone
        string address_line1
        string city
        string pincode
        string notes
        timestamp created_at
    }

    PROJECTS {
        uuid id PK
        uuid business_id FK
        uuid customer_id FK
        bigint assigned_designer_id FK
        string name
        string site_address
        string status
        timestamp created_at
    }

    KITCHEN_ROOMS {
        uuid id PK
        uuid project_id FK
        string name
        int floor_number
        int ceiling_height_mm
        string wall_polygon_geojson
    }

    DESIGNS {
        uuid id PK
        uuid room_id FK
        string name
        uuid active_version_id
        timestamp created_at
    }

    DESIGN_VERSIONS {
        uuid id PK
        uuid design_id FK
        int version_number
        int room_width_mm
        int room_length_mm
        int room_height_mm
        string layout_type
        jsonb layout_metadata
        timestamp created_at
    }

    CABINETS {
        uuid id PK
        uuid design_version_id FK
        string cabinet_type
        int width_mm
        int depth_mm
        int height_mm
        double pos_x
        double pos_y
        double pos_z
        double rotation_deg
        uuid carcass_material_id FK
        uuid shutter_material_id FK
        string finish_color
    }

    MATERIALS {
        uuid id PK
        uuid business_id FK
        string name
        string category
        string unit
        numeric base_price
        boolean is_global
    }

    QUOTATIONS {
        uuid id PK
        uuid business_id FK
        uuid project_id FK
        uuid design_version_id FK
        string quotation_number UK
        string status
        numeric subtotal
        numeric gst_amount
        numeric grand_total
        timestamp valid_until
        timestamp issued_at
    }

    SUBSCRIPTIONS {
        uuid id PK
        uuid business_id FK
        string plan_tier
        string billing_cycle
        string status
        timestamp current_period_end
    }

    PAYMENTS {
        uuid id PK
        uuid subscription_id FK
        string gateway_payment_id
        numeric amount
        string currency
        string status
        timestamp paid_at
    }
```

---

## 16. Proposed API Roadmap

The table below outlines the future API groups required for full commercial SaaS operation:

| Group | Method | Endpoint | Purpose | Role |
| :--- | :--- | :--- | :--- | :--- |
| **Tenant** | `POST` | `/api/v2/businesses` | Register new business workspace | `USER` |
| **Tenant** | `GET` | `/api/v2/businesses/current` | Retrieve active business profile & logo | `MEMBER` |
| **Members** | `POST` | `/api/v2/businesses/members/invite` | Send invite to designer/staff | `OWNER` |
| **Members** | `PATCH` | `/api/v2/businesses/members/{id}/role` | Update role (`DESIGNER`, `MANAGER`) | `OWNER` |
| **Customers** | `POST` | `/api/v2/customers` | Create client record | `DESIGNER` |
| **Customers** | `GET` | `/api/v2/customers` | Search/list business customers | `DESIGNER` |
| **Layouts** | `PUT` | `/api/v2/designs/{id}/batch` | **Atomic layout save** (replaces N+1 calls) | `DESIGNER` |
| **Storage** | `POST` | `/api/v2/storage/presigned-url` | Generate S3 presigned upload URL | `DESIGNER` |
| **Appliances**| `GET` | `/api/v2/appliances` | Catalogue of sinks, hobs, and chimneys | `MEMBER` |
| **Billing** | `POST` | `/api/v2/subscriptions/checkout` | Create Razorpay / Stripe checkout session | `OWNER` |
| **Webhooks** | `POST` | `/api/v2/webhooks/payment` | Handle subscription renewal / webhook | Public / Signed |

---

## 17. UI/UX and Product Experience Audit

### User Experience Analysis
1. **Onboarding & First-Run Experience:**
   - *Current State:* Direct jump from login to empty project dashboard.
   - *Recommendation:* Introduce an interactive 3-step walkthrough guiding new users to create their first kitchen, select an architectural layout shape (L-Shape, Straight, Island), and generate an instant sample quotation.
2. **2D to 3D Viewport Switching:**
   - *Current State:* Seamless toggle bar in the toolbar maintaining active camera views.
   - *Improvement:* Provide a split-screen view mode (`2D on Left | 3D on Right`) for ultra-wide desktop monitors, allowing simultaneous layout drafting and real-time 3D spatial feedback.
3. **Quotation & Estimation Workflow:**
   - *Current State:* Modal-based calculations. Responsive and clear display of financial subtotals.
   - *Improvement:* Allow direct customization of company headers, customer terms & conditions, and discount coupons within the UI prior to PDF generation.

---

## 18. Testing and Quality Assurance Audit

### Automated Test Verification Summary

The test execution suite was inspected directly from Surefire report outputs:

```
[INFO] Results:
[INFO] 
[INFO] Tests run: 55, Failures: 0, Errors: 0, Skipped: 0
[INFO] Total time: 20.515 s
[INFO] BUILD SUCCESS
```

| Test Class | Scope / Tested Workflow | Total Tests | Pass Rate |
| :--- | :--- | :---: | :---: |
| `FullPlatformEndToEndIntegrationTest` | Unified lifecycle: Register $\to$ Project $\to$ Design $\to$ Cabinets $\to$ Reload $\to$ Estimate $\to$ Quotation $\to$ PDF $\to$ Tenant Boundary Checks | 1 | 100% |
| `AuthControllerTest` | Registration, login, validation, duplicate email prevention, 401 unauthorized handling | 8 | 100% |
| `ProjectAndDesignIntegrationTest` | Project CRUD, design versioning, boundary clamping, ownership isolation | 4 | 100% |
| `MaterialAndEstimateIntegrationTest` | Material catalogue queries, estimate math, side-by-side package comparison | 10 | 100% |
| `QuotationIntegrationTest` | Full quotation lifecycle, PDF download, and historical price snapshot preservation | 2 | 100% |
| `CostEstimationServiceTest` | Multi-cabinet calculations (Tall, Corner, Drawer, Sink, Hob, Wall), boundary discounts & taxes | 7 | 100% |
| `MaterialServiceTest` | Catalogue queries, duplicate prevention, and update isolation | 7 | 100% |
| `QuotationServiceTest` | Price snapshotting, state machine transitions, binary PDF header validation | 6 | 100% |
| `JwtServiceTest` | Token generation, validation, expiration parsing, and malformed header rejection | 4 | 100% |
| `AuthServiceTest` | Authentication, profile extraction, and duplicate conflict handling | 5 | 100% |
| `KitchenCraftApplicationTests` | Spring Boot context load sanity check | 1 | 100% |
| `frontend/src/utils/coordinates.test.js` | 2D/3D coordinate transforms, 50mm snapping, room clamping, AABB collision logic | 8 assertions | 100% |
| **Total Verified** | **Complete Full-Stack Application Test Suite** | **55 Java + 8 FE** | **100% PASS** |

### QA Gaps Identified
- **No True PostgreSQL Integration Testing:** Tests run against in-memory H2 with Flyway disabled. Real dialect discrepancies (PostgreSQL `JSONB`, timestamp precision, sequence handling) are untested.
- **Missing Frontend Component Tests:** There are zero unit tests for React components (`KitchenEditor`, `CabinetInspectorPanel`, `AuthModal`).

---

## 19. DevOps and Deployment Audit

### Current Deployment Evaluation
- **Docker Compose:** Spawns `postgres:16-alpine`, `kitchencraft-backend`, and `kitchencraft-frontend` with healthcheck dependencies. Fully working for local orchestration.
- **Multi-Stage Dockerfiles:**
  - `backend/Dockerfile`: Uses JDK 21 Alpine builder stage and JRE Alpine runtime stage. Hardened with non-root user `spring:spring`.
  - `frontend/Dockerfile`: Uses Node 20 builder stage and Nginx Alpine runtime stage. Configured with client-side routing fallback and API proxying.

### Cloud Deployment Strategy for a Solo Developer

```mermaid
flowchart LR
    GitHub["GitHub Repository<br/>(main branch)"] --> Actions["GitHub Actions CI<br/>(Verify & Package)"]
    Actions --> Vercel["Vercel / Netlify CDN<br/>(React Frontend SPA)"]
    Actions --> Render["Render / Railway PaaS<br/>(Dockerized Spring Boot API)"]
    Render --> Neon["Neon.tech / Supabase<br/>(Managed PostgreSQL 16)"]
    Render --> S3["AWS S3 / Cloudflare R2<br/>(Quotation PDFs & Photos)"]
```

#### Cost-Effective Cloud Sizing Options

| Tier | Component | Recommended Provider | Specs | Estimated Monthly Cost |
| :--- | :--- | :--- | :--- | :--- |
| **Initial / Staging** | Frontend SPA | **Vercel** / **Netlify** | Global Edge CDN, Free SSL | \$0.00 (Free Tier) |
| | Backend API | **Render** / **Railway** | 512 MB – 1 GB RAM, 0.5 vCPU | \$0.00 – \$7.00 / mo |
| | PostgreSQL DB | **Neon.tech** | 0.5 GB storage, connection pooling | \$0.00 (Free Tier) |
| | Object Storage | **Cloudflare R2** | 10 GB storage, zero egress fees | \$0.00 (Free Tier) |
| | **Total Initial** | | | **\$0 – \$7 / month** |
| **Commercial Scale** | Frontend SPA | **Vercel Pro** | High bandwidth, team features | \$20.00 / mo |
| | Backend API | **Hetzner Cloud VPS** or **AWS ECS** | 4 GB RAM, 2 vCPU (Dockerized) | \$15.00 – \$35.00 / mo |
| | PostgreSQL DB | **AWS RDS** or **Neon Pro** | Managed PostgreSQL 16, auto-backups | \$25.00 – \$50.00 / mo |
| | Domain & SSL | **Cloudflare** | DNS management, WAF, DDoS protection | \$10.00 / year |
| | Email & SMS | **Resend** or **Amazon SES** | Transactional emails & PDF delivery | \$0.00 – \$10.00 / mo |
| | **Total Commercial** | | | **~\$70 – \$115 / month** |

---

## 20. Legal and Compliance Considerations (India)

*Research Date: November 2026. Requirements based on official Indian statutes. Professional legal/CA review recommended before commercial launch.*

### 1. Digital Personal Data Protection Act, 2023 (DPDP Act, 2023)
- **Role Classification:** KitchenPlanner operates as a **Data Fiduciary** for designer/business accounts and a **Data Processor** for the client contact details uploaded by kitchen contractors.
- **Mandatory Obligations:**
  - Notice & Consent: Clear, itemized consent notices in English and scheduled regional languages prior to collecting client names, phone numbers, and site addresses.
  - Data Minimization: Store only the client details necessary for quotation generation and room planning.
  - Rights of Data Principals: Implement user self-service tools for data access, correction, and permanent account erasure ("Right to be Forgotten").
  - Security Safeguards: Prevent unauthorized access to customer floor plans and financial quotations. Penalties under the Act for significant security failures can reach up to ₹250 crore.

### 2. Information Technology Act, 2000 & CERT-In Directives
- **Incident Reporting:** Under CERT-In Directions (April 2022), any cybersecurity breach or unauthorized access must be reported to the Indian Computer Emergency Response Team (CERT-In) within **6 hours** of detection.
- **Log Retention:** Mandatory maintenance of system audit logs for a rolling period of **180 days** within Indian jurisdiction.

### 3. Goods and Services Tax (GST) Compliance
- **SaaS Subscription Invoicing:** Software subscription access is classified under **SAC Code 997331** (Licensing services for the right to use computer software) or **SAC 998314** (IT infrastructure provisioning).
- **Applicable GST Rate:** Standard **18% GST** (Intra-state: 9% CGST + 9% SGST; Inter-state: 18% IGST).
- **Quotation Invoicing Rules:** The corporate PDFs generated for customers must separate taxable value, CGST, SGST, IGST, and display the contractor's 15-digit GSTIN.

### 4. Software Licensing Compliance
- **OpenPDF License (LGPL / MPL):** OpenPDF is licensed under LGPL and Mozilla Public License. Utilizing OpenPDF as an unmodified dynamic dependency (`pom.xml`) in a backend web service to generate PDFs **does not require open-sourcing the proprietary application code**.
- **Three.js, Konva, React, Spring Boot:** All operate under permissive **MIT or Apache 2.0** licenses, permitting commercial SaaS exploitation.

---

## 21. Commercial Business Model

### Target Audience & Persona Segmentation
1. **Independent Freelance Designers:** Need quick 2D room layouts, rapid cost estimation, and formal branded PDFs to close residential clients.
2. **Modular Kitchen Retail Showrooms & Studios:** Require multi-designer management, custom pricing margins, branded quotations, and 3D visual showcase tools.
3. **Kitchen Manufacturers & Franchise Outlets:** Need standardized dealer catalogues, production-ready BOM exports, and central pricing control across franchise branches.

### Recommended Pricing Tiers (Indian Modular Market)

| Feature / Quota | Starter Tier (Freelancer) | Professional Tier (Studio) | Business Tier (Manufacturer) |
| :--- | :---: | :---: | :---: |
| **Target Price (INR)** | **₹1,299 / month** (or ₹12,990 / year) | **₹3,999 / month** (or ₹39,990 / year) | **₹9,999 / month** (or ₹99,990 / year) |
| **Designer Seats** | 1 Designer | Up to 3 Designers | Up to 10 Designers (+ ₹699/seat) |
| **Active Projects** | 10 Active Projects | Unlimited Projects | Unlimited Projects |
| **2D Floor Planning** | Yes (50mm snapping) | Yes (Custom snapping) | Yes (Custom CAD shapes) |
| **3D Visualization** | Standard Procedural | Realistic Studio Textures | 4K Realistic Studio Renders |
| **Quotation Engine** | Standard PDF Export | Custom Logo & Branding | White-Label, Multi-Branch |
| **Catalogue Pricing** | Standard Benchmark Rates | Custom Studio Rates & Margins | Multi-Dealer Catalogue Sync |
| **Cloud Storage** | 2 GB File Storage | 15 GB File Storage | 100 GB File Storage |
| **Support SLA** | Email Support (48h) | Priority WhatsApp Support (12h) | Dedicated Account Manager |

---

## 22. Freelancing and Portfolio Readiness

KitchenPlanner is exceptionally well-suited to serve as a **flagship portfolio project** for Senior Java Backend Developer, Full-Stack Engineer, and DevOps opportunities.

### Key Competencies Demonstrated to Recruiters & Clients
1. **Modern Java & Spring Boot Mastery:** Demonstrates clean separation of concerns, Java 21 LTS features, Spring Data JPA query optimization, and transaction boundaries.
2. **Deterministic Mathematical Domain Modeling:** Demonstrates ability to translate physical manufacturing formulas (panel surface area derivations, board yields, anti-drip overhangs) into exact `BigDecimal` code.
3. **Legal Snapshot Design:** Highlights deep architectural maturity by avoiding naive table joins and instead freezing historical price snapshots in legal quotations.
4. **DevOps & Infrastructure Fluency:** Demonstrates containerization using multi-stage Docker builds, healthchecks, and an automated GitHub Actions CI pipeline running 55 tests.

### Recommended Portfolio Collateral to Prepare
- **Live Hosted Demo:** Deploy the application to Vercel and Render with seed demo data so recruiters can test 2D/3D planning in their browsers with zero setup.
- **Architectural Case Study:** Publish a detailed technical blog post or repository documentation detailing:
  - Coordinate transformation mathematics between 2D Konva and 3D Three.js.
  - Why `double` causes floating-point drift in invoicing and how `BigDecimal` solves it.
  - Multi-stage Docker image reduction from 600MB down to 180MB.
- **5-Minute Video Walkthrough:** Record a high-resolution video showing a complete project walkthrough: drafting a layout, placing cabinets, switching to 3D, computing a cost comparison, and downloading the corporate quotation PDF.

---

## 23. Risk Register

| Risk Event | Category | Severity | Probability | Impact | Recommended Mitigation |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Production Credential Leak via Seed Data** | Security | **CRITICAL** | High | System Compromise | Remove hardcoded passwords in `DataInitializer.java`; gate seeding strictly behind local development profiles. |
| **Catalogue Rate Tampering (IDOR / RBAC)** | Security | **HIGH** | Medium | Financial Skewing | Restrict `POST/PUT /api/v1/materials` to administrative roles (`ROLE_ADMIN`) and scope catalogues to specific tenants. |
| **Layout State Desynchronization (N+1 Save)** | Performance | **HIGH** | High | Data Loss / Corrupt Layouts | Replace sequential individual HTTP calls with an atomic `PUT /api/v1/designs/{id}/batch` transactional endpoint. |
| **Dialect Mismatch in CI Testing** | Database | **MEDIUM** | High | Production Migration Failure | Configure GitHub Actions CI to execute tests directly against the provisioned PostgreSQL 16 service container. |
| **Token Theft via Browser Storage** | Security | **MEDIUM** | Medium | Session Hijacking | Migrate JWT storage from `localStorage` to `HttpOnly`, `SameSite=Strict` secure cookies with short expiration. |
| **Large Concurrent PDF Memory Spikes** | Scalability | **MEDIUM** | Low | Server Out-of-Memory | Offload PDF generation to a background worker queue (RabbitMQ / Redis) for enterprise volumes. |
| **Non-Compliance with DPDP Act 2023** | Legal | **HIGH** | Low | Regulatory Fines | Implement privacy consent popups, customer data deletion flows, and appoint a data grievance officer. |

---

## 24. Prioritized Development Roadmap

This roadmap is specifically scaled for **one full-time senior developer**, balancing high architectural stability with commercially viable milestones:

```mermaid
flowchart TD
    P0["Phase 0: Project Audit & Discovery (COMPLETED)"]
    P1["Phase 1: Security Hardening & Batch API Fix (Weeks 1-2)"]
    P2["Phase 2: Client Routing & State Refactoring (Weeks 3-4)"]
    P3["Phase 3: Multi-Tenancy & Business Workspaces (Weeks 5-7)"]
    P4["Phase 4: Customer Management & Site Dimensions (Weeks 8-9)"]
    P5["Phase 5: 2D CAD Enhancements & Undo/Redo (Weeks 10-12)"]
    P6["Phase 6: 3D Visual Realism & GLTF Assets (Weeks 13-15)"]
    P7["Phase 7: Cloud Storage & Site Photo Uploads (Weeks 16-17)"]
    P8["Phase 8: Quotation Customization & Client Portal (Weeks 18-20)"]
    P9["Phase 9: Subscription Billing & Payment Gateway (Weeks 21-22)"]
    P10["Phase 10: Legal Compliance & Production Deployment (Weeks 23-24)"]

    P0 --> P1 --> P2 --> P3 --> P4 --> P5 --> P6 --> P7 --> P8 --> P9 --> P10
```

### Phase Details

#### Phase 1: Security Hardening, Credential Sanitization & Atomic Batch API
- **Priority:** Must Have (Highest)
- **Estimated Duration:** 2 Weeks
- **Backend Tasks:**
  - Remove hardcoded default credentials from `DataInitializer.java`; gate under `@Profile({"dev", "local"})`.
  - Disable `/h2-console/**` in production security configurations.
  - Add `@PreAuthorize("hasRole('ADMIN')")` to material catalogue write operations.
  - Implement atomic batch layout endpoint: `PUT /api/v1/designs/{id}/layout` accepting `{ dimensions, cabinets: [...] }` wrapped in a single database transaction.
- **Frontend Tasks:**
  - Refactor `KitchenEditor.jsx` `handleSave()` to make a single atomic PUT request.
  - Remove the auto-fill demonstration credentials banner from `AuthModal.jsx`.
- **Database Tasks:**
  - Enable Flyway execution in CI pipeline against PostgreSQL 16 container.
- **Acceptance Criteria:** Zero hardcoded credentials in codebase; layout saves occur in a single network round-trip; CI validates Flyway against live PostgreSQL.

#### Phase 2: Client-Side Routing & Centralized State Store
- **Priority:** Must Have
- **Estimated Duration:** 2 Weeks
- **Frontend Tasks:**
  - Install and configure `react-router-dom` v6.
  - Create bookmarkable URLs: `/projects`, `/projects/:id`, `/designs/:id`, `/quotations/:id`.
  - Implement a global **Zustand** store replacing fragmented editor state.

#### Phase 3: Multi-Tenancy, Business Entities & RBAC
- **Priority:** Must Have
- **Estimated Duration:** 3 Weeks
- **Backend Tasks:**
  - Create Flyway migration `V5` introducing `businesses` and `business_members` tables.
  - Add `tenant_id` column to `projects`, `materials`, and `quotations`.
  - Implement tenant context resolver extracting active business ID from JWT claims.
- **Frontend Tasks:**
  - Build Business Profile setup screen (company legal name, GSTIN, logo upload).
  - Add staff invitation and role assignment interface.

#### Phase 4: Dedicated Customer Management & Multi-Room Support
- **Priority:** Should Have
- **Estimated Duration:** 2 Weeks
- **Backend Tasks:**
  - Create dedicated `customers` entity with full CRUD and project associations.
  - Add `kitchen_rooms` entity allowing multiple rooms per project (e.g., Main Kitchen, Utility, Wet Kitchen).
- **Frontend Tasks:**
  - Build Customer Directory panel on Dashboard with search and history.

#### Phase 5: 2D Design Engine Enhancements & Undo/Redo History
- **Priority:** Should Have
- **Estimated Duration:** 3 Weeks
- **Frontend Tasks:**
  - Implement in-memory Command Pattern for undo (`Ctrl+Z`) and redo (`Ctrl+Y`).
  - Upgrade collision detection in `coordinates.js` from AABB to Oriented Bounding Box (OBB) to properly handle rotated cabinets.
  - Add dimension callout labels directly onto cabinet faces in 2D.

#### Phase 6: 3D Visualization Enhancements & GLTF Asset Loading
- **Priority:** Should Have
- **Estimated Duration:** 3 Weeks
- **Frontend Tasks:**
  - Introduce GLTF/GLB loader for realistic cabinet handles, sinks, and gas hobs.
  - Add soft shadows and ambient contact occlusion via Three.js shaders.

#### Phase 7: Server-Side Object Storage & Room Photo Persistence
- **Priority:** Should Have
- **Estimated Duration:** 2 Weeks
- **Backend Tasks:**
  - Integrate AWS S3 / Cloudflare R2 client service for secure file storage.
  - Provide presigned URL generation endpoints for site photos and quotation PDFs.
- **Frontend Tasks:**
  - Refactor `RealisticVisualizer.jsx` to upload site photos to cloud storage and persist photo URLs in design metadata.

#### Phase 8: Quotation Customization & Client Approval Portal
- **Priority:** Should Have
- **Estimated Duration:** 3 Weeks
- **Backend Tasks:**
  - Allow businesses to upload custom quotation header banners and customize terms.
  - Create public read-only quotation view endpoint secured by unguessable UUID.
- **Frontend Tasks:**
  - Build a responsive Client Approval portal where homeowners can review 3D layouts, inspect line items, and click "Accept Quotation".

#### Phase 9: Subscription Billing & Payment Gateway Integration
- **Priority:** Must Have (for Commercial Launch)
- **Estimated Duration:** 2 Weeks
- **Backend Tasks:**
  - Integrate **Razorpay** / **Stripe** subscription webhook handlers.
  - Enforce seat limits and project quotas based on subscription tier.
- **Frontend Tasks:**
  - Build Pricing & Subscription upgrade dialog.

#### Phase 10: Legal Compliance, Security Audit & Cloud Launch
- **Priority:** Must Have
- **Estimated Duration:** 2 Weeks
- **Deliverables:**
  - Terms of Service, Privacy Policy (DPDP Act 2023 compliant), and Cookie Consent banner.
  - Production infrastructure deployment on Vercel (Frontend), Render/VPS (Backend), and Neon/RDS (PostgreSQL).

---

## 25. Estimated Development Timeline

| Milestone | Target Horizon | Cumulative Weeks | Deliverable |
| :--- | :---: | :---: | :--- |
| **Milestone 1: Hardened Core** | Month 1 | Weeks 1 – 4 | Security fixed, atomic batch saves, client routing, Zustand store |
| **Milestone 2: Multi-Tenant Studio** | Month 2 | Weeks 5 – 9 | Business accounts, team seats, customer CRM, multi-room layouts |
| **Milestone 3: Advanced CAD & 3D** | Month 4 | Weeks 10 – 15 | Undo/redo stack, OBB rotation physics, GLTF realistic 3D assets |
| **Milestone 4: Cloud Media & Quotations** | Month 5 | Weeks 16 – 20 | S3 storage, persistent site photos, public client approval portal |
| **Milestone 5: Commercial SaaS Launch** | Month 6 | Weeks 21 – 24 | Razorpay billing, DPDP compliance, production cloud deployment |

---

## 26. Critical Issues to Address First

Before adding any new features or expanding the UI, execute these 5 immediate fixes:

1. **Delete Hardcoded Seed Passwords:** In `DataInitializer.java`, remove hardcoded user accounts or restrict execution to `@Profile({"dev", "local"})`.
2. **Remove Demo Login Banner:** In `AuthModal.jsx`, eliminate the auto-fill demonstration box displaying plaintext test credentials.
3. **Build the Atomic Batch Save Endpoint:** Create `PUT /api/v1/designs/{id}/layout` in `DesignController.java` to eliminate the N+1 sequential loop in `KitchenEditor.jsx`.
4. **Lock Down Material Catalogue Write Endpoints:** Add `@PreAuthorize("hasRole('ADMIN')")` to `MaterialController.java` on `POST` and `PUT` methods.
5. **Verify Flyway in CI:** Modify `.github/workflows/ci.yml` to run test suites with `flyway.enabled: true` against the live PostgreSQL 16 container.

---

## 27. Final Recommendations

1. **Retain the Modular Monolith:** Resist any temptation to break this application into microservices. The Spring Boot + React modular architecture is fast, maintainable, and cost-efficient for a solo engineer.
2. **Double Down on the Math & Invoicing Advantage:** The true competitive differentiator of KitchenPlanner over generic 3D tools (like SketchUp or Planner5D) is its **deterministic financial calculation engine** and **legally immutable quotation snapshots**. Continue refining the bill of materials accuracy.
3. **Target Local Indian Kitchen Studios First:** Begin customer discovery with 5 to 10 local modular kitchen contractors in Pune, Bangalore, or Mumbai. Offer them free access in exchange for testing real site layouts and quotation workflows.

---

## 28. Immediate Next Steps

- [ ] **Step 1:** Review this audit report thoroughly and prioritize architectural goals.
- [ ] **Step 2:** Decide on the target operational model: Portfolio showcase vs. Commercial SaaS product.
- [ ] **Step 3:** Grant explicit authorization to commence **Phase 1: Security Hardening & Atomic Batch API**.

---
*Report compiled and verified by Antigravity Technical Audit Team.*
