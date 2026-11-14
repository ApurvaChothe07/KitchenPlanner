-- ==============================================================================
-- V4: Create Quotations and Quotation Items Schema
-- Snapshots material prices, itemized BOM lines, and financial summaries
-- ==============================================================================

CREATE TABLE quotations (
    id BIGSERIAL PRIMARY KEY,
    quotation_number VARCHAR(50) NOT NULL UNIQUE,
    project_id BIGINT NOT NULL,
    design_id BIGINT NOT NULL,
    version INT NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    client_name VARCHAR(150),
    client_email VARCHAR(150),
    client_phone VARCHAR(50),
    carcass_material_snapshot VARCHAR(150),
    shutter_material_snapshot VARCHAR(150),
    countertop_material_snapshot VARCHAR(150),
    material_subtotal NUMERIC(12, 2) NOT NULL,
    wastage_percentage NUMERIC(5, 2) NOT NULL,
    wastage_amount NUMERIC(12, 2) NOT NULL,
    labor_percentage NUMERIC(5, 2) NOT NULL,
    labor_amount NUMERIC(12, 2) NOT NULL,
    installation_percentage NUMERIC(5, 2) NOT NULL,
    installation_amount NUMERIC(12, 2) NOT NULL,
    gross_subtotal NUMERIC(12, 2) NOT NULL,
    discount_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    net_taxable_amount NUMERIC(12, 2) NOT NULL,
    tax_percentage NUMERIC(5, 2) NOT NULL DEFAULT 18.00,
    tax_amount NUMERIC(12, 2) NOT NULL,
    final_total NUMERIC(12, 2) NOT NULL,
    valid_until DATE,
    issued_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_quotations_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_quotations_design FOREIGN KEY (design_id) REFERENCES designs(id) ON DELETE CASCADE
);

CREATE INDEX idx_quotations_project ON quotations(project_id);
CREATE INDEX idx_quotations_design ON quotations(design_id);
CREATE INDEX idx_quotations_number ON quotations(quotation_number);
CREATE INDEX idx_quotations_status ON quotations(status);

CREATE TABLE quotation_items (
    id BIGSERIAL PRIMARY KEY,
    quotation_id BIGINT NOT NULL,
    item_description VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    quantity NUMERIC(10, 4) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    total_price NUMERIC(12, 2) NOT NULL,
    calculation_notes VARCHAR(255),
    sort_order INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_quotation_items_quotation FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
);

CREATE INDEX idx_quotation_items_quotation ON quotation_items(quotation_id);
