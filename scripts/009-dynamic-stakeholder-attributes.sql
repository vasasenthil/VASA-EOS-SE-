-- Create table for stakeholder categories (formerly types)
CREATE TABLE IF NOT EXISTS stakeholder_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE stakeholder_categories IS 'Defines the categories or types of stakeholders (e.g., Government Body, NGO, Academic Institution).';
COMMENT ON COLUMN stakeholder_categories.name IS 'The unique name of the stakeholder category.';
COMMENT ON COLUMN stakeholder_categories.is_active IS 'Whether this category is currently active and can be assigned.';

-- Create table for stakeholder roles in implementation
CREATE TABLE IF NOT EXISTS stakeholder_implementation_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE stakeholder_implementation_roles IS 'Defines the roles a stakeholder can play within a specific policy implementation (e.g., Lead Implementer, Funder, Advisor).';
COMMENT ON COLUMN stakeholder_implementation_roles.name IS 'The unique name of the implementation role.';
COMMENT ON COLUMN stakeholder_implementation_roles.is_active IS 'Whether this role is currently active and can be assigned.';

-- Alter the implementation_stakeholders table
-- Add new foreign key columns. These are made nullable initially to handle existing data.
-- In a full migration, you would populate these, then make them NOT NULL, and drop old columns.
ALTER TABLE implementation_stakeholders
ADD COLUMN IF NOT EXISTS stakeholder_category_id UUID REFERENCES stakeholder_categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS implementation_role_id UUID REFERENCES stakeholder_implementation_roles(id) ON DELETE SET NULL;

COMMENT ON COLUMN implementation_stakeholders.stakeholder_category_id IS 'Foreign key to the stakeholder_categories table.';
COMMENT ON COLUMN implementation_stakeholders.implementation_role_id IS 'Foreign key to the stakeholder_implementation_roles table.';

-- Add triggers to update 'updated_at' timestamp
-- Ensure the function trigger_set_updated_at() exists from a previous script (e.g., 001-create-policies-table.sql)
-- If not, you would need to define it:
-- CREATE OR REPLACE FUNCTION trigger_set_updated_at()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   NEW.updated_at = NOW();
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_stakeholder_categories_updated_at
BEFORE UPDATE ON stakeholder_categories
FOR EACH ROW
EXECUTE FUNCTION trigger_set_updated_at();

CREATE OR REPLACE TRIGGER set_stakeholder_implementation_roles_updated_at
BEFORE UPDATE ON stakeholder_implementation_roles
FOR EACH ROW
EXECUTE FUNCTION trigger_set_updated_at();
