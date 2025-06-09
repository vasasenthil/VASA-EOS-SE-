-- Define the core governance tiers for the Indian School Education System
-- The level_order indicates hierarchy: 1 is the highest.

INSERT INTO governance_tiers (name, level_order, description) VALUES
('Central Level', 1, 'National level governing and policy-making bodies.'),
('State/UT Level', 2, 'State or Union Territory level educational authorities and bodies.'),
('Regional/Divisional Level', 3, 'Administrative divisions within states, overseeing multiple districts.'),
('District Level', 4, 'District-level educational administration and offices.'),
('Block Level', 5, 'Sub-district level resource and administrative centers.'),
('Cluster Level', 6, 'A small group of schools for local coordination and support.'),
('Institutional Level (Schools)', 7, 'Individual schools and educational institutions.')
ON CONFLICT (name) DO UPDATE SET
  level_order = EXCLUDED.level_order,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- You might want to add more specific tiers if needed,
-- for example, if KVS/NVS have their own distinct operational tiers
-- that don't neatly fit into the above. For now, their central bodies
-- will be at the 'Central Level' and their schools at 'Institutional Level'.
