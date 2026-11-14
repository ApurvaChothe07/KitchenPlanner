-- Flyway Migration V2: Projects, Designs and Cabinets Schema

CREATE TABLE IF NOT EXISTS projects (
    id BIGSERIAL PRIMARY KEY,
    owner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    client_name VARCHAR(150),
    client_email VARCHAR(255),
    client_phone VARCHAR(50),
    client_address TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

CREATE TABLE IF NOT EXISTS designs (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL DEFAULT 'Initial Design',
    version INT NOT NULL DEFAULT 1,
    room_width_mm INT NOT NULL,
    room_length_mm INT NOT NULL,
    room_height_mm INT NOT NULL,
    layout_type VARCHAR(50) NOT NULL DEFAULT 'L_SHAPED',
    layout_data_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_designs_project_version UNIQUE (project_id, version)
);

CREATE INDEX IF NOT EXISTS idx_designs_project ON designs(project_id);

CREATE TABLE IF NOT EXISTS design_cabinets (
    id BIGSERIAL PRIMARY KEY,
    design_id BIGINT NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
    cabinet_type VARCHAR(50) NOT NULL,
    width_mm INT NOT NULL,
    depth_mm INT NOT NULL,
    height_mm INT NOT NULL,
    pos_x_mm DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    pos_y_mm DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    pos_z_mm DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    rotation_deg DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    carcass_material VARCHAR(100),
    shutter_material VARCHAR(100),
    finish_color VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_design_cabinets_design ON design_cabinets(design_id);
CREATE INDEX IF NOT EXISTS idx_design_cabinets_type ON design_cabinets(cabinet_type);
