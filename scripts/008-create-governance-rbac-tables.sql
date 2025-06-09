-- 008-create-governance-rbac-tables.sql

-- Governance Tiers (e.g., National, State, District, Block, School)
CREATE TABLE IF NOT EXISTS governance_tiers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    level_order INT UNIQUE NOT NULL, -- For sorting and hierarchical logic (e.g., National=1, State=2)
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Organizational Units (OUs)
CREATE TABLE IF NOT EXISTS organizational_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    tier_id INT NOT NULL REFERENCES governance_tiers(id),
    parent_ou_id UUID REFERENCES organizational_units(id) ON DELETE SET NULL, -- For hierarchy
    region_code VARCHAR(50) UNIQUE, -- e.g., State code, District code (can be NULL for National)
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    metadata JSONB, -- For additional tier-specific information
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ou_tier_id ON organizational_units(tier_id);
CREATE INDEX IF NOT EXISTS idx_ou_parent_ou_id ON organizational_units(parent_ou_id);

-- Roles
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL, -- e.g., NATIONAL_ADMIN, STATE_POLICY_REVIEWER
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE, -- True for predefined system roles
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Permissions
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL, -- e.g., 'create', 'read', 'update', 'delete', 'approve'
    resource VARCHAR(100) NOT NULL, -- e.g., 'policy', 'report', 'user', 'organizational_unit'
    description TEXT,
    -- Unique constraint on action + resource
    CONSTRAINT uq_permission_action_resource UNIQUE (action, resource),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Role-Permissions Junction Table
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- User-Organizational Unit Assignments (linking Supabase Auth users to OUs and Roles)
CREATE TABLE IF NOT EXISTS user_ou_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Links to Supabase auth users
    ou_id UUID NOT NULL REFERENCES organizational_units(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    is_primary_assignment BOOLEAN DEFAULT TRUE, -- A user might have multiple roles/OU assignments
    assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    -- A user should typically have one primary role per OU, or one primary role overall.
    -- This constraint might need refinement based on specific business rules.
    -- For now, let's ensure a user has a unique role within a specific OU.
    CONSTRAINT uq_user_ou_role UNIQUE (user_id, ou_id, role_id)
);
CREATE INDEX IF NOT EXISTS idx_user_ou_assignments_user_id ON user_ou_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ou_assignments_ou_id ON user_ou_assignments(ou_id);
CREATE INDEX IF NOT EXISTS idx_user_ou_assignments_role_id ON user_ou_assignments(role_id);

-- Function to update 'updated_at' column
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to tables that have 'updated_at'
DO $$
DECLARE
  tbl_name TEXT;
