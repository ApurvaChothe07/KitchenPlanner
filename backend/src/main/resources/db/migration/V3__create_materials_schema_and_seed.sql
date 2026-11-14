-- Flyway Migration V3: Materials Schema and Sample Pricing Seed Data

CREATE TABLE IF NOT EXISTS materials (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_active ON materials(active);
CREATE INDEX IF NOT EXISTS idx_materials_name ON materials(name);

-- Sample illustrative seed pricing (clearly labeled as sample pricing)
INSERT INTO materials (name, category, unit, unit_price, description, active) VALUES
-- Carcass Core Materials
('BWR Plywood (IS 303)', 'CARCASS', 'SQFT', 95.00, '[Sample Pricing] Commercial boiling water resistant 18mm core', true),
('BWP Marine Plywood (IS 710)', 'CARCASS', 'SQFT', 130.00, '[Sample Pricing] Premium 18mm 710 marine plywood core', true),
('HDHMR Board (Moisture Resistant)', 'CARCASS', 'SQFT', 85.00, '[Sample Pricing] High-density moisture-resistant 18mm board', true),
('MDF Board (Pre-laminated)', 'CARCASS', 'SQFT', 65.00, '[Sample Pricing] Standard dry zone interior 18mm MDF board', true),

-- Shutter Finishes
('Premium Acrylic High Gloss', 'SHUTTER', 'SQFT', 220.00, '[Sample Pricing] 1.5mm acrylic sheet with seamless zero-joint edge band', true),
('Anti-Fingerprint Matte Laminate', 'SHUTTER', 'SQFT', 120.00, '[Sample Pricing] 1.0mm anti-glare anti-scratch matte laminate', true),
('PU Paint Lacquer Gloss', 'SHUTTER', 'SQFT', 280.00, '[Sample Pricing] Multi-coat automotive polyurethane lacquer finish', true),
('PVC Thermofoil Membrane', 'SHUTTER', 'SQFT', 140.00, '[Sample Pricing] Vacuum-pressed thermofoil seamless shutter wrap', true),

-- Countertop Stones
('Black Galaxy Granite (18mm)', 'COUNTERTOP', 'SQFT', 260.00, '[Sample Pricing] Natural polished black galaxy granite slab', true),
('Artificial Quartz Stone (White Vein)', 'COUNTERTOP', 'SQFT', 380.00, '[Sample Pricing] Engineered composite quartz non-porous stain-proof slab', true),
('Nano White Crystallized Glass', 'COUNTERTOP', 'SQFT', 450.00, '[Sample Pricing] Pure white non-porous crystallized glass slab', true),

-- Hardware & Accessories
('Soft-Close Concealed Hinges (Pair)', 'HARDWARE', 'PIECE', 320.00, '[Sample Pricing] Stainless steel clip-on soft-close hinges with 3D adjustment', true),
('Tandem Drawer Runner Channels (Set)', 'HARDWARE', 'PIECE', 1850.00, '[Sample Pricing] Full extension synchronized soft-close tandem runners (45kg capacity)', true),
('SS304 Edge Profile Handle', 'HARDWARE', 'PIECE', 240.00, '[Sample Pricing] Brush-finished stainless steel 304 concealed edge profile handle', true),
('SS304 Double Bowl Sink with Drainboard', 'HARDWARE', 'PIECE', 5800.00, '[Sample Pricing] Heavy-gauge 1.2mm satin finish stainless steel kitchen sink', true),
('Twin Burner Toughened Glass Gas Hob', 'HARDWARE', 'PIECE', 7500.00, '[Sample Pricing] Cast iron pan support forged brass burner built-in hob', true),
('Hydraulic Bi-Fold Lift-Up System', 'HARDWARE', 'PIECE', 3400.00, '[Sample Pricing] Overhead wall cabinet lift-up stay mechanism with variable stop', true)
ON CONFLICT (name) DO NOTHING;