BEGIN
  FOR tbl_name IN 
    SELECT table_name 
    FROM information_schema.columns 
    WHERE column_name = 'updated_at' 
      AND table_schema = 'public' -- or your specific schema
      AND table_name IN ('governance_tiers', 'organizational_units', 'roles', 'permissions')
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_timestamp ON %I;', tbl_name); -- Drop if exists
    EXECUTE format('
      CREATE TRIGGER set_timestamp
      BEFORE UPDATE ON %I
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_timestamp();
    ', tbl_name);
  END LOOP;
END;
$$;

-- Seed initial governance tiers
INSERT INTO governance_tiers (name, level_order, description) VALUES
    ('National', 1, 'Central/National level governance body'),
    ('State', 2, 'State/Union Territory level governance body'),
    ('District', 3, 'District level administrative unit'),
    ('Block', 4, 'Block/Sub-District level administrative unit'),
    ('School', 5, 'Individual school/educational institution')
ON CONFLICT (name) DO NOTHING;

-- Seed some basic permissions (examples)
INSERT INTO permissions (action, resource, description) VALUES
    ('create', 'policy', 'Allows creating new policies'),
    ('read', 'policy', 'Allows reading policies'),
    ('update', 'policy', 'Allows updating existing policies'),
    ('delete', 'policy', 'Allows deleting policies'),
    ('approve', 'policy', 'Allows approving policies (general)'),
    ('manage', 'users', 'Allows managing users (inviting, assigning roles)'),
    ('manage', 'roles', 'Allows managing roles and permissions'),
    ('manage', 'ous', 'Allows managing organizational units'),
    ('view', 'dashboard_national', 'Allows viewing the national dashboard'),
    ('view', 'dashboard_state', 'Allows viewing a state-level dashboard'),
    ('view', 'dashboard_district', 'Allows viewing a district-level dashboard')
ON CONFLICT (action, resource) DO NOTHING;

-- Seed some basic roles (examples)
INSERT INTO roles (name, description, is_system_role) VALUES
    ('SYSTEM_SUPER_ADMIN', 'Has all permissions across the system.', TRUE),
    ('NATIONAL_POLICY_ADMIN', 'Manages policies at the national level.', FALSE),
    ('STATE_POLICY_ADMIN', 'Manages policies at the state level.', FALSE),
    ('DISTRICT_DATA_VIEWER', 'Views data and reports at the district level.', FALSE),
    ('SCHOOL_PRINCIPAL', 'Manages school-specific information.', FALSE)
ON CONFLICT (name) DO NOTHING;

-- Assign some permissions to roles (examples)
-- Note: You'll need to fetch the UUIDs for roles and permissions if you run this separately
-- or use subqueries if your SQL version supports it directly in INSERT ON CONFLICT.
-- This part is illustrative and might need to be done via application logic or a more complex script
-- if you don't hardcode UUIDs. For simplicity, we assume names are unique and can be used in subqueries.

DO $$
DECLARE
    super_admin_role_id UUID;
    national_admin_role_id UUID;
    state_admin_role_id UUID;

    create_policy_perm_id UUID;
    read_policy_perm_id UUID;
    update_policy_perm_id UUID;
    delete_policy_perm_id UUID;
    approve_policy_perm_id UUID;
    manage_users_perm_id UUID;
    manage_roles_perm_id UUID;
    manage_ous_perm_id UUID;
BEGIN
    -- Get Role IDs
    SELECT id INTO super_admin_role_id FROM roles WHERE name = 'SYSTEM_SUPER_ADMIN';
    SELECT id INTO national_admin_role_id FROM roles WHERE name = 'NATIONAL_POLICY_ADMIN';
    SELECT id INTO state_admin_role_id FROM roles WHERE name = 'STATE_POLICY_ADMIN';

    -- Get Permission IDs
    SELECT id INTO create_policy_perm_id FROM permissions WHERE action = 'create' AND resource = 'policy';
    SELECT id INTO read_policy_perm_id FROM permissions WHERE action = 'read' AND resource = 'policy';
    SELECT id INTO update_policy_perm_id FROM permissions WHERE action = 'update' AND resource = 'policy';
    SELECT id INTO delete_policy_perm_id FROM permissions WHERE action = 'delete' AND resource = 'policy';
    SELECT id INTO approve_policy_perm_id FROM permissions WHERE action = 'approve' AND resource = 'policy';
    SELECT id INTO manage_users_perm_id FROM permissions WHERE action = 'manage' AND resource = 'users';
    SELECT id INTO manage_roles_perm_id FROM permissions WHERE action = 'manage' AND resource = 'roles';
    SELECT id INTO manage_ous_perm_id FROM permissions WHERE action = 'manage' AND resource = 'ous';

    -- Assign all permissions to SYSTEM_SUPER_ADMIN (example of a loop)
    IF super_admin_role_id IS NOT NULL THEN
        FOR perm_record IN SELECT id FROM permissions LOOP
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (super_admin_role_id, perm_record.id)
            ON CONFLICT (role_id, permission_id) DO NOTHING;
        END LOOP;
    END IF;

    -- Assign specific permissions to NATIONAL_POLICY_ADMIN
    IF national_admin_role_id IS NOT NULL THEN
        IF create_policy_perm_id IS NOT NULL THEN
            INSERT INTO role_permissions (role_id, permission_id) VALUES (national_admin_role_id, create_policy_perm_id) ON CONFLICT (role_id, permission_id) DO NOTHING;
        END IF;
        IF read_policy_perm_id IS NOT NULL THEN
            INSERT INTO role_permissions (role_id, permission_id) VALUES (national_admin_role_id, read_policy_perm_id) ON CONFLICT (role_id, permission_id) DO NOTHING;
        END IF;
        IF update_policy_perm_id IS NOT NULL THEN
            INSERT INTO role_permissions (role_id, permission_id) VALUES (national_admin_role_id, update_policy_perm_id) ON CONFLICT (role_id, permission_id) DO NOTHING;
        END IF;
        IF approve_policy_perm_id IS NOT NULL THEN
            INSERT INTO role_permissions (role_id, permission_id) VALUES (national_admin_role_id, approve_policy_perm_id) ON CONFLICT (role_id, permission_id) DO NOTHING;
        END IF;
        -- National admin might also manage state OUs or users within them
        IF manage_ous_perm_id IS NOT NULL THEN
             INSERT INTO role_permissions (role_id, permission_id) VALUES (national_admin_role_id, manage_ous_perm_id) ON CONFLICT (role_id, permission_id) DO NOTHING;
        END IF;
    END IF;

    -- Assign specific permissions to STATE_POLICY_ADMIN
    IF state_admin_role_id IS NOT NULL THEN
        IF create_policy_perm_id IS NOT NULL THEN
            INSERT INTO role_permissions (role_id, permission_id) VALUES (state_admin_role_id, create_policy_perm_id) ON CONFLICT (role_id, permission_id) DO NOTHING;
        END IF;
        IF read_policy_perm_id IS NOT NULL THEN
            INSERT INTO role_permissions (role_id, permission_id) VALUES (state_admin_role_id, read_policy_perm_id) ON CONFLICT (role_id, permission_id) DO NOTHING;
        END IF;
        IF update_policy_perm_id IS NOT NULL THEN
            INSERT INTO role_permissions (role_id, permission_id) VALUES (state_admin_role_id, update_policy_perm_id) ON CONFLICT (role_id, permission_id) DO NOTHING;
        END IF;
        -- State admin might not delete, but can propose for approval
    END IF;

END $$;
