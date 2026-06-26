-- VASA-EOS(SE) TN — CONSOLIDATED PROVISIONING BOOTSTRAP (generated; do not edit by hand).
--
-- Run this ONCE in your Supabase / Postgres SQL editor to provision the entire schema: all tables,
-- indexes and deny-by-default row-level security. Idempotent — safe to re-run.
-- Generated from 99 migrations. Regenerate with: node scripts/build-bootstrap.mjs
--
-- After this runs, set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY and the app goes live.

begin;

-- ==== 001-create-policies-table.sql ====
-- Enable Row Level Security (RLS)
-- RLS is enabled by default on new Supabase projects, but it's good practice to ensure it.
-- alter table policies enable row level security;

-- Create the policies table
CREATE TABLE policies (
    id TEXT PRIMARY KEY DEFAULT concat('POL-', extract(year from now()), '-', substr(md5(random()::text), 1, 4)),
    title TEXT NOT NULL,
    policy_domain TEXT NOT NULL,
    version TEXT DEFAULT '1.0',
    abstract_en TEXT NOT NULL,
    abstract_hi TEXT,
    keywords TEXT[] DEFAULT '{}',
    target_audience TEXT[] DEFAULT '{}',
    lead_drafter TEXT DEFAULT 'System User',
    nep_thrust_areas TEXT[] DEFAULT '{}',
    nep_alignment_justification TEXT,
    draft_policy_document JSONB, -- Store file metadata { name, type, size, path/url }
    annexures JSONB[], -- Store array of file metadata
    internal_review_committee TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'Draft', -- e.g., Draft, Pending Internal Review, etc.
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    last_modified TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create an index on status and policy_domain for faster filtering
CREATE INDEX idx_policies_status ON policies(status);
CREATE INDEX idx_policies_policy_domain ON policies(policy_domain);
CREATE INDEX idx_policies_last_modified ON policies(last_modified);
CREATE INDEX idx_policies_created_at ON policies(created_at);

-- Create a function to update last_modified timestamp
CREATE OR REPLACE FUNCTION update_last_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.last_modified = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update last_modified on row update
CREATE TRIGGER update_policies_last_modified
BEFORE UPDATE ON policies
FOR EACH ROW
EXECUTE FUNCTION update_last_modified_column();

-- Policies for RLS (Row Level Security)
-- These are examples and should be adjusted based on your authentication and authorization needs.

-- Allow public read access to all policies (if desired)
-- create policy "Allow public read access" on policies
-- for select using (true);

-- Allow authenticated users to create policies
-- create policy "Allow authenticated users to create policies" on policies
-- for insert with check (auth.role() = 'authenticated');

-- Allow users to update their own policies (assuming a user_id column exists)
-- create policy "Allow users to update their own policies" on policies
-- for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Allow users to delete their own policies (assuming a user_id column exists)
-- create policy "Allow users to delete their own policies" on policies
-- for delete using (auth.uid() = user_id);

-- For this application, since actions are server-side with service_key,
-- RLS might be bypassed by default by the service_key.
-- However, if you plan client-side access or different roles, RLS is crucial.
-- For now, we'll assume service_key access from server actions.

COMMENT ON COLUMN policies.draft_policy_document IS 'Stores metadata for the draft policy document, e.g., { "name": "doc.pdf", "type": "application/pdf", "size": 102400, "storagePath": "user_xyz/doc.pdf" }';
COMMENT ON COLUMN policies.annexures IS 'Stores an array of metadata for annexure documents.';

-- ==== 002-create-tracking-tables.sql ====
-- Table to track the implementation status of policies
CREATE TABLE policy_implementation_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id TEXT NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    region_type TEXT NOT NULL CHECK (region_type IN ('National', 'State', 'District', 'Block', 'School_Level')), -- e.g., National, State, District
    region_code TEXT, -- Standardized code for the region (e.g., State LGD code, UDISE code for schools)
    region_name TEXT NOT NULL, -- e.g., 'India', 'Maharashtra', 'Mumbai Suburban District'
    overall_status TEXT NOT NULL DEFAULT 'Not Started' CHECK (overall_status IN ('Not Started', 'Planning', 'In Progress', 'Partially Implemented', 'Fully Implemented', 'Delayed', 'On Hold', 'Cancelled')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    target_completion_date DATE,
    actual_completion_date DATE,
    key_indicators JSONB, -- Store key performance indicators or specific metrics, e.g., { "schools_onboarded": 500, "teachers_trained": 1200 }
    summary_notes TEXT,
    last_updated_by TEXT, -- Could be a user ID or system identifier
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for faster querying
CREATE INDEX idx_policy_implementation_policy_id ON policy_implementation_status(policy_id);
CREATE INDEX idx_policy_implementation_region ON policy_implementation_status(region_type, region_name);
CREATE INDEX idx_policy_implementation_status ON policy_implementation_status(overall_status);
CREATE INDEX idx_policy_implementation_updated_at ON policy_implementation_status(updated_at);


-- Trigger to automatically update updated_at timestamp on row update
-- (Uses the same function created in 001-create-policies-table.sql)
CREATE TRIGGER update_policy_implementation_status_updated_at
BEFORE UPDATE ON policy_implementation_status
FOR EACH ROW
EXECUTE FUNCTION update_last_modified_column();

COMMENT ON TABLE policy_implementation_status IS 'Tracks the implementation progress and status of policies across various regions and administrative levels.';
COMMENT ON COLUMN policy_implementation_status.policy_id IS 'Foreign key referencing the specific policy being tracked.';
COMMENT ON COLUMN policy_implementation_status.region_type IS 'The administrative level of the region (e.g., National, State, District).';
COMMENT ON COLUMN policy_implementation_status.region_code IS 'Standardized code for the region (e.g., State LGD, UDISE).';
COMMENT ON COLUMN policy_implementation_status.region_name IS 'Name of the region where the policy implementation is tracked.';
COMMENT ON COLUMN policy_implementation_status.overall_status IS 'Current high-level status of the policy implementation in this region.';
COMMENT ON COLUMN policy_implementation_status.progress_percentage IS 'Overall progress percentage (0-100) of the implementation.';
COMMENT ON COLUMN policy_implementation_status.key_indicators IS 'JSONB field to store various quantitative metrics related to implementation.';
COMMENT ON COLUMN policy_implementation_status.summary_notes IS 'General notes or summary about the implementation status.';
COMMENT ON COLUMN policy_implementation_status.last_updated_by IS 'Identifier for the user or system that last updated this record.';

-- Future tables to consider (can be added in subsequent scripts):
-- implementation_milestones: To track specific milestones for each policy implementation.
-- (implementation_status_id, milestone_name, description, target_date, completion_date, status)
--
-- implementation_challenges: To log challenges or roadblocks encountered.
-- (implementation_status_id, challenge_title, description, reported_date, severity, status, resolution_details)
--
-- implementation_stakeholders: To map stakeholders to specific implementations.
-- (implementation_status_id, stakeholder_type, stakeholder_id, role)
--
-- implementation_documents: To link supporting documents to implementation efforts.
-- (implementation_status_id, document_name, document_type, file_metadata_json)

-- ==== 003-create-milestones-table.sql ====
-- Table to track specific milestones for each policy implementation effort
CREATE TABLE implementation_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    implementation_status_id UUID NOT NULL REFERENCES policy_implementation_status(id) ON DELETE CASCADE,
    milestone_name TEXT NOT NULL,
    description TEXT,
    target_date DATE,
    actual_completion_date DATE,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Delayed', 'Blocked', 'Cancelled')),
    responsible_entity TEXT, -- e.g., Department name, Team name
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for faster querying
CREATE INDEX idx_milestones_implementation_status_id ON implementation_milestones(implementation_status_id);
CREATE INDEX idx_milestones_status ON implementation_milestones(status);
CREATE INDEX idx_milestones_target_date ON implementation_milestones(target_date);

-- Trigger to automatically update updated_at timestamp on row update
-- (Uses the same function created in 001-create-policies-table.sql)
CREATE TRIGGER update_implementation_milestones_updated_at
BEFORE UPDATE ON implementation_milestones
FOR EACH ROW
EXECUTE FUNCTION update_last_modified_column();

COMMENT ON TABLE implementation_milestones IS 'Tracks specific, actionable milestones for each policy implementation record.';
COMMENT ON COLUMN implementation_milestones.implementation_status_id IS 'Foreign key referencing the parent policy implementation status record.';
COMMENT ON COLUMN implementation_milestones.milestone_name IS 'A concise name for the milestone (e.g., "Develop Training Materials", "Conduct Pilot Program").';
COMMENT ON COLUMN implementation_milestones.description IS 'A more detailed description of the milestone and its objectives.';
COMMENT ON COLUMN implementation_milestones.target_date IS 'The planned completion date for this milestone.';
COMMENT ON COLUMN implementation_milestones.actual_completion_date IS 'The actual date when this milestone was completed.';
COMMENT ON COLUMN implementation_milestones.status IS 'The current status of this specific milestone.';
COMMENT ON COLUMN implementation_milestones.responsible_entity IS 'The department, team, or individual responsible for this milestone.';
COMMENT ON COLUMN implementation_milestones.notes IS 'Additional notes or comments related to the milestone''s progress or challenges.';

-- After creating this table, you might want to update the `policy_implementation_status` table
-- to potentially include a summary field like `next_milestone_due_date` or `overdue_milestones_count`
-- which could be updated via triggers or application logic based on this milestones table.
-- For now, we'll keep it separate.

-- ==== 004-create-challenges-table.sql ====
-- Table to log challenges or roadblocks encountered during policy implementation
CREATE TABLE implementation_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    implementation_status_id UUID NOT NULL REFERENCES policy_implementation_status(id) ON DELETE CASCADE,
    challenge_title TEXT NOT NULL,
    description TEXT,
    category TEXT, -- e.g., Financial, Administrative, Technical, Social, Logistical
    severity TEXT NOT NULL DEFAULT 'Medium' CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed', 'Escalated')),
    reported_date DATE DEFAULT CURRENT_DATE,
    resolved_date DATE,
    resolution_details TEXT,
    reported_by TEXT, -- User ID or name of the person/system reporting
    assigned_to TEXT, -- User ID or team responsible for addressing
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for faster querying
CREATE INDEX idx_challenges_implementation_status_id ON implementation_challenges(implementation_status_id);
CREATE INDEX idx_challenges_status ON implementation_challenges(status);
CREATE INDEX idx_challenges_severity ON implementation_challenges(severity);
CREATE INDEX idx_challenges_category ON implementation_challenges(category);
CREATE INDEX idx_challenges_reported_date ON implementation_challenges(reported_date);

-- Trigger to automatically update updated_at timestamp on row update
-- (Uses the same function created in 001-create-policies-table.sql)
CREATE TRIGGER update_implementation_challenges_updated_at
BEFORE UPDATE ON implementation_challenges
FOR EACH ROW
EXECUTE FUNCTION update_last_modified_column();

COMMENT ON TABLE implementation_challenges IS 'Logs challenges, issues, or roadblocks encountered during the implementation of a policy.';
COMMENT ON COLUMN implementation_challenges.implementation_status_id IS 'Foreign key referencing the parent policy implementation status record this challenge is associated with.';
COMMENT ON COLUMN implementation_challenges.challenge_title IS 'A concise title for the challenge (e.g., "Lack of Training Infrastructure", "Low Community Awareness").';
COMMENT ON COLUMN implementation_challenges.description IS 'A detailed description of the challenge, its impact, and context.';
COMMENT ON COLUMN implementation_challenges.category IS 'Categorization of the challenge (e.g., Financial, Administrative, Technical).';
COMMENT ON COLUMN implementation_challenges.severity IS 'The assessed severity or impact level of the challenge.';
COMMENT ON COLUMN implementation_challenges.status IS 'The current status of addressing this challenge.';
COMMENT ON COLUMN implementation_challenges.reported_date IS 'The date when the challenge was first reported or identified.';
COMMENT ON COLUMN implementation_challenges.resolved_date IS 'The date when the challenge was resolved or closed.';
COMMENT ON COLUMN implementation_challenges.resolution_details IS 'Details about how the challenge was addressed or resolved.';
COMMENT ON COLUMN implementation_challenges.reported_by IS 'Identifier for the user, system, or entity that reported the challenge.';
COMMENT ON COLUMN implementation_challenges.assigned_to IS 'Identifier for the user, team, or entity assigned to address the challenge.';

-- ==== 005-create-stakeholders-table.sql ====
-- Table to store information about stakeholders involved in policy implementation
CREATE TABLE IF NOT EXISTS implementation_stakeholders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    implementation_status_id UUID NOT NULL REFERENCES policy_implementation_status(id) ON DELETE CASCADE,
    stakeholder_name TEXT NOT NULL,
    stakeholder_type TEXT CHECK (stakeholder_type IN (
        'Government Body', 
        'State Education Department',
        'District Education Office',
        'Block Education Office',
        'School Management Committee (SMC)',
        'NGO/Civil Society Organization', 
        'Educational Institution (School/College)', 
        'University/Research Institution',
        'Industry Partner/Corporate', 
        'Community Leader', 
        'Parent Association', 
        'Teacher Union/Association',
        'Student Body/Representative',
        'Funding Agency',
        'Technical Partner',
        'Media',
        'Other'
    )),
    role_in_implementation TEXT CHECK (role_in_implementation IN (
        'Lead Implementer',
        'Supporting Implementer',
        'Funder', 
        'Policy Design',
        'Advisor/Consultant', 
        'Monitoring & Evaluation', 
        'Advocacy & Awareness',
        'Capacity Building Provider',
        'Technology Provider',
        'Beneficiary Representative',
        'Affected Party',
        'Observer',
        'Other'
    )),
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    engagement_level TEXT CHECK (engagement_level IN ('High', 'Medium', 'Low', 'Consulted', 'Informed', 'Partnered')),
    influence_level TEXT CHECK (influence_level IN ('High', 'Medium', 'Low')), -- Added influence level
    interest_level TEXT CHECK (interest_level IN ('High', 'Medium', 'Low')), -- Added interest level
    contribution_summary TEXT, -- Summary of their expected or actual contribution
    challenges_anticipated TEXT, -- Potential challenges in engaging this stakeholder
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes to improve query performance
CREATE INDEX IF NOT EXISTS idx_stakeholders_implementation_status_id ON implementation_stakeholders(implementation_status_id);
CREATE INDEX IF NOT EXISTS idx_stakeholders_type ON implementation_stakeholders(stakeholder_type);
CREATE INDEX IF NOT EXISTS idx_stakeholders_role ON implementation_stakeholders(role_in_implementation);

-- Trigger to automatically update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_stakeholders_updated_at ON implementation_stakeholders;
CREATE TRIGGER set_stakeholders_updated_at
BEFORE UPDATE ON implementation_stakeholders
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

COMMENT ON TABLE implementation_stakeholders IS 'Stores information about stakeholders involved or affected by policy implementations.';
COMMENT ON COLUMN implementation_stakeholders.implementation_status_id IS 'Links to the specific policy implementation status record.';
COMMENT ON COLUMN implementation_stakeholders.stakeholder_name IS 'Name of the stakeholder (individual, group, or organization).';
COMMENT ON COLUMN implementation_stakeholders.stakeholder_type IS 'Type or category of the stakeholder.';
COMMENT ON COLUMN implementation_stakeholders.role_in_implementation IS 'The role this stakeholder plays in the implementation process.';
COMMENT ON COLUMN implementation_stakeholders.engagement_level IS 'Describes the level of engagement with this stakeholder.';
COMMENT ON COLUMN implementation_stakeholders.influence_level IS 'Assessed level of influence the stakeholder has on the implementation.';
COMMENT ON COLUMN implementation_stakeholders.interest_level IS 'Assessed level of interest the stakeholder has in the implementation.';
COMMENT ON COLUMN implementation_stakeholders.contribution_summary IS 'A brief summary of the stakeholder''s expected or actual contribution.';
COMMENT ON COLUMN implementation_stakeholders.challenges_anticipated IS 'Potential challenges or risks related to engaging this stakeholder.';

-- ==== 006-update-policies-file-storage.sql ====
-- No specific ALTER TABLE needed if JSONB columns are already flexible.
-- This script serves as a marker for the change in data structure within these JSONB fields.
-- We are transitioning from storing:
-- draft_policy_document: { name, type, size }
-- annexures: [{ name, type, size }, ...]
--
-- To storing:
-- draft_policy_document: { name, type, size, url, uploadedAt?, isPlaceholder? }
-- annexures: [{ name, type, size, url, uploadedAt?, isPlaceholder? }, ...]
--
-- Since JSONB is flexible, no explicit ALTER column type is strictly necessary
-- unless we want to enforce a new structure with constraints, which we are not doing here.
-- This comment serves as documentation for the schema evolution.

SELECT 'Policy table file storage structure updated (conceptually for JSONB fields to include url and isPlaceholder)';

-- ==== 007-add-policy-version-history.sql ====
ALTER TABLE policies
ADD COLUMN IF NOT EXISTS version_history JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN policies.version_history IS 'Stores an array of policy version snapshots or significant lifecycle events. E.g., [{ "version": "1.0", "status": "Approved", "modified_at": "timestamp", "modified_by": "user_id", "summary": "Initial approval" }]';

-- ==== 008-create-governance-rbac-tables.sql ====
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

-- Governance tiers are seeded authoritatively (the 7-tier TN model) in
-- scripts/010-define-education-governance-tiers.sql. The legacy 5-tier seed that lived here collided
-- with 010 on the level_order unique key when provisioning the full schema, so it has been removed —
-- 010 is the single source of truth for the tier rows.

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

    perm_record RECORD; -- loop variable for the grant-all-permissions cursor (was undeclared)
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

-- ==== 009-dynamic-stakeholder-attributes.sql ====
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

-- Add triggers to update 'updated_at' timestamp.
-- Define the function here (idempotent). It was previously ASSUMED to exist from an earlier script but
-- was never actually created, so these triggers failed to provision against a real database.
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_stakeholder_categories_updated_at
BEFORE UPDATE ON stakeholder_categories
FOR EACH ROW
EXECUTE FUNCTION trigger_set_updated_at();

CREATE OR REPLACE TRIGGER set_stakeholder_implementation_roles_updated_at
BEFORE UPDATE ON stakeholder_implementation_roles
FOR EACH ROW
EXECUTE FUNCTION trigger_set_updated_at();

-- ==== 010-define-education-governance-tiers.sql ====
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

-- ==== 011-create-scheme-management-tables.sql ====
-- Table for Scheme Categories
CREATE TABLE IF NOT EXISTS scheme_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Core table for Schemes
CREATE TABLE IF NOT EXISTS schemes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    objectives TEXT, -- Detailed objectives
    scheme_code TEXT UNIQUE, -- Official code if any, e.g., PM-SHRI-001
    category_id UUID REFERENCES scheme_categories(id) ON DELETE SET NULL,
    issuing_authority_ou_id UUID REFERENCES organizational_units(id) ON DELETE RESTRICT, -- OU that issued/owns the scheme
    
    funding_pattern TEXT, -- e.g., "Central: 60%, State: 40%", "100% Centrally Sponsored"
    total_budget NUMERIC(18, 2), -- Optional: total allocated budget
    budget_year VARCHAR(9), -- e.g., "2023-2024" or "2023-2028" for multi-year
    
    start_date DATE,
    end_date DATE, -- Can be null for ongoing schemes
    
    status TEXT NOT NULL DEFAULT 'Proposed' CHECK (status IN ('Proposed', 'Active', 'Inactive', 'Completed', 'Discontinued', 'Archived')),
    
    target_beneficiaries TEXT, -- Textual description of target groups (e.g., "Students of Class 1-8 in Govt. Schools", "SC/ST Girl Students")
    eligibility_criteria TEXT,
    
    website_url TEXT, -- Official scheme website
    
    created_by UUID REFERENCES auth.users(id), -- User who created the record
    updated_by UUID REFERENCES auth.users(id),
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_scheme_name_issuing_authority UNIQUE (name, issuing_authority_ou_id)
);
CREATE INDEX IF NOT EXISTS idx_schemes_category_id ON schemes(category_id);
CREATE INDEX IF NOT EXISTS idx_schemes_issuing_authority_ou_id ON schemes(issuing_authority_ou_id);
CREATE INDEX IF NOT EXISTS idx_schemes_status ON schemes(status);

-- Table for Scheme Documents (linking to Vercel Blob)
CREATE TABLE IF NOT EXISTS scheme_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheme_id UUID NOT NULL REFERENCES schemes(id) ON DELETE CASCADE,
    document_name TEXT NOT NULL, -- e.g., "Official Guidelines PDF", "Implementation Circular"
    document_type TEXT, -- e.g., "Guideline", "Circular", "Report", "Gazette Notification"
    file_path TEXT NOT NULL, -- Path in Vercel Blob storage
    file_size_kb INTEGER,
    mime_type VARCHAR(100),
    version VARCHAR(50), -- Optional document version
    publication_date DATE,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_scheme_documents_scheme_id ON scheme_documents(scheme_id);

-- Lookup table for Organizational Unit Types (if not already implicitly handled by OU metadata)
-- This helps in defining scheme applicability more generically.
CREATE TABLE IF NOT EXISTS organizational_unit_subtypes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- e.g., "Central Government School (KVS)", "State Government School", "Private Unaided School", "Private Aided School", "Navodaya Vidyalaya (NVS)"
    description TEXT,
    governance_tier_id INTEGER REFERENCES governance_tiers(id) ON DELETE SET NULL, -- Optional: typical tier this subtype belongs to (governance_tiers.id is SERIAL/int)
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- Example: An OU (a specific school) can have a primary tier (Institutional) and a subtype ("State Government School")

-- Junction table for Scheme Applicability to Organizational Unit Subtypes
CREATE TABLE IF NOT EXISTS scheme_applicability_ou_subtypes (
    scheme_id UUID NOT NULL REFERENCES schemes(id) ON DELETE CASCADE,
    ou_subtype_id UUID NOT NULL REFERENCES organizational_unit_subtypes(id) ON DELETE CASCADE,
    notes TEXT, -- Any specific conditions for this applicability
    PRIMARY KEY (scheme_id, ou_subtype_id)
);

-- Junction table for Scheme Target Governance Tiers
-- Specifies which governance levels are primarily involved in implementing or benefiting from the scheme.
CREATE TABLE IF NOT EXISTS scheme_target_governance_tiers (
    scheme_id UUID NOT NULL REFERENCES schemes(id) ON DELETE CASCADE,
    tier_id INTEGER NOT NULL REFERENCES governance_tiers(id) ON DELETE CASCADE, -- governance_tiers.id is SERIAL/int
    role_description TEXT, -- e.g., "Implementing Agency", "Monitoring Body", "Beneficiary Level"
    PRIMARY KEY (scheme_id, tier_id)
);

-- Update policies table to link schemes (optional, if policies can lead to schemes)
-- ALTER TABLE policies ADD COLUMN related_scheme_id UUID REFERENCES schemes(id) ON DELETE SET NULL;
-- CREATE INDEX IF NOT EXISTS idx_policies_related_scheme_id ON policies(related_scheme_id);

-- Enable RLS and define policies as needed for these tables later.

-- ==== 012-seed-scheme-data.sql ====
-- Seed Scheme Categories
INSERT INTO scheme_categories (name, description) VALUES
('Infrastructure Development', 'Schemes focused on improving physical and digital infrastructure in educational institutions.'),
('Teacher Professional Development', 'Schemes for training, upskilling, and capacity building of teachers and educators.'),
('Student Welfare & Scholarships', 'Schemes providing financial aid, scholarships, and support services to students.'),
('Digital Education & EdTech', 'Schemes promoting the use of technology in education and providing digital learning resources.'),
('Inclusive Education', 'Schemes aimed at ensuring equitable access and quality education for all children, including CWSN and disadvantaged groups.'),
('Quality Enhancement', 'Schemes focused on improving learning outcomes, curriculum, and assessment methods.'),
('Early Childhood Care & Education (ECCE)', 'Schemes related to foundational learning and pre-primary education.')
ON CONFLICT (name) DO NOTHING;

-- Seed Organizational Unit Subtypes (examples)
INSERT INTO organizational_unit_subtypes (name, description, governance_tier_id)
SELECT 
    s.name, 
    s.description,
    gt.id
FROM (VALUES
    ('Central Government School (KVS)', 'Kendriya Vidyalaya Sangathan Schools', 'Institutional Level (Schools)'),
    ('Central Government School (NVS)', 'Navodaya Vidyalaya Samiti Schools', 'Institutional Level (Schools)'),
    ('State Government School', 'Schools run by State/UT Governments', 'Institutional Level (Schools)'),
    ('Private Unaided School', 'Privately managed schools without government aid', 'Institutional Level (Schools)'),
    ('Private Aided School', 'Privately managed schools receiving government aid', 'Institutional Level (Schools)'),
    ('Local Body School', 'Schools managed by local government bodies (municipalities, panchayats)', 'Institutional Level (Schools)')
) AS s(name, description, tier_name)
LEFT JOIN governance_tiers gt ON gt.name = s.tier_name
ON CONFLICT (name) DO NOTHING;


-- Seed Example Schemes (requires existing OUs and Users for created_by, issuing_authority_ou_id)
-- For simplicity, we'll fetch one OU ID for MoE and one for a State.
-- In a real scenario, these IDs would be known or dynamically fetched.

DO $$
DECLARE
    moe_ou_id UUID;
    karnataka_dse_ou_id UUID;
    admin_user_id UUID;
    infra_category_id UUID;
    teacher_dev_category_id UUID;
    student_welfare_category_id UUID;
    digital_edu_category_id UUID;

    kvs_subtype_id UUID;
    state_gov_school_subtype_id UUID;
    private_aided_subtype_id UUID;

    central_tier_id INTEGER; -- governance_tiers.id is SERIAL/int, not UUID
    state_tier_id INTEGER;
    district_tier_id INTEGER;
    institutional_tier_id INTEGER;

    pm_shri_scheme_id UUID;
    nistha_scheme_id UUID;
    karnataka_vidya_nidhi_scheme_id UUID;
BEGIN
    -- Fetch prerequisite IDs
    SELECT id INTO moe_ou_id FROM organizational_units WHERE region_code = 'IND_MOE' LIMIT 1;
    SELECT id INTO karnataka_dse_ou_id FROM organizational_units WHERE region_code = 'KA_DSE' LIMIT 1;
    
    -- Attempt to get an actual user ID, fallback to NULL if no users exist or for simplicity
    SELECT id INTO admin_user_id FROM auth.users ORDER BY email LIMIT 1; 
    -- If auth.users is empty, admin_user_id will be NULL. 
    -- The created_by/updated_by fields in schemes table should be nullable or have a default system user.
    -- For this script, assuming they are nullable.

    SELECT id INTO infra_category_id FROM scheme_categories WHERE name = 'Infrastructure Development' LIMIT 1;
    SELECT id INTO teacher_dev_category_id FROM scheme_categories WHERE name = 'Teacher Professional Development' LIMIT 1;
    SELECT id INTO student_welfare_category_id FROM scheme_categories WHERE name = 'Student Welfare & Scholarships' LIMIT 1;
    SELECT id INTO digital_edu_category_id FROM scheme_categories WHERE name = 'Digital Education & EdTech' LIMIT 1;

    SELECT id INTO kvs_subtype_id FROM organizational_unit_subtypes WHERE name = 'Central Government School (KVS)' LIMIT 1;
    SELECT id INTO state_gov_school_subtype_id FROM organizational_unit_subtypes WHERE name = 'State Government School' LIMIT 1;
    SELECT id INTO private_aided_subtype_id FROM organizational_unit_subtypes WHERE name = 'Private Aided School' LIMIT 1;

    SELECT id INTO central_tier_id FROM governance_tiers WHERE name = 'Central Level' LIMIT 1;
    SELECT id INTO state_tier_id FROM governance_tiers WHERE name = 'State/UT Level' LIMIT 1;
    SELECT id INTO district_tier_id FROM governance_tiers WHERE name = 'District Level' LIMIT 1;
    SELECT id INTO institutional_tier_id FROM governance_tiers WHERE name = 'Institutional Level (Schools)' LIMIT 1;

    -- Check if essential OUs are found
    IF moe_ou_id IS NULL THEN
        RAISE WARNING 'Ministry of Education OU (IND_MOE) not found. Some schemes may not be seeded correctly.';
    END IF;
    IF karnataka_dse_ou_id IS NULL THEN
        RAISE WARNING 'Karnataka DSE OU (KA_DSE) not found. Some state schemes may not be seeded correctly.';
    END IF;


    -- 1. PM SHRI (Central Scheme)
    IF moe_ou_id IS NOT NULL AND infra_category_id IS NOT NULL THEN
        INSERT INTO schemes (
            name, description, objectives, scheme_code, category_id, issuing_authority_ou_id,
            funding_pattern, start_date, end_date, status, target_beneficiaries, eligibility_criteria, website_url, created_by, updated_by
        ) VALUES (
            'PM Schools for Rising India (PM SHRI)',
            'A centrally sponsored scheme to upgrade existing government schools into exemplary schools showcasing NEP 2020 principles.',
            'To develop green schools, showcase all components of NEP 2020, offer mentorship to other schools, and deliver quality teaching for cognitive development.',
            'PM_SHRI_001', infra_category_id, moe_ou_id,
            '60:40 for most States, 90:10 for NE/Hilly/UTs with legislature, 100% for UTs without legislature.',
            '2022-09-05', '2027-03-31', 'Active',
            'Selected existing Government schools (Central/State/UT/Local Body)',
            'Schools selected through Challenge Mode based on UDISE+ data and self-assessment.',
            'https://pmshrischools.education.gov.in/', admin_user_id, admin_user_id
        ) ON CONFLICT (name, issuing_authority_ou_id) DO NOTHING
        RETURNING id INTO pm_shri_scheme_id;

        IF pm_shri_scheme_id IS NOT NULL THEN
            IF kvs_subtype_id IS NOT NULL THEN
                INSERT INTO scheme_applicability_ou_subtypes (scheme_id, ou_subtype_id) VALUES (pm_shri_scheme_id, kvs_subtype_id) ON CONFLICT DO NOTHING;
            END IF;
            IF state_gov_school_subtype_id IS NOT NULL THEN
                INSERT INTO scheme_applicability_ou_subtypes (scheme_id, ou_subtype_id) VALUES (pm_shri_scheme_id, state_gov_school_subtype_id) ON CONFLICT DO NOTHING;
            END IF;
            -- Target Tiers
            IF state_tier_id IS NOT NULL THEN INSERT INTO scheme_target_governance_tiers(scheme_id, tier_id, role_description) VALUES (pm_shri_scheme_id, state_tier_id, 'Implementation Partner') ON CONFLICT DO NOTHING; END IF;
            IF district_tier_id IS NOT NULL THEN INSERT INTO scheme_target_governance_tiers(scheme_id, tier_id, role_description) VALUES (pm_shri_scheme_id, district_tier_id, 'Monitoring & Support') ON CONFLICT DO NOTHING; END IF;
            IF institutional_tier_id IS NOT NULL THEN INSERT INTO scheme_target_governance_tiers(scheme_id, tier_id, role_description) VALUES (pm_shri_scheme_id, institutional_tier_id, 'Beneficiary & Implementation Site') ON CONFLICT DO NOTHING; END IF;
        END IF;
    END IF;

    -- 2. NISHTHA (National Initiative for School Heads'' and Teachers'' Holistic Advancement) (Central Scheme)
    IF moe_ou_id IS NOT NULL AND teacher_dev_category_id IS NOT NULL THEN
        INSERT INTO schemes (
            name, description, objectives, scheme_code, category_id, issuing_authority_ou_id,
            funding_pattern, status, target_beneficiaries, eligibility_criteria, website_url, created_by, updated_by
        ) VALUES (
            'NISHTHA (National Initiative for School Heads'' and Teachers'' Holistic Advancement)',
            'Capacity building program for improving quality of school education through integrated teacher training.',
            'To equip and motivate teachers and school principals to encourage and foster critical thinking in students. To cover all teachers and Heads of Schools at the elementary level in all Government schools.',
            'NISHTHA_001', teacher_dev_category_id, moe_ou_id, -- Assuming NCERT/MoE as issuer
            '100% Centrally Sponsored (as part of Samagra Shiksha)', 'Active',
            'Teachers and Heads of Schools at Elementary, Secondary, and Pre-primary levels in Government and Aided schools.',
            'All teachers and school heads in specified school types.',
            'https://itpd.ncert.gov.in/', admin_user_id, admin_user_id
        ) ON CONFLICT (name, issuing_authority_ou_id) DO NOTHING
        RETURNING id INTO nistha_scheme_id;

        IF nistha_scheme_id IS NOT NULL THEN
            IF state_gov_school_subtype_id IS NOT NULL THEN
                INSERT INTO scheme_applicability_ou_subtypes (scheme_id, ou_subtype_id) VALUES (nistha_scheme_id, state_gov_school_subtype_id) ON CONFLICT DO NOTHING;
            END IF;
            IF private_aided_subtype_id IS NOT NULL THEN
                 INSERT INTO scheme_applicability_ou_subtypes (scheme_id, ou_subtype_id) VALUES (nistha_scheme_id, private_aided_subtype_id) ON CONFLICT DO NOTHING;
            END IF;
             -- Target Tiers
            IF state_tier_id IS NOT NULL THEN INSERT INTO scheme_target_governance_tiers(scheme_id, tier_id, role_description) VALUES (nistha_scheme_id, state_tier_id, 'Coordination & Training Delivery') ON CONFLICT DO NOTHING; END IF;
            IF district_tier_id IS NOT NULL THEN INSERT INTO scheme_target_governance_tiers(scheme_id, tier_id, role_description) VALUES (nistha_scheme_id, district_tier_id, 'Local Training Management') ON CONFLICT DO NOTHING; END IF;
            IF institutional_tier_id IS NOT NULL THEN INSERT INTO scheme_target_governance_tiers(scheme_id, tier_id, role_description) VALUES (nistha_scheme_id, institutional_tier_id, 'Participant Level') ON CONFLICT DO NOTHING; END IF;
        END IF;
    END IF;

    -- 3. Example State Scheme (Karnataka - Fictional for demonstration)
    IF karnataka_dse_ou_id IS NOT NULL AND student_welfare_category_id IS NOT NULL THEN
        INSERT INTO schemes (
            name, description, objectives, scheme_code, category_id, issuing_authority_ou_id,
            funding_pattern, start_date, status, target_beneficiaries, eligibility_criteria, created_by, updated_by
        ) VALUES (
            'Karnataka Vidya Nidhi Scholarship',
            'State scholarship program for meritorious students from economically weaker sections pursuing higher secondary education.',
            'To provide financial assistance to prevent dropouts and encourage higher education enrollment among EWS students.',
            'KA_VIDYANIDHI_001', student_welfare_category_id, karnataka_dse_ou_id,
            '100% State Funded', '2023-06-01', 'Active',
            'Meritorious students from EWS families enrolled in Class 11 & 12 in Karnataka government and aided schools.',
            'Annual family income below X, minimum Y% marks in Class 10.', admin_user_id, admin_user_id
        ) ON CONFLICT (name, issuing_authority_ou_id) DO NOTHING
        RETURNING id INTO karnataka_vidya_nidhi_scheme_id;

        IF karnataka_vidya_nidhi_scheme_id IS NOT NULL THEN
            IF state_gov_school_subtype_id IS NOT NULL THEN
                INSERT INTO scheme_applicability_ou_subtypes (scheme_id, ou_subtype_id) VALUES (karnataka_vidya_nidhi_scheme_id, state_gov_school_subtype_id) ON CONFLICT DO NOTHING;
            END IF;
            IF private_aided_subtype_id IS NOT NULL THEN
                INSERT INTO scheme_applicability_ou_subtypes (scheme_id, ou_subtype_id) VALUES (karnataka_vidya_nidhi_scheme_id, private_aided_subtype_id) ON CONFLICT DO NOTHING;
            END IF;
            -- Target Tiers
            IF institutional_tier_id IS NOT NULL THEN INSERT INTO scheme_target_governance_tiers(scheme_id, tier_id, role_description) VALUES (karnataka_vidya_nidhi_scheme_id, institutional_tier_id, 'Beneficiary Enrollment') ON CONFLICT DO NOTHING; END IF;
        END IF;
    END IF;

END $$;

-- ==== 013-mvp-initial-schema.sql ====
-- VASA-EOS(SE) — core identity schema.
--
-- IMPORTANT (production correction): this migration originally shipped a legacy LMS schema (users,
-- schools, courses, enrolments, assignments, submissions) that (a) defined `users` with a shape the
-- live app does not use and could not seed into, and (b) defined `courses`/`assignments` that CONFLICT
-- with the real academic-module tables (scripts/046, scripts/048). It had never run against a real
-- database. It is now trimmed to the identity tables the platform actually uses, defined correctly and
-- idempotently; the academic modules own their own tables.

-- ── Identity: the users table resolveSubject()/getUserRoleAndSchool() bind the access policy to ────
create table if not exists public.users (
  id          text primary key,
  email       text not null unique,
  full_name   text not null,
  role        text not null,                 -- MINISTER / SECRETARY / ADMIN / DIRECTOR / PRINCIPAL / TEACHER / STUDENT / PARENT / …
  school_id   text,                          -- UDISE code (or null for state-tier roles)
  status      text not null default 'active',
  created_at  timestamptz default current_timestamp,
  updated_at  timestamptz default current_timestamp
);

create index if not exists idx_users_email on public.users (email);
create index if not exists idx_users_role  on public.users (role);

create table if not exists public.schools (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  state       text not null,
  city        text not null,
  created_at  timestamptz default current_timestamp,
  updated_at  timestamptz default current_timestamp
);

-- updated_at trigger (idempotent)
create or replace function trigger_set_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare t text;
begin
  foreach t in array array['schools','users'] loop
    execute format('drop trigger if exists set_timestamp on public.%I;', t);
    execute format('create trigger set_timestamp before update on public.%I for each row execute procedure trigger_set_timestamp();', t);
  end loop;
end $$;

-- ==== 014-enable-rls-and-policies.sql ====
-- 1. Enable RLS for all relevant tables
-- This will block all access by default until we create policies
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- courses / enrollments / assignments / submissions: the legacy LMS tables are gone; the real
-- academic modules (scripts/046 courses, scripts/048 assignments) own and RLS-enable their own tables.

-- Add other tables from your error list here:
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_implementation_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.implementation_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.implementation_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.implementation_stakeholders ENABLE ROW LEVEL SECURITY;
-- Add any other tables that appear in the RLS error list

-- 2. Create Policies for the 'users' table
-- Policy: Allow users to see their own profile information.
CREATE POLICY "Users can view their own data"
ON public.users FOR SELECT
USING (auth.uid()::text = id);

-- Policy: Allow users to update their own profile information.
CREATE POLICY "Users can update their own data"
ON public.users FOR UPDATE
USING (auth.uid()::text = id)
WITH CHECK (auth.uid()::text = id);

-- Policy: Allow authenticated users to insert their own user record
-- (This is often needed if user creation involves inserting into public.users after auth.users creation)
-- Ensure the ID matches the authenticated user's ID.
CREATE POLICY "Users can insert their own user record"
ON public.users FOR INSERT
WITH CHECK (auth.uid()::text = id);


-- Policies for the legacy LMS tables (courses/enrollments/assignments/submissions) were removed —
-- those tables are owned by the real academic-module migrations, which define their own policies.

-- 7. Create Policies for 'schools'
-- Policy: Allow any authenticated user to view all schools.
CREATE POLICY "Authenticated users can view schools"
ON public.schools FOR SELECT
USING (auth.role() = 'authenticated');
-- Add policies for INSERT, UPDATE, DELETE for schools as needed, likely restricted to admin roles.


-- 8. Policies for 'policies' table (example, adjust as needed)
CREATE POLICY "Authenticated users can view policies"
ON public.policies FOR SELECT
USING (auth.role() = 'authenticated');

-- Add similar SELECT policies for:
-- public.policy_implementation_status
-- public.implementation_milestones
-- public.implementation_challenges
-- public.implementation_stakeholders
-- For these, start with a simple SELECT for authenticated users, then refine.
-- Example for one:
CREATE POLICY "Authenticated users can view policy_implementation_status"
ON public.policy_implementation_status FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view implementation_milestones"
ON public.implementation_milestones FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view implementation_challenges"
ON public.implementation_challenges FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view implementation_stakeholders"
ON public.implementation_stakeholders FOR SELECT
USING (auth.role() = 'authenticated');

-- IMPORTANT: These are basic policies. You will likely need to make them more specific
-- based on user roles and relationships (e.g., a teacher can only update courses they created).
-- For INSERT, UPDATE, DELETE operations, you MUST define policies, or no one will be able to modify data.

-- ==== 015-persist-interactive-modules.sql ====
-- VASA-EOS(SE) — persistence for the interactive operational modules.
-- Moves grievance redressal, the DAO-style SMC, school recognition (TN 1973),
-- verifiable credentials and the tamper-evident audit ledger from in-memory
-- demo stores to durable tables. The application falls back to in-memory stores
-- when the service-role client is not configured, so these tables are optional
-- for local/demo use and required for real cross-request persistence.

-- ---------------------------------------------------------------------------
-- Tamper-evident audit ledger (hash-chained).
-- ---------------------------------------------------------------------------
create table if not exists public.audit_trail (
  seq        bigint primary key,
  ts         timestamptz not null,
  actor      text not null,
  action     text not null,
  resource   text not null,
  details    jsonb,
  prev_hash  text not null,
  hash       text not null
);

-- ---------------------------------------------------------------------------
-- Grievance redressal.
-- ---------------------------------------------------------------------------
create table if not exists public.grievances (
  id          text primary key,
  category    text not null,
  description text not null,
  tier        int  not null default 0,
  status      text not null default 'open',
  sla_hours   int  not null default 72,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- DAO-style School Management Committee proposals + votes.
-- ---------------------------------------------------------------------------
create table if not exists public.smc_proposals (
  id            text primary key,
  title         text not null,
  description   text not null,
  votes_for     int  not null default 0,
  votes_against int  not null default 0,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- School recognition workflow (TN Recognised Private Schools Act 1973).
-- ---------------------------------------------------------------------------
create table if not exists public.recognition_applications (
  id            text primary key,
  school        text not null,
  district      text not null,
  type          text not null,
  stage_index   int  not null default 0,
  status        text not null default 'in_progress',
  criteria_met  jsonb not null default '[]'::jsonb,
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Verifiable credentials (NFT / soulbound token).
-- ---------------------------------------------------------------------------
create table if not exists public.verifiable_credentials (
  id           text primary key,
  apaar_id     text not null,
  kind         text not null,
  title        text not null,
  issuer       text not null,
  issued_at    timestamptz not null,
  soulbound    boolean not null default true,
  content_hash text not null,
  anchor_seq   bigint not null
);

-- ---------------------------------------------------------------------------
-- DPDP consent ledger.
-- ---------------------------------------------------------------------------
create table if not exists public.consent_records (
  id            text primary key,
  subject_apaar text not null,
  purpose       text not null,
  actor         text not null,
  status        text not null,
  ts            timestamptz not null default now()
);

-- These tables are written via the privileged service-role client only; enable
-- RLS and add no public policies so they are inaccessible to anon/auth clients.
alter table public.audit_trail              enable row level security;
alter table public.grievances               enable row level security;
alter table public.smc_proposals            enable row level security;
alter table public.recognition_applications enable row level security;
alter table public.verifiable_credentials   enable row level security;
alter table public.consent_records          enable row level security;

create index if not exists idx_grievances_created      on public.grievances (created_at desc);
create index if not exists idx_smc_proposals_created   on public.smc_proposals (created_at desc);
create index if not exists idx_recognition_updated     on public.recognition_applications (updated_at desc);
create index if not exists idx_consent_subject         on public.consent_records (subject_apaar);

-- ==== 016-seed-org-and-users.sql ====
-- VASA-EOS(SE) — demo users seed (generated from lib/org + lib/directory).
-- DEMO credentials only; adapt column names to your users table. Passwords are set
-- via your auth provider (Supabase Auth / SSO), never stored here. The role +
-- school_id columns are what resolveSubject()/getUserRoleAndSchool() read to bind a
-- signed-in user to the access policy. See docs/CREDENTIALS.md.

insert into public.users (id, email, full_name, role, school_id, status) values
  ('minister', 'minister@vasa-eos.tn.gov.in', 'Hon''ble Minister (School Education)', 'MINISTER', null, 'active'),
  ('secretary', 'secretary@vasa-eos.tn.gov.in', 'Secretary, School Education', 'SECRETARY', null, 'active'),
  ('admin', 'admin@vasa-eos.tn.gov.in', 'Platform Administrator', 'ADMIN', null, 'active'),
  ('dir-dse', 'dir-dse@vasa-eos.tn.gov.in', 'Director of School Education', 'DIRECTOR', null, 'active'),
  ('dir-dee', 'dir-dee@vasa-eos.tn.gov.in', 'Director of Elementary Education', 'DIRECTOR', null, 'active'),
  ('dir-dge', 'dir-dge@vasa-eos.tn.gov.in', 'Director of Government Examinations', 'DIRECTOR', null, 'active'),
  ('dir-dms', 'dir-dms@vasa-eos.tn.gov.in', 'Director of Matriculation Schools', 'DIRECTOR', null, 'active'),
  ('dir-dtert', 'dir-dtert@vasa-eos.tn.gov.in', 'Director of Teacher Education (SCERT)', 'DIRECTOR', null, 'active'),
  ('dir-dnfe', 'dir-dnfe@vasa-eos.tn.gov.in', 'Director of Non-Formal Education', 'DIRECTOR', null, 'active'),
  ('dir-dpse', 'dir-dpse@vasa-eos.tn.gov.in', 'Director of Private Schools', 'DIRECTOR', null, 'active'),
  ('deo-chennai', 'deo-chennai@vasa-eos.tn.gov.in', 'District Education Officer — Chennai', 'DEO', null, 'active'),
  ('beo-egmore', 'beo-egmore@vasa-eos.tn.gov.in', 'Block Education Officer — Egmore', 'BEO', null, 'active'),
  ('crcc-egmore', 'crcc-egmore@vasa-eos.tn.gov.in', 'CRC Coordinator — Egmore', 'CRCC', null, 'active'),
  ('principal-egmore', 'principal-egmore@vasa-eos.tn.gov.in', 'Principal — GHSS Egmore', 'PRINCIPAL', '33010100101', 'active'),
  ('acadhead-egmore', 'acadhead-egmore@vasa-eos.tn.gov.in', 'Academic Head — GHSS Egmore', 'ACADEMIC_HEAD', '33010100101', 'active'),
  ('subinch-maths', 'subinch-maths@vasa-eos.tn.gov.in', 'Subject In-charge (Maths)', 'SUBJECT_INCHARGE', '33010100101', 'active'),
  ('insthead-egmore', 'insthead-egmore@vasa-eos.tn.gov.in', 'Institution Head — GHSS Egmore', 'INSTITUTION_HEAD', '33010100101', 'active'),
  ('teacher-egmore', 'teacher-egmore@vasa-eos.tn.gov.in', 'Teacher — Class 9-A', 'TEACHER', '33010100101', 'active'),
  ('student-aarthi', 'student-aarthi@vasa-eos.tn.gov.in', 'Aarthi M (Class 9-A)', 'STUDENT', '33010100101', 'active'),
  ('parent-aarthi', 'parent-aarthi@vasa-eos.tn.gov.in', 'Guardian of Aarthi M', 'PARENT', '33010100101', 'active'),
  ('vendor-neat', 'vendor-neat@vasa-eos.tn.gov.in', 'EdTech Vendor (NEAT)', 'VENDOR', null, 'active'),
  ('researcher', 'researcher@vasa-eos.tn.gov.in', 'Education Researcher', 'RESEARCHER', null, 'active'),
  ('public', 'public@vasa-eos.tn.gov.in', 'Citizen / Public', 'PUBLIC', null, 'active')
on conflict (id) do nothing;

-- ==== 017-seed-policies.sql ====
-- VASA-EOS(SE) — sample policies seed (demo / non-production).
-- The policies table (001) ships without sample rows; this seeds a few TN/NEP
-- policies so the Policies module shows content once a database is attached.
-- Idempotent-ish: uses fixed ids and ON CONFLICT DO NOTHING.

insert into public.policies (id, title, policy_domain, version, abstract_en, status, keywords, nep_thrust_areas, lead_drafter)
values
  ('POL-2026-NEP1', 'NEP 2020 Implementation Roadmap (Tamil Nadu)', 'Foundational Literacy & Numeracy', '1.0',
   'State roadmap operationalising NEP 2020 for Tamil Nadu schools — FLN by Grade 3, 5+3+3+4 structure, mother-tongue-first pedagogy and holistic progress cards.',
   'Implemented', '{NEP,FLN,NIPUN}', '{"Foundational Learning","Curriculum Reform"}', 'SCERT TN'),
  ('POL-2026-PP01', 'Pudhumai Penn Scheme Guidelines', 'Equity & Inclusion', '2.1',
   'Monthly financial assistance to girl students from government schools pursuing higher education, disbursed via DBT to encourage retention and progression.',
   'Implemented', '{girls,DBT,retention}', '{"Equity","Access"}', 'School Education Dept'),
  ('POL-2026-CMBS', 'Chief Minister''s Breakfast Scheme (CMBS) SOP', 'Nutrition & Welfare', '1.3',
   'Standard operating procedure for the breakfast scheme — menu, hygiene, cook-cum-helper roles, daily register and leakage controls under PM POSHAN convergence.',
   'Implemented', '{nutrition,"PM POSHAN",breakfast}', '{"Health & Nutrition"}', 'School Education Dept'),
  ('POL-2026-NM01', 'Naan Mudhalvan Skilling Framework', 'Vocational & Skills', '1.0',
   'Career guidance, skilling and NSQF-aligned vocational pathways for higher-secondary students, with industry and Skill India linkages.',
   'Pending Internal Review', '{vocational,NSQF,skilling}', '{"Vocational Education","21st-century skills"}', 'DoSE'),
  ('POL-2026-RTE1', 'RTE 25% Admission Procedure', 'Access & Compliance', '1.2',
   'Procedure for the 25% reserved seats for economically-weaker and disadvantaged groups under RTE Act Sec 12(1)(c), including verification, lottery allotment and reimbursement.',
   'Draft', '{RTE,admissions,EWS}', '{"Equity","Access"}', 'DPSE')
on conflict (id) do nothing;

-- ==== 018-add-tenant-scoping.sql ====
-- VASA-EOS(SE) — per-role tenant scoping (ReBAC jurisdiction): add tenant_id + index to the scopable
-- operational tables so listing queries are filtered to the signed-in subject's jurisdiction subtree.
--
-- Production correction: the original migration ran bare `alter table` / `create index` against tables
-- that are CREATED IN A LATER migration (023/024), so it could never have applied against a real
-- database. It is now a single EXISTENCE-GUARDED, idempotent loop: it scopes only the tables that
-- already exist at this point, and the backfill migration (078) re-runs the same loop after every
-- table is created so each scoped table reliably gets its tenant_id column + index regardless of order.

do $$
declare
  t text;
  scoped text[] := array[
    'alumni','assemblies','bagless_activities','bank_accounts','cadets','cctv_cameras','certificates',
    'competition_entries','cooks','council_candidates','cwsn_students','diagnostic_rounds','distribution',
    'drills','eco_activities','excursions','fitness_records','guest_lectures','homework','ict_sessions',
    'incidents','loans','lost_found','mdm_register','notices','oosc_children','promotion_runs',
    'question_papers','readers','result_publications','rte_applicants','rti_requests','safety_concerns',
    'scholarships','seating_plans','sf_projects','sport_results','staff_attendance_sheets',
    'stock_movements','tc_requests','textbook_indents','vacancy_lines','visitors','voc_enrolments','water_tests'
  ];
begin
  foreach t in array scoped loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I add column if not exists tenant_id text not null default ''TN-CHN-B1-S1'';', t);
      execute format('create index if not exists %I on public.%I (tenant_id);', t || '_tenant_id_idx', t);
    end if;
  end loop;
end $$;

-- ==== 019-tenant-rls.sql ====
-- VASA-EOS(SE) — Row-Level Security per tenant (Multi-Tenancy isolation guarantee).
--
-- Defense-in-depth: the application already scopes every listing via
-- lib/access/scope-server (ReBAC downward governance). This migration enforces the
-- SAME rule at the DATABASE layer so that even a connection that bypasses the app
-- (a direct query, a compromised path) cannot read across tenants.
--
-- How it works: the app sets a per-request GUC `app.tenant_ids` to the comma-
-- separated set of tenant nodes the signed-in subject governs (lib/tenancy/rls
-- produces the SET LOCAL statement). The RLS policy admits a row only when its
-- tenant_id is in that set. An empty/unset GUC admits nothing (fail-closed).
--
-- NOTE: the Supabase service-role bypasses RLS by design (it is the trusted server
-- identity that runs the app's own scoping). RLS therefore protects the anon /
-- authenticated roles and any non-service connection — the threat model RLS exists
-- for. Keep both layers: app scoping is primary, RLS is the backstop.

-- Membership test: is `tid` within the current request's governed tenant set?
create or replace function public.in_tenant_subtree(tid text)
returns boolean
language sql
stable
as $$
  select tid = any (
    string_to_array(coalesce(nullif(current_setting('app.tenant_ids', true), ''), '__none__'), ',')
  );
$$;

-- Per-request binding: the app calls this RPC to set the governed tenant set for the
-- current transaction (SECURITY DEFINER so it can set_config; transaction-local so it
-- never leaks across pooled connections). The RLS policy then reads app.tenant_ids.
create or replace function public.set_tenant_context(ids text)
returns void
language plpgsql
security definer
as $$
begin
  perform set_config('app.tenant_ids', coalesce(ids, ''), true);
end;
$$;

-- Enable RLS + a SELECT policy on every tenant-scoped table (idempotent).
do $$
declare
  t text;
  scoped_tables text[] := array[
    'safety_concerns','incidents','cwsn_students','lost_found','cooks',
    'rte_applicants','rti_requests','oosc_children','water_tests','cctv_cameras',
    'drills','competition_entries','excursions','tc_requests','visitors',
    'loans','alumni','distribution','certificates','stock_movements',
    'sf_projects','guest_lectures','council_candidates','assemblies','eco_activities',
    'cadets','bank_accounts','fitness_records','readers','ict_sessions',
    'voc_enrolments','homework','mdm_register','sport_results','notices',
    'scholarships','textbook_indents','vacancy_lines','bagless_activities',
    'diagnostic_rounds','result_publications','staff_attendance_sheets',
    'seating_plans','question_papers','promotion_runs'
  ];
begin
  foreach t in array scoped_tables loop
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = t) then
      execute format('alter table public.%I enable row level security;', t);
      execute format('drop policy if exists tenant_isolation on public.%I;', t);
      execute format(
        'create policy tenant_isolation on public.%I for select using (public.in_tenant_subtree(tenant_id));',
        t
      );
    end if;
  end loop;
end $$;

-- ==== 020-agent-tool-requests.sql ====
-- VASA-EOS(SE) — agent tool-approval queue (human-in-the-loop).
-- Side-effecting agent tool calls are queued here as pending requests until a human
-- approves (the tool then runs against its real seam) or rejects. The app falls back
-- to an in-memory store when the service-role client is not configured.

create table if not exists public.agent_tool_requests (
  id           text primary key,
  agent        text not null,
  tool         text not null,
  args         jsonb not null default '{}'::jsonb,
  status       text not null default 'pending',  -- pending | approved | rejected
  requested_at timestamptz not null default now(),
  output       text
);

create index if not exists agent_tool_requests_status_idx
  on public.agent_tool_requests (status, requested_at desc);

-- ==== 021-create-workflow-flow-tables.sql ====
-- VASA-EOS(SE) — durable tables for the workflow-backed deep verticals.
--
-- Each of the six transactional modules (recognition, grievance, admissions,
-- leave, SMC, maintenance) persists one row per case, carrying a live workflow
-- instance (JSONB) plus the rich intake captured by its create form (details
-- JSONB). The app writes through the Supabase service-role client when
-- configured (lib/persistence.getDb) and falls back to an in-memory store
-- otherwise — so these tables make the deep verticals durable the moment a
-- database is provisioned, without any app change.
--
-- Security posture: these rows contain applicant / grievance / staff PII. RLS is
-- enabled with NO permissive policy, so the anon and authenticated roles can read
-- nothing directly. The trusted server identity (service-role) bypasses RLS by
-- design and performs the app's own ReBAC scoping in lib/access/scope-server.
-- These tables are NOT tenant-scoped (only Safety, Discipline and CWSN are today),
-- so no tenant_id column / tenant_isolation policy is added here.

-- 1) School recognition / renewal applications (multi-tier approval).
create table if not exists public.recognition_flows (
  id          text primary key,
  school      text not null,
  district    text,
  type        text not null,            -- new | renewal
  instance    jsonb not null default '{}'::jsonb,
  details     jsonb,
  created_at  timestamptz not null default now()
);

-- 2) Citizen grievances (escalation workflow).
create table if not exists public.grievance_flows (
  id          text primary key,
  applicant   text not null,
  category    text not null,
  description text,
  instance    jsonb not null default '{}'::jsonb,
  details     jsonb,
  created_at  timestamptz not null default now()
);

-- 3) RTE admission applications (approval workflow).
create table if not exists public.admission_flows (
  id          text primary key,
  name        text not null,
  dob         text,
  gender      text,
  category    text,
  class_name  text,
  details     jsonb,
  apaar_id    text,
  instance    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- 4) Teacher leave applications (Principal -> BEO -> DEO).
create table if not exists public.leave_flows (
  id          text primary key,
  teacher     text not null,
  type        text not null,
  from_date   text,
  to_date     text,
  days        integer,
  reason      text,
  instance    jsonb not null default '{}'::jsonb,
  details     jsonb,
  created_at  timestamptz not null default now()
);

-- 5) SMC resolutions (3-member quorum -> Principal counter-sign).
create table if not exists public.smc_flows (
  id          text primary key,
  title       text not null,
  description text,
  instance    jsonb not null default '{}'::jsonb,
  details     jsonb,
  created_at  timestamptz not null default now()
);

-- 6) Maintenance tickets (Principal triage -> Vendor -> Principal close).
create table if not exists public.maintenance_flows (
  id          text primary key,
  category    text not null,
  description text,
  priority    text not null default 'medium',
  instance    jsonb not null default '{}'::jsonb,
  details     jsonb,
  created_at  timestamptz not null default now()
);

-- Inboxes list newest-first; index the sort key on each.
create index if not exists recognition_flows_created_idx  on public.recognition_flows  (created_at desc);
create index if not exists grievance_flows_created_idx    on public.grievance_flows    (created_at desc);
create index if not exists admission_flows_created_idx     on public.admission_flows     (created_at desc);
create index if not exists leave_flows_created_idx         on public.leave_flows         (created_at desc);
create index if not exists smc_flows_created_idx           on public.smc_flows           (created_at desc);
create index if not exists maintenance_flows_created_idx   on public.maintenance_flows   (created_at desc);

-- Deny-by-default: enable RLS with no permissive policy. Service-role bypasses
-- this and is the only identity that touches these tables in the app today.
do $$
declare
  t text;
  flow_tables text[] := array[
    'recognition_flows','grievance_flows','admission_flows',
    'leave_flows','smc_flows','maintenance_flows'
  ];
begin
  foreach t in array flow_tables loop
    execute format('alter table public.%I enable row level security;', t);
  end loop;
end $$;

-- ==== 022-create-forum-flow-table.sql ====
-- VASA-EOS(SE) — durable table for the state-tier governance forum vertical.
--
-- Each governance-forum item (a resolution tabled at a State executive forum)
-- persists one row carrying a live FORUM_RESOLUTION workflow instance
-- (Secretary convenes & adopts -> quorum of 2 Directors adopts -> Minister
-- ratifies significant items) plus the rich intake captured by the convene form
-- (RACI ownership, category, meeting date, decision text, fund implication).
-- Written through the service-role client when configured; in-memory otherwise.
--
-- Security posture matches the other workflow flow tables (scripts/021): RLS
-- enabled with NO permissive policy, so anon/authenticated read nothing directly;
-- the trusted service-role bypasses RLS and performs the app's own ReBAC scoping.
-- Not tenant-scoped (state-tier governance is above the TN tenant subtree today).

create table if not exists public.forum_flows (
  id               text primary key,
  forum            text not null,
  title            text not null,
  requires_minister boolean not null default false,
  action_items     jsonb not null default '[]'::jsonb,
  instance         jsonb not null default '{}'::jsonb,
  details          jsonb,
  created_at       timestamptz not null default now()
);

create index if not exists forum_flows_created_idx on public.forum_flows (created_at desc);

alter table public.forum_flows enable row level security;

-- ==== 023-create-operational-module-tables.sql ====
-- VASA-EOS(SE) — durable tables for the operational school modules.
--
-- These tables back the interactive operational stores (Safety, CWSN, Discipline,
-- visitors, water tests, drills, library, MDM, notices, and many more). Their
-- stores write through the Supabase service-role client when configured, but no
-- migration created the tables — so in production every insert silently fell back
-- to in-memory. This closes that durability gap.
--
-- Data columns are jsonb: the stores carry heterogeneous values (strings, numbers,
-- booleans, arrays) and read them straight back, so jsonb round-trips them
-- faithfully with no risk of an insert being rejected on a type mismatch. id is
-- the text primary key; created_at orders the listings.
--
-- Tenant-scoped tables (most) carry tenant_id and get the SAME tenant_isolation
-- RLS policy migration 019 already declared for them (public.in_tenant_subtree),
-- enforcing ReBAC downward governance at the database layer. The few non-scoped
-- tables get RLS enabled deny-by-default (service-role only), matching scripts/021.

-- ---- Tenant-scoped operational tables ----

create table if not exists public.alumni (
  id          text primary key,
  name        jsonb,
  batch_year  jsonb,
  occupation  jsonb,
  contact     jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists alumni_created_idx on public.alumni (created_at desc);
alter table public.alumni enable row level security;
drop policy if exists tenant_isolation on public.alumni;
create policy tenant_isolation on public.alumni for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.assemblies (
  id          text primary key,
  date        jsonb,
  cls         jsonb,
  theme       jsonb,
  conducted_by jsonb,
  thought     jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists assemblies_created_idx on public.assemblies (created_at desc);
alter table public.assemblies enable row level security;
drop policy if exists tenant_isolation on public.assemblies;
create policy tenant_isolation on public.assemblies for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.bagless_activities (
  id          text primary key,
  title       jsonb,
  type        jsonb,
  date        jsonb,
  class_group jsonb,
  participants jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists bagless_activities_created_idx on public.bagless_activities (created_at desc);
alter table public.bagless_activities enable row level security;
drop policy if exists tenant_isolation on public.bagless_activities;
create policy tenant_isolation on public.bagless_activities for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.bank_accounts (
  id          text primary key,
  student     jsonb,
  cls         jsonb,
  balance     jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists bank_accounts_created_idx on public.bank_accounts (created_at desc);
alter table public.bank_accounts enable row level security;
drop policy if exists tenant_isolation on public.bank_accounts;
create policy tenant_isolation on public.bank_accounts for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.cadets (
  id          text primary key,
  name        jsonb,
  cls         jsonb,
  wing        jsonb,
  service_hours jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists cadets_created_idx on public.cadets (created_at desc);
alter table public.cadets enable row level security;
drop policy if exists tenant_isolation on public.cadets;
create policy tenant_isolation on public.cadets for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.cctv_cameras (
  id          text primary key,
  location    jsonb,
  zone        jsonb,
  working     jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists cctv_cameras_created_idx on public.cctv_cameras (created_at desc);
alter table public.cctv_cameras enable row level security;
drop policy if exists tenant_isolation on public.cctv_cameras;
create policy tenant_isolation on public.cctv_cameras for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.certificates (
  id          text primary key,
  ref         jsonb,
  type        jsonb,
  student_apaar jsonb,
  student_name jsonb,
  issued_on   jsonb,
  remarks     jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists certificates_created_idx on public.certificates (created_at desc);
alter table public.certificates enable row level security;
drop policy if exists tenant_isolation on public.certificates;
create policy tenant_isolation on public.certificates for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.competition_entries (
  id          text primary key,
  student     jsonb,
  event       jsonb,
  level       jsonb,
  medal       jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists competition_entries_created_idx on public.competition_entries (created_at desc);
alter table public.competition_entries enable row level security;
drop policy if exists tenant_isolation on public.competition_entries;
create policy tenant_isolation on public.competition_entries for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.cooks (
  id          text primary key,
  name        jsonb,
  role        jsonb,
  honorarium  jsonb,
  present     jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists cooks_created_idx on public.cooks (created_at desc);
alter table public.cooks enable row level security;
drop policy if exists tenant_isolation on public.cooks;
create policy tenant_isolation on public.cooks for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.council_candidates (
  id          text primary key,
  name        jsonb,
  cls         jsonb,
  position    jsonb,
  votes       jsonb,
  elected     jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists council_candidates_created_idx on public.council_candidates (created_at desc);
alter table public.council_candidates enable row level security;
drop policy if exists tenant_isolation on public.council_candidates;
create policy tenant_isolation on public.council_candidates for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.cwsn_students (
  id          text primary key,
  name        jsonb,
  cls         jsonb,
  disability  jsonb,
  supports    jsonb,
  iep_goal    jsonb,
  reviewed    jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists cwsn_students_created_idx on public.cwsn_students (created_at desc);
alter table public.cwsn_students enable row level security;
drop policy if exists tenant_isolation on public.cwsn_students;
create policy tenant_isolation on public.cwsn_students for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.diagnostic_rounds (
  id          text primary key,
  date        jsonb,
  label       jsonb,
  scores      jsonb,
  summary     jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists diagnostic_rounds_created_idx on public.diagnostic_rounds (created_at desc);
alter table public.diagnostic_rounds enable row level security;
drop policy if exists tenant_isolation on public.diagnostic_rounds;
create policy tenant_isolation on public.diagnostic_rounds for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.drills (
  id          text primary key,
  type        jsonb,
  date        jsonb,
  evac_time_sec jsonb,
  participants jsonb,
  observations jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists drills_created_idx on public.drills (created_at desc);
alter table public.drills enable row level security;
drop policy if exists tenant_isolation on public.drills;
create policy tenant_isolation on public.drills for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.eco_activities (
  id          text primary key,
  title       jsonb,
  type        jsonb,
  saplings    jsonb,
  survived    jsonb,
  date        jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists eco_activities_created_idx on public.eco_activities (created_at desc);
alter table public.eco_activities enable row level security;
drop policy if exists tenant_isolation on public.eco_activities;
create policy tenant_isolation on public.eco_activities for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.excursions (
  id          text primary key,
  destination jsonb,
  date        jsonb,
  class_group jsonb,
  strength    jsonb,
  consents_received jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists excursions_created_idx on public.excursions (created_at desc);
alter table public.excursions enable row level security;
drop policy if exists tenant_isolation on public.excursions;
create policy tenant_isolation on public.excursions for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.fitness_records (
  id          text primary key,
  student     jsonb,
  cls         jsonb,
  test        jsonb,
  score       jsonb,
  grade       jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists fitness_records_created_idx on public.fitness_records (created_at desc);
alter table public.fitness_records enable row level security;
drop policy if exists tenant_isolation on public.fitness_records;
create policy tenant_isolation on public.fitness_records for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.guest_lectures (
  id          text primary key,
  speaker     jsonb,
  topic       jsonb,
  org         jsonb,
  domain      jsonb,
  date        jsonb,
  audience    jsonb,
  cls         jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists guest_lectures_created_idx on public.guest_lectures (created_at desc);
alter table public.guest_lectures enable row level security;
drop policy if exists tenant_isolation on public.guest_lectures;
create policy tenant_isolation on public.guest_lectures for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.homework (
  id          text primary key,
  subject     jsonb,
  title       jsonb,
  due_date    jsonb,
  status      jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists homework_created_idx on public.homework (created_at desc);
alter table public.homework enable row level security;
drop policy if exists tenant_isolation on public.homework;
create policy tenant_isolation on public.homework for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.ict_sessions (
  id          text primary key,
  cls         jsonb,
  subject     jsonb,
  date        jsonb,
  students    jsonb,
  devices_working jsonb,
  devices_total jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists ict_sessions_created_idx on public.ict_sessions (created_at desc);
alter table public.ict_sessions enable row level security;
drop policy if exists tenant_isolation on public.ict_sessions;
create policy tenant_isolation on public.ict_sessions for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.incidents (
  id          text primary key,
  student     jsonb,
  type        jsonb,
  severity    jsonb,
  action      jsonb,
  date        jsonb,
  status      jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists incidents_created_idx on public.incidents (created_at desc);
alter table public.incidents enable row level security;
drop policy if exists tenant_isolation on public.incidents;
create policy tenant_isolation on public.incidents for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.loans (
  id          text primary key,
  book_id     jsonb,
  book_title  jsonb,
  borrower    jsonb,
  issued_on   jsonb,
  due_on      jsonb,
  returned_on jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists loans_created_idx on public.loans (created_at desc);
alter table public.loans enable row level security;
drop policy if exists tenant_isolation on public.loans;
create policy tenant_isolation on public.loans for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.lost_found (
  id          text primary key,
  name        jsonb,
  description jsonb,
  location    jsonb,
  reported_by jsonb,
  status      jsonb,
  date        jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists lost_found_created_idx on public.lost_found (created_at desc);
alter table public.lost_found enable row level security;
drop policy if exists tenant_isolation on public.lost_found;
create policy tenant_isolation on public.lost_found for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.mdm_register (
  id          text primary key,
  date        jsonb,
  enrolment   jsonb,
  present     jsonb,
  meals_served jsonb,
  menu        jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists mdm_register_created_idx on public.mdm_register (created_at desc);
alter table public.mdm_register enable row level security;
drop policy if exists tenant_isolation on public.mdm_register;
create policy tenant_isolation on public.mdm_register for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.notices (
  id          text primary key,
  title       jsonb,
  body        jsonb,
  category    jsonb,
  audience    jsonb,
  date        jsonb,
  pinned      jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists notices_created_idx on public.notices (created_at desc);
alter table public.notices enable row level security;
drop policy if exists tenant_isolation on public.notices;
create policy tenant_isolation on public.notices for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.oosc_children (
  id          text primary key,
  name        jsonb,
  age         jsonb,
  reason      jsonb,
  status      jsonb,
  target_class jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists oosc_children_created_idx on public.oosc_children (created_at desc);
alter table public.oosc_children enable row level security;
drop policy if exists tenant_isolation on public.oosc_children;
create policy tenant_isolation on public.oosc_children for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.readers (
  id          text primary key,
  student     jsonb,
  cls         jsonb,
  level       jsonb,
  books_read  jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists readers_created_idx on public.readers (created_at desc);
alter table public.readers enable row level security;
drop policy if exists tenant_isolation on public.readers;
create policy tenant_isolation on public.readers for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.result_publications (
  id          text primary key,
  date        jsonb,
  exam_name   jsonb,
  candidates  jsonb,
  pass_pct    jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists result_publications_created_idx on public.result_publications (created_at desc);
alter table public.result_publications enable row level security;
drop policy if exists tenant_isolation on public.result_publications;
create policy tenant_isolation on public.result_publications for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.rte_applicants (
  id          text primary key,
  name        jsonb,
  category    jsonb,
  status      jsonb,
  date        jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists rte_applicants_created_idx on public.rte_applicants (created_at desc);
alter table public.rte_applicants enable row level security;
drop policy if exists tenant_isolation on public.rte_applicants;
create policy tenant_isolation on public.rte_applicants for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.rti_requests (
  id          text primary key,
  applicant   jsonb,
  subject     jsonb,
  received_date jsonb,
  status      jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists rti_requests_created_idx on public.rti_requests (created_at desc);
alter table public.rti_requests enable row level security;
drop policy if exists tenant_isolation on public.rti_requests;
create policy tenant_isolation on public.rti_requests for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.safety_concerns (
  id          text primary key,
  category    jsonb,
  description jsonb,
  action      jsonb,
  status      jsonb,
  date        jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists safety_concerns_created_idx on public.safety_concerns (created_at desc);
alter table public.safety_concerns enable row level security;
drop policy if exists tenant_isolation on public.safety_concerns;
create policy tenant_isolation on public.safety_concerns for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.scholarships (
  id          text primary key,
  name        jsonb,
  scheme      jsonb,
  amount      jsonb,
  status      jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists scholarships_created_idx on public.scholarships (created_at desc);
alter table public.scholarships enable row level security;
drop policy if exists tenant_isolation on public.scholarships;
create policy tenant_isolation on public.scholarships for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.sf_projects (
  id          text primary key,
  title       jsonb,
  student     jsonb,
  cls         jsonb,
  category    jsonb,
  score       jsonb,
  judged      jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists sf_projects_created_idx on public.sf_projects (created_at desc);
alter table public.sf_projects enable row level security;
drop policy if exists tenant_isolation on public.sf_projects;
create policy tenant_isolation on public.sf_projects for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.sport_results (
  id          text primary key,
  event       jsonb,
  student     jsonb,
  medal       jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists sport_results_created_idx on public.sport_results (created_at desc);
alter table public.sport_results enable row level security;
drop policy if exists tenant_isolation on public.sport_results;
create policy tenant_isolation on public.sport_results for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.staff_attendance_sheets (
  id          text primary key,
  date        jsonb,
  records     jsonb,
  pct         jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists staff_attendance_sheets_created_idx on public.staff_attendance_sheets (created_at desc);
alter table public.staff_attendance_sheets enable row level security;
drop policy if exists tenant_isolation on public.staff_attendance_sheets;
create policy tenant_isolation on public.staff_attendance_sheets for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.tc_requests (
  id          text primary key,
  student     jsonb,
  cls         jsonb,
  reason      jsonb,
  status      jsonb,
  date        jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists tc_requests_created_idx on public.tc_requests (created_at desc);
alter table public.tc_requests enable row level security;
drop policy if exists tenant_isolation on public.tc_requests;
create policy tenant_isolation on public.tc_requests for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.textbook_indents (
  id          text primary key,
  cls         jsonb,
  subject     jsonb,
  required    jsonb,
  received    jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists textbook_indents_created_idx on public.textbook_indents (created_at desc);
alter table public.textbook_indents enable row level security;
drop policy if exists tenant_isolation on public.textbook_indents;
create policy tenant_isolation on public.textbook_indents for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.vacancy_lines (
  id          text primary key,
  subject     jsonb,
  sanctioned  jsonb,
  working     jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists vacancy_lines_created_idx on public.vacancy_lines (created_at desc);
alter table public.vacancy_lines enable row level security;
drop policy if exists tenant_isolation on public.vacancy_lines;
create policy tenant_isolation on public.vacancy_lines for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.visitors (
  id          text primary key,
  name        jsonb,
  purpose     jsonb,
  meeting     jsonb,
  in_time     jsonb,
  out_time    jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists visitors_created_idx on public.visitors (created_at desc);
alter table public.visitors enable row level security;
drop policy if exists tenant_isolation on public.visitors;
create policy tenant_isolation on public.visitors for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.voc_enrolments (
  id          text primary key,
  student     jsonb,
  trade       jsonb,
  level       jsonb,
  certified   jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists voc_enrolments_created_idx on public.voc_enrolments (created_at desc);
alter table public.voc_enrolments enable row level security;
drop policy if exists tenant_isolation on public.voc_enrolments;
create policy tenant_isolation on public.voc_enrolments for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.water_tests (
  id          text primary key,
  source      jsonb,
  date        jsonb,
  ph          jsonb,
  result      jsonb,
  remarks     jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists water_tests_created_idx on public.water_tests (created_at desc);
alter table public.water_tests enable row level security;
drop policy if exists tenant_isolation on public.water_tests;
create policy tenant_isolation on public.water_tests for select using (public.in_tenant_subtree(tenant_id));

-- ---- Non-tenant operational tables (service-role only) ----

create table if not exists public.leave_requests (
  id          text primary key,
  teacher     jsonb,
  type        jsonb,
  from_date   jsonb,
  to_date     jsonb,
  reason      jsonb,
  status      jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists leave_requests_created_idx on public.leave_requests (created_at desc);
alter table public.leave_requests enable row level security;

create table if not exists public.maintenance_tickets (
  id          text primary key,
  category    jsonb,
  description jsonb,
  priority    jsonb,
  status      jsonb,
  raised_on   jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists maintenance_tickets_created_idx on public.maintenance_tickets (created_at desc);
alter table public.maintenance_tickets enable row level security;

create table if not exists public.transfers (
  id          text primary key,
  teacher     jsonb,
  from_school jsonb,
  to_school   jsonb,
  reason      jsonb,
  status      jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists transfers_created_idx on public.transfers (created_at desc);
alter table public.transfers enable row level security;

-- ==== 024-create-remaining-store-tables.sql ====
-- VASA-EOS(SE) — durable tables for the remaining operational + system stores.
--
-- Completes the persistence audit started in scripts/023. Five more tenant-scoped
-- operational stores (welfare distribution, promotion runs, question papers, exam
-- seating, stock movements) and two user-context system tables (audit_logs,
-- notifications) had no migration, so they too fell back to in-memory in
-- production. This creates them.

-- ---- Tenant-scoped operational tables ----
-- Same posture as scripts/023: jsonb data columns (faithful round-trip of the
-- stores' mixed values), tenant_id + the tenant_isolation policy (019). Run after 019.

create table if not exists public.distribution (
  id          text primary key,
  student     jsonb,
  item        jsonb,
  status      jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists distribution_created_idx on public.distribution (created_at desc);
alter table public.distribution enable row level security;
drop policy if exists tenant_isolation on public.distribution;
create policy tenant_isolation on public.distribution for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.promotion_runs (
  id          text primary key,
  label       jsonb,
  total       jsonb,
  promoted    jsonb,
  detained    jsonb,
  graduated   jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists promotion_runs_created_idx on public.promotion_runs (created_at desc);
alter table public.promotion_runs enable row level security;
drop policy if exists tenant_isolation on public.promotion_runs;
create policy tenant_isolation on public.promotion_runs for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.question_papers (
  id            text primary key,
  title         jsonb,
  question_ids  jsonb,
  count         jsonb,
  total_marks   jsonb,
  tenant_id     text,
  created_at    timestamptz not null default now()
);
create index if not exists question_papers_created_idx on public.question_papers (created_at desc);
alter table public.question_papers enable row level security;
drop policy if exists tenant_isolation on public.question_papers;
create policy tenant_isolation on public.question_papers for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.seating_plans (
  id          text primary key,
  label       jsonb,
  candidates  jsonb,
  seated      jsonb,
  unseated    jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists seating_plans_created_idx on public.seating_plans (created_at desc);
alter table public.seating_plans enable row level security;
drop policy if exists tenant_isolation on public.seating_plans;
create policy tenant_isolation on public.seating_plans for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.stock_movements (
  id          text primary key,
  item        jsonb,
  type        jsonb,
  qty         jsonb,
  at          jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists stock_movements_created_idx on public.stock_movements (created_at desc);
alter table public.stock_movements enable row level security;
drop policy if exists tenant_isolation on public.stock_movements;
create policy tenant_isolation on public.stock_movements for select using (public.in_tenant_subtree(tenant_id));

-- ---- User-context system tables ----
-- Written/read through the per-request SSR client (anon key + user cookies), so
-- access is governed by an own-row policy on auth.uid(); the service-role bypasses
-- it for system/admin paths. Ids and timestamps are database-generated.

create table if not exists public.audit_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      text,
  action       text,
  resource     text,
  resource_id  text,
  changes      jsonb,
  created_at   timestamptz not null default now()
);
create index if not exists audit_logs_user_idx on public.audit_logs (user_id, created_at desc);
alter table public.audit_logs enable row level security;
drop policy if exists audit_logs_own on public.audit_logs;
create policy audit_logs_own on public.audit_logs for all
  using (auth.uid()::text = user_id) with check (auth.uid()::text = user_id);

create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     text,
  title       text,
  message     text,
  type        text,
  link        text,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
alter table public.notifications enable row level security;
drop policy if exists notifications_own on public.notifications;
create policy notifications_own on public.notifications for all
  using (auth.uid()::text = user_id) with check (auth.uid()::text = user_id);

-- ==== 025-create-scholarship-flow-table.sql ====
-- VASA-EOS(SE) — durable table for the scholarship / benefit sanction vertical.
--
-- Each application carries a live SCHOLARSHIP_SANCTION workflow instance (Headmaster
-- verify -> BEO sanction -> DEO scrutiny for >= ₹25,000 -> DBT release) plus the rich
-- intake from the application form (category, income, attendance, masked DBT account,
-- AI-eligibility verdict). Written through the service-role client when configured;
-- in-memory otherwise. RLS deny-by-default — these rows carry beneficiary PII; the
-- trusted service-role bypasses RLS and performs the app's own scoping.

create table if not exists public.scholarship_flows (
  id          text primary key,
  student     text not null,
  scheme      text not null,
  amount      numeric,
  instance    jsonb not null default '{}'::jsonb,
  details     jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists scholarship_flows_created_idx on public.scholarship_flows (created_at desc);

alter table public.scholarship_flows enable row level security;

-- ==== 026-create-health-flow-table.sql ====
-- VASA-EOS(SE) — durable table for the RBSK health-referral vertical.
--
-- Each referral carries a live HEALTH_REFERRAL workflow instance (School verify -> Block
-- Medical Officer -> District DEIC specialist for referral cases) plus the rich screening
-- detail (class, severity, screening date, findings, masked guardian contact, triage).
-- These rows are sensitive child-health PII: RLS is enabled deny-by-default, so only the
-- trusted service-role (which performs the app's own scoping) can read them.

create table if not exists public.health_flows (
  id                  text primary key,
  student             text not null,
  category            text not null,
  specialist_referral boolean not null default false,
  instance            jsonb not null default '{}'::jsonb,
  details             jsonb,
  created_at          timestamptz not null default now()
);

create index if not exists health_flows_created_idx on public.health_flows (created_at desc);

alter table public.health_flows enable row level security;

-- ==== 027-create-transfer-flow-table.sql ====
-- VASA-EOS(SE) — durable table for the teacher transfer & counselling vertical.
--
-- Each request carries a live TRANSFER_REQUEST workflow instance (Headmaster NOC -> BEO
-- recommendation -> DEO counselling/order -> Directorate sanction for inter-district moves)
-- plus the rich intake (current/requested posting, reason, years of service, eligibility).
-- Written through the service-role client when configured; in-memory otherwise. RLS is
-- enabled deny-by-default; the trusted service-role performs the app's own scoping.

create table if not exists public.transfer_flows (
  id              text primary key,
  teacher         text not null,
  inter_district  boolean not null default false,
  instance        jsonb not null default '{}'::jsonb,
  details         jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists transfer_flows_created_idx on public.transfer_flows (created_at desc);

alter table public.transfer_flows enable row level security;

-- ==== 028-create-infra-flow-table.sql ====
-- VASA-EOS(SE) — durable table for the infrastructure works sanction vertical.
--
-- Each proposal carries a live INFRA_WORKS workflow instance (Headmaster estimate -> Block
-- technical scrutiny -> District sanction -> Directorate approval for high-value works) plus
-- the rich intake (funding source, justification, RTE/RPwD-mandated flag). Written through the
-- service-role client when configured; in-memory otherwise. RLS enabled deny-by-default.

create table if not exists public.infra_flows (
  id          text primary key,
  school      text not null,
  work_type   text not null,
  cost        numeric,
  instance    jsonb not null default '{}'::jsonb,
  details     jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists infra_flows_created_idx on public.infra_flows (created_at desc);

alter table public.infra_flows enable row level security;

-- ==== 029-create-safety-flow-table.sql ====
-- VASA-EOS(SE) — durable table for the child-safety incident vertical.
--
-- Each incident carries a live SAFETY_INCIDENT workflow instance (School verification +
-- mandatory report -> Block safety review -> District Child Protection Unit for mandatory/high
-- cases) plus the rich detail (severity, date, factual account, reporter, mandatory-report
-- flag). POCSO §23: only an anonymised case_ref is stored — NEVER a victim identity. These are
-- highly sensitive safeguarding rows: RLS is enabled deny-by-default; only the trusted
-- service-role (which performs the app's own scoping) can read them.

create table if not exists public.safety_flows (
  id          text primary key,
  case_ref    text not null,
  category    text not null,
  escalate    boolean not null default false,
  instance    jsonb not null default '{}'::jsonb,
  details     jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists safety_flows_created_idx on public.safety_flows (created_at desc);

alter table public.safety_flows enable row level security;

-- ==== 030-create-rti-flow-table.sql ====
-- VASA-EOS(SE) — durable table for the RTI request vertical.
--
-- Each request carries a live RTI_REQUEST workflow instance (PIO -> First Appellate Authority
-- -> State Information Commission) plus the rich intake (category, information sought, fee, BPL
-- exemption, expedite flag, deadline). Written through the service-role client when configured;
-- in-memory otherwise. RLS enabled deny-by-default.

create table if not exists public.rti_flows (
  id          text primary key,
  applicant   text not null,
  subject     text not null,
  instance    jsonb not null default '{}'::jsonb,
  details     jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists rti_flows_created_idx on public.rti_flows (created_at desc);

alter table public.rti_flows enable row level security;

-- ==== 031-create-procurement-flow-table.sql ====
-- VASA-EOS(SE) — durable table for the GeM procurement vertical.
--
-- Each indent carries a live GEM_PROCUREMENT workflow instance (Headmaster estimate -> Block
-- verification -> District financial sanction -> Directorate approval for tenders) plus the rich
-- intake (quantity, funding head, justification, GeM/GFR purchase mode). Written through the
-- service-role client when configured; in-memory otherwise. RLS enabled deny-by-default.

create table if not exists public.procurement_flows (
  id          text primary key,
  item        text not null,
  category    text not null,
  cost        numeric,
  instance    jsonb not null default '{}'::jsonb,
  details     jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists procurement_flows_created_idx on public.procurement_flows (created_at desc);

alter table public.procurement_flows enable row level security;

-- ==== 032-create-budget-flow-table.sql ====
-- VASA-EOS(SE) — durable table for the Budget sanction / re-appropriation vertical.
--
-- Each proposal carries a live BUDGET_SANCTION workflow instance (Directorate proposal ->
-- Secretariat & Finance scrutiny -> Cabinet / Minister approval for new schemes and high-value
-- sanctions) plus the rich intake (proposal type, budget head, source head, fiscal year,
-- justification). Written through the service-role client when configured; in-memory otherwise.
-- RLS enabled deny-by-default.

create table if not exists public.budget_flows (
  id          text primary key,
  scheme      text not null,
  amount      numeric,
  instance    jsonb not null default '{}'::jsonb,
  details     jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists budget_flows_created_idx on public.budget_flows (created_at desc);

alter table public.budget_flows enable row level security;

-- ==== 033-create-tc-flow-table.sql ====
-- VASA-EOS(SE) — durable table for the Transfer Certificate (TC) issuance vertical.
--
-- Each request carries a live TC_ISSUANCE workflow instance (Class Teacher academic record & dues
-- clearance -> Headmaster issues & signs -> Block counter-signature for inter-state / duplicate)
-- plus the rich intake (APAAR id, UDISE code, class last studied, certificate type, reason, date of
-- leaving, dues-cleared). Written through the service-role client when configured; in-memory
-- otherwise. RLS enabled deny-by-default.

create table if not exists public.tc_flows (
  id          text primary key,
  student     text not null,
  instance    jsonb not null default '{}'::jsonb,
  details     jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists tc_flows_created_idx on public.tc_flows (created_at desc);

alter table public.tc_flows enable row level security;

-- ==== 034-create-class-attendance-table.sql ====
-- VASA-EOS(SE) — durable table for class-wise daily attendance.
--
-- Backs the Principal dashboard's "Today's Attendance" block with live data: each row is one
-- class's enrolled/present count for a day, keyed by the school's 11-digit UDISE code. The store
-- returns the latest record per class, so re-recording supersedes the figure while preserving the
-- audit history. Written through the service-role client when configured; in-memory otherwise.
-- RLS enabled deny-by-default.

create table if not exists public.class_attendance (
  id          text primary key,
  udise_code  text not null,
  cls         text not null,
  enrolled    integer not null,
  present     integer not null,
  on_date     date not null,
  tenant_id   text,
  created_at  timestamptz not null default now()
);

create index if not exists class_attendance_school_idx on public.class_attendance (udise_code, on_date desc);

alter table public.class_attendance enable row level security;

-- ==== 035-create-fee-collection-table.sql ====
-- VASA-EOS(SE) — durable table for monthly fee-collection snapshots.
--
-- Backs the Principal dashboard's "Fee Collection" card with live data: each row is one
-- school-month snapshot (billed, collected, defaulters, RTE free-seat students), keyed by the
-- school's 11-digit UDISE code. The store returns the latest period per school, so saving a new
-- month supersedes the card figure while preserving history. Written through the service-role
-- client when configured; in-memory otherwise. RLS enabled deny-by-default.

create table if not exists public.fee_collection (
  id           text primary key,
  udise_code   text not null,
  month        text not null,
  period       text not null,
  billed       bigint not null,
  collected    bigint not null,
  defaulters   integer not null,
  rte_students integer not null,
  tenant_id    text,
  created_at   timestamptz not null default now()
);

create index if not exists fee_collection_school_idx on public.fee_collection (udise_code, period desc);

alter table public.fee_collection enable row level security;

-- ==== 036-create-teacher-presence-table.sql ====
-- VASA-EOS(SE) — durable table for daily teacher-presence snapshots.
--
-- Backs the Principal dashboard's "Teachers Present" KPI with live data: each row is one
-- school-day snapshot (present out of total teaching strength), keyed by the school's 11-digit
-- UDISE code. The store returns the latest day per school. Written through the service-role client
-- when configured; in-memory otherwise. RLS enabled deny-by-default.

create table if not exists public.teacher_presence (
  id          text primary key,
  udise_code  text not null,
  on_date     date not null,
  present     integer not null,
  total       integer not null,
  tenant_id   text,
  created_at  timestamptz not null default now()
);

create index if not exists teacher_presence_school_idx on public.teacher_presence (udise_code, on_date desc);

alter table public.teacher_presence enable row level security;

-- ==== 037-create-enrolment-snapshots-table.sql ====
-- VASA-EOS(SE) — durable table for student enrolment snapshots.
--
-- Backs the Principal dashboard's "Total Students" KPI with live data: each row is one school
-- point-in-time roll (total, boys, girls — for gender parity), keyed by the school's 11-digit
-- UDISE code. The store returns the latest snapshot per school. Written through the service-role
-- client when configured; in-memory otherwise. RLS enabled deny-by-default.

create table if not exists public.enrolment_snapshots (
  id          text primary key,
  udise_code  text not null,
  as_of       date not null,
  total       integer not null,
  boys        integer not null,
  girls       integer not null,
  tenant_id   text,
  created_at  timestamptz not null default now()
);

create index if not exists enrolment_snapshots_school_idx on public.enrolment_snapshots (udise_code, as_of desc);

alter table public.enrolment_snapshots enable row level security;

-- ==== 038-create-dropout-risk-table.sql ====
-- VASA-EOS(SE) — durable table for the dropout-risk register.
--
-- Backs the Principal dashboard's "AI Dropout Risk Alerts" block with live data: each row holds
-- the observable factors per flagged learner (attendance, recent scores, fee default, sibling
-- dropout history); the risk band and explainable triggers are DERIVED on read (advisory, human
-- authority), not stored. Keyed by the school's 11-digit UDISE code. Written through the
-- service-role client when configured; in-memory otherwise. RLS enabled deny-by-default.

create table if not exists public.dropout_risk (
  id               text primary key,
  udise_code       text not null,
  name             text not null,
  cls              text not null,
  absences         integer not null,
  attendance_pct   integer not null,
  recent_score_pct integer not null,
  fee_default      boolean not null default false,
  sibling_dropout  boolean not null default false,
  tenant_id        text,
  created_at       timestamptz not null default now()
);

create index if not exists dropout_risk_school_idx on public.dropout_risk (udise_code, created_at desc);

alter table public.dropout_risk enable row level security;

-- ==== 039-create-school-compliance-table.sql ====
-- VASA-EOS(SE) — durable table for the school statutory-compliance checklist.
--
-- Backs the Principal dashboard's "Compliance Checklist" with live data: each row is one statutory
-- obligation (SMC meeting, UDISE+ submission, mid-day meal register, fire-safety drill, health
-- screening, teacher CPD…) with a status, keyed by the school's 11-digit UDISE code. Written
-- through the service-role client when configured; in-memory otherwise. RLS enabled deny-by-default.

create table if not exists public.school_compliance (
  id          text primary key,
  udise_code  text not null,
  item        text not null,
  status      text not null,
  tenant_id   text,
  created_at  timestamptz not null default now()
);

create index if not exists school_compliance_school_idx on public.school_compliance (udise_code, created_at);

alter table public.school_compliance enable row level security;

-- ==== 040-create-syllabus-progress-table.sql ====
-- VASA-EOS(SE) — durable table for subject-wise syllabus completion.
--
-- Backs the Principal dashboard's "Syllabus Completion" radar with live data: each row is one
-- subject's teaching-portion percentage and the assigned teacher, keyed by the school's 11-digit
-- UDISE code. Written through the service-role client when configured; in-memory otherwise. RLS
-- enabled deny-by-default.

create table if not exists public.syllabus_progress (
  id          text primary key,
  udise_code  text not null,
  subject     text not null,
  teacher     text not null,
  pct         integer not null,
  tenant_id   text,
  created_at  timestamptz not null default now()
);

create index if not exists syllabus_progress_school_idx on public.syllabus_progress (udise_code, created_at);

alter table public.syllabus_progress enable row level security;

-- ==== 041-create-assessment-schedule-table.sql ====
-- VASA-EOS(SE) — durable table for the school assessment schedule.
--
-- Backs the Principal dashboard's "Upcoming Assessments" block with live data: each row is one
-- planned assessment (subject, class, type, date label, status), keyed by the school's 11-digit
-- UDISE code. Written through the service-role client when configured; in-memory otherwise. RLS
-- enabled deny-by-default.

create table if not exists public.assessment_schedule (
  id          text primary key,
  udise_code  text not null,
  subject     text not null,
  cls         text not null,
  type        text not null,
  date        text not null,
  status      text not null,
  tenant_id   text,
  created_at  timestamptz not null default now()
);

create index if not exists assessment_schedule_school_idx on public.assessment_schedule (udise_code, created_at);

alter table public.assessment_schedule enable row level security;

-- ==== 042-add-tenant-to-health-flows.sql ====
-- VASA-EOS(SE) — add per-role jurisdiction scoping to the RBSK health-referral flow.
--
-- Health referrals carry child-health PII (the RBSK "4 Ds"). The listing action now scopes
-- results to the current subject's tenant subtree (lib/access/scope-server), so a school sees only
-- its own referrals, a block its schools', a district its blocks'. This adds the tenant_id column
-- the scoping reads. Existing rows default to the demo school node. RLS remains deny-by-default.

alter table public.health_flows
  add column if not exists tenant_id text not null default 'TN-CHN-B1-S1';

create index if not exists health_flows_tenant_idx on public.health_flows (tenant_id);

-- ==== 043-add-tenant-to-safety-flows.sql ====
-- VASA-EOS(SE) — add per-role jurisdiction scoping to the child-safety incident flow.
--
-- POCSO/child-safety cases are highly sensitive (stored with an anonymised case reference, never a
-- victim identity). The listing action now scopes results to the current subject's tenant subtree
-- (lib/access/scope-server), so a school sees only its own incidents, a block its schools', a
-- district its blocks'. This adds the tenant_id column the scoping reads. Existing rows default to
-- the demo school node. RLS remains deny-by-default.

alter table public.safety_flows
  add column if not exists tenant_id text not null default 'TN-CHN-B1-S1';

create index if not exists safety_flows_tenant_idx on public.safety_flows (tenant_id);

-- ==== 044-add-tenant-to-scholarship-flows.sql ====
-- VASA-EOS(SE) — add per-role jurisdiction scoping to the scholarship/benefit (DBT) flow.
--
-- Benefit applications carry financial PII (a masked DBT account, social category, income). The
-- listing action now scopes results to the current subject's tenant subtree
-- (lib/access/scope-server), so a school sees only its own applications, a block its schools', a
-- district its blocks'. This adds the tenant_id column the scoping reads. Existing rows default to
-- the demo school node. RLS remains deny-by-default.

alter table public.scholarship_flows
  add column if not exists tenant_id text not null default 'TN-CHN-B1-S1';

create index if not exists scholarship_flows_tenant_idx on public.scholarship_flows (tenant_id);

-- ==== 045-add-tenant-to-admission-flows.sql ====
-- VASA-EOS(SE) — add per-role jurisdiction scoping to the RTE admissions flow.
--
-- Admission applications carry student identity, guardian PII and (on enrolment) an APAAR id. The
-- listing action now scopes results to the current subject's tenant subtree
-- (lib/access/scope-server), so a school sees only its own applicants, a block its schools', a
-- district its blocks'. This adds the tenant_id column the scoping reads. Existing rows default to
-- the demo school node. RLS remains deny-by-default.

alter table public.admission_flows
  add column if not exists tenant_id text not null default 'TN-CHN-B1-S1';

create index if not exists admission_flows_tenant_idx on public.admission_flows (tenant_id);

-- ==== 046-create-courses-table.sql ====
-- VASA-EOS(SE) — durable table for the academic course catalogue (full-CRUD module).
--
-- Each row is one course offered by a school: code, name, class level, subject area, teacher,
-- credits and a lifecycle status (Active / Draft / Archived), keyed by the school's tenant node.
-- Written through the service-role client when configured; in-memory otherwise. RLS deny-by-default.

create table if not exists public.courses (
  id           text primary key,
  code         text not null,
  name         text not null,
  class_level  text not null,
  subject_area text not null,
  description  text not null default '',
  credits      integer not null default 4,
  teacher      text not null default '',
  status       text not null default 'Draft',
  tenant_id    text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists courses_status_idx on public.courses (status);
create index if not exists courses_class_idx on public.courses (class_level);

alter table public.courses enable row level security;

-- ==== 047-create-grades-table.sql ====
-- VASA-EOS(SE) — durable table for the gradebook (full-CRUD module).
--
-- Each row is one student's marks in one assessment of one subject, for a term, with a Draft/
-- Published status, keyed by the school's tenant node. Percentage and letter grade are derived on
-- read (not stored). Written through the service-role client when configured; in-memory otherwise.
-- RLS deny-by-default.

create table if not exists public.grades (
  id           text primary key,
  student      text not null,
  apaar_id     text not null default '',
  class_level  text not null,
  subject      text not null,
  term         text not null,
  assessment   text not null,
  marks        integer not null default 0,
  max_marks    integer not null default 100,
  status       text not null default 'Draft',
  tenant_id    text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists grades_class_subject_idx on public.grades (class_level, subject);
create index if not exists grades_status_idx on public.grades (status);

alter table public.grades enable row level security;

-- ==== 048-create-assignments-table.sql ====
-- VASA-EOS(SE) — durable table for assignments (full-CRUD module).
--
-- Each row is a teacher-set assignment (homework, project, worksheet, reading, lab) for a class +
-- subject, with a due date, max marks, instructions and a Draft/Assigned/Closed status, keyed by
-- the school's tenant node. Written through the service-role client when configured; in-memory
-- otherwise. RLS deny-by-default.

create table if not exists public.assignments (
  id            text primary key,
  title         text not null,
  class_level   text not null,
  subject       text not null,
  type          text not null,
  due_date      date not null,
  max_marks     integer not null default 20,
  instructions  text not null default '',
  teacher       text not null default '',
  status        text not null default 'Draft',
  tenant_id     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists assignments_class_subject_idx on public.assignments (class_level, subject);
create index if not exists assignments_status_idx on public.assignments (status);

alter table public.assignments enable row level security;

-- ==== 049-create-report-cards-table.sql ====
-- VASA-EOS(SE) — durable table for consolidated student report cards (full-CRUD module).
--
-- Each row is one student's term report card: per-subject marks stored as JSONB, plus attendance,
-- remarks and a Draft/Published status, keyed by the school's tenant node. Total, percentage,
-- overall grade and Pass/Fail are derived on read (not stored). Written through the service-role
-- client when configured; in-memory otherwise. RLS deny-by-default.

create table if not exists public.report_cards (
  id              text primary key,
  student         text not null,
  apaar_id        text not null default '',
  class_level     text not null,
  term            text not null,
  subjects        jsonb not null default '[]'::jsonb,
  attendance_pct  numeric not null default 0,
  remarks         text not null default '',
  status          text not null default 'Draft',
  tenant_id       text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists report_cards_class_term_idx on public.report_cards (class_level, term);
create index if not exists report_cards_status_idx on public.report_cards (status);

alter table public.report_cards enable row level security;

-- ==== 050-create-students-table.sql ====
-- VASA-EOS(SE) — durable table for the student master register / SIS (full-CRUD module).
--
-- Each row is one student: APAAR id, name, demographics, class/section, guardian and contact, with
-- an enrolment lifecycle status, keyed by the school's tenant node. Written through the
-- service-role client when configured; in-memory otherwise. RLS deny-by-default.

create table if not exists public.students (
  id             text primary key,
  apaar_id       text not null,
  name           text not null,
  gender         text not null,
  dob            date not null,
  class_level    text not null,
  section        text not null default 'A',
  category       text not null,
  guardian_name  text not null default '',
  contact_phone  text not null default '',
  status         text not null default 'Enrolled',
  tenant_id      text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists students_class_section_idx on public.students (class_level, section);
create index if not exists students_status_idx on public.students (status);
create index if not exists students_apaar_idx on public.students (apaar_id);

alter table public.students enable row level security;

-- ==== 051-create-attendance-entries-table.sql ====
-- VASA-EOS(SE) — durable table for the attendance register (full-CRUD module).
--
-- Each row is one student's attendance on one date: Present / Absent / Late / Leave, by class and
-- section, with an optional remark, keyed by the school's tenant node. Complements the daily
-- marking sheet with a queryable register. Written through the service-role client when configured;
-- in-memory otherwise. RLS deny-by-default.

create table if not exists public.attendance_entries (
  id           text primary key,
  student      text not null,
  apaar_id     text not null default '',
  class_level  text not null,
  section      text not null default 'A',
  date         date not null,
  status       text not null default 'Present',
  remarks      text not null default '',
  tenant_id    text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists attendance_entries_date_idx on public.attendance_entries (date);
create index if not exists attendance_entries_class_section_idx on public.attendance_entries (class_level, section);
create index if not exists attendance_entries_status_idx on public.attendance_entries (status);

alter table public.attendance_entries enable row level security;

-- ==== 052-create-timetable-entries-table.sql ====
-- VASA-EOS(SE) — durable table for the timetable manager (full-CRUD module).
--
-- Each row is one period in the weekly timetable: class/section, day, period, time window, subject,
-- teacher and room, keyed by the school's tenant node. Clash detection (a class or teacher can't be
-- double-booked in the same day+period) is enforced in the server action. Written through the
-- service-role client when configured; in-memory otherwise. RLS deny-by-default.

create table if not exists public.timetable_entries (
  id           text primary key,
  class_level  text not null,
  section      text not null default 'A',
  day          text not null,
  period       integer not null,
  start_time   text not null,
  end_time     text not null,
  subject      text not null,
  teacher      text not null,
  room         text not null default '',
  tenant_id    text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists timetable_entries_class_section_idx on public.timetable_entries (class_level, section);
create index if not exists timetable_entries_day_period_idx on public.timetable_entries (day, period);
create index if not exists timetable_entries_teacher_idx on public.timetable_entries (teacher);

alter table public.timetable_entries enable row level security;

-- ==== 053-create-lesson-plans-table.sql ====
-- VASA-EOS(SE) — durable table for rich per-period lesson plans (full-CRUD module).
--
-- Each row is one class session's lesson plan: scheduling (class/section, subject, teacher, date,
-- period, time window), pedagogy (lesson type, topic, objectives, previous/further topics as JSONB
-- arrays) and resources (materials-to-bring array, homework, lesson-planner link, class notes as a
-- JSONB array of {kind,title,url}), with a Draft/Planned/Delivered status, keyed by the school's
-- tenant node. Written through the service-role client when configured; in-memory otherwise.
-- RLS deny-by-default.

create table if not exists public.lesson_plans (
  id                   text primary key,
  class_level          text not null,
  section              text not null default 'A',
  subject              text not null,
  teacher              text not null,
  date                 date not null,
  period               integer not null,
  start_time           text not null,
  end_time             text not null,
  lesson_type          text not null default 'Theory',
  topic                text not null,
  objectives           text not null default '',
  previous_topics      jsonb not null default '[]'::jsonb,
  further_topics       jsonb not null default '[]'::jsonb,
  materials_to_bring   jsonb not null default '[]'::jsonb,
  homework             text not null default '',
  lesson_planner_link  text not null default '',
  class_notes          jsonb not null default '[]'::jsonb,
  status               text not null default 'Draft',
  tenant_id            text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists lesson_plans_class_section_idx on public.lesson_plans (class_level, section);
create index if not exists lesson_plans_date_idx on public.lesson_plans (date);
create index if not exists lesson_plans_subject_idx on public.lesson_plans (subject);

alter table public.lesson_plans enable row level security;

-- ==== 054-create-holidays-table.sql ====
-- VASA-EOS(SE) — durable table for the categorised holiday calendar (full-CRUD module).
--
-- Each row is one holiday: name, category (National/State/Restricted/Local/Optional/Exam Break/
-- Vacation/Special), an inclusive date range, a recurring-annual flag (fixed-date festivals), the
-- academic year and a Confirmed/Tentative status, keyed by the school's tenant node. The
-- Working-Time Scheduler reads this calendar to compute non-working/working days. Written through
-- the service-role client when configured; in-memory otherwise. RLS deny-by-default.

create table if not exists public.holidays (
  id            text primary key,
  name          text not null,
  category      text not null default 'Special',
  start_date    date not null,
  end_date      date not null,
  recurring     boolean not null default false,
  academic_year text not null,
  description   text not null default '',
  status        text not null default 'Confirmed',
  tenant_id     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists holidays_year_idx on public.holidays (academic_year);
create index if not exists holidays_category_idx on public.holidays (category);
create index if not exists holidays_start_idx on public.holidays (start_date);

alter table public.holidays enable row level security;

-- ==== 055-create-worktime-profiles-table.sql ====
-- VASA-EOS(SE) — durable table for the working-time scheduler (full-CRUD module).
--
-- Each row is one academic-year working-time profile: term window, working weekdays (JSONB int
-- array), daily start/end and the daily bell-schedule (JSONB array of {label,kind,startTime,
-- endTime}), with a Draft/Active status, keyed by the school's tenant node. Combined with the
-- Holiday Calendar it resolves real school days. Written through the service-role client when
-- configured; in-memory otherwise. RLS deny-by-default.

create table if not exists public.worktime_profiles (
  id                text primary key,
  name              text not null,
  academic_year     text not null,
  term_start        date not null,
  term_end          date not null,
  working_weekdays  jsonb not null default '[1,2,3,4,5,6]'::jsonb,
  day_start         text not null,
  day_end           text not null,
  periods           jsonb not null default '[]'::jsonb,
  status            text not null default 'Draft',
  tenant_id         text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists worktime_profiles_year_idx on public.worktime_profiles (academic_year);
create index if not exists worktime_profiles_status_idx on public.worktime_profiles (status);

alter table public.worktime_profiles enable row level security;

-- ==== 056-create-student-fees-table.sql ====
-- VASA-EOS(SE) — durable table for per-student fees & DBT-linked collections (full-CRUD module).
--
-- Each row is one student's fee record for an academic year: the fee heads (JSONB demand), a
-- concession/waiver and its amount, a DBT/scholarship linkage, the receipts ledger (JSONB
-- collection), a due date and notes, keyed by the school's tenant node. Net demand, balance,
-- payment status and the defaulter flag are derived on read (not stored). Written through the
-- service-role client when configured; in-memory otherwise. RLS deny-by-default.

create table if not exists public.student_fees (
  id                 text primary key,
  student            text not null,
  apaar_id           text not null default '',
  class_level        text not null,
  section            text not null default 'A',
  academic_year      text not null,
  heads              jsonb not null default '[]'::jsonb,
  concession_type    text not null default 'None',
  concession_amount  numeric not null default 0,
  scholarship_scheme text not null default '',
  dbt_reference      text not null default '',
  due_date           date not null,
  receipts           jsonb not null default '[]'::jsonb,
  notes              text not null default '',
  tenant_id          text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists student_fees_class_section_idx on public.student_fees (class_level, section);
create index if not exists student_fees_year_idx on public.student_fees (academic_year);
create index if not exists student_fees_apaar_idx on public.student_fees (apaar_id);

alter table public.student_fees enable row level security;

-- ==== 057-create-library-loans-table.sql ====
-- VASA-EOS(SE) — durable table for library circulation loans (full-CRUD module).
--
-- Each row is one book copy issued to a member: the book (accession no, title, author, category),
-- the member (name, id, type, class), the issue/due/return dates, renewals and the fine policy
-- (fine/day + waived), keyed by the school's tenant node. Loan status (Issued/Returned/Overdue) and
-- the fine due are derived on read. Written through the service-role client when configured;
-- in-memory otherwise. RLS deny-by-default.

create table if not exists public.library_loans (
  id             text primary key,
  accession_no   text not null,
  title          text not null,
  author         text not null,
  category       text not null default 'Textbook',
  member         text not null,
  member_id      text not null,
  member_type    text not null default 'Student',
  class_level    text not null default '',
  issue_date     date not null,
  due_date       date not null,
  return_date    date,
  renewal_count  integer not null default 0,
  fine_per_day   numeric not null default 2,
  fine_waived    numeric not null default 0,
  notes          text not null default '',
  tenant_id      text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists library_loans_accession_idx on public.library_loans (accession_no);
create index if not exists library_loans_member_idx on public.library_loans (member_id);
create index if not exists library_loans_due_idx on public.library_loans (due_date);

alter table public.library_loans enable row level security;

-- ==== 058-create-transport-routes-table.sql ====
-- VASA-EOS(SE) — durable table for transport routes (full-CRUD module).
--
-- Each row is one school transport route: the route (name/code, shift, status), the vehicle (number,
-- type, capacity), the driver (name, phone), the ordered stops (JSONB array of {name,pickupTime,
-- dropTime}), the number of students assigned and the term fare, keyed by the school's tenant node.
-- Occupancy, free seats and the overloaded flag are derived on read. Written through the
-- service-role client when configured; in-memory otherwise. RLS deny-by-default.

create table if not exists public.transport_routes (
  id              text primary key,
  route_name      text not null,
  route_code      text not null,
  vehicle_no      text not null,
  vehicle_type    text not null default 'Bus',
  driver_name     text not null,
  driver_phone    text not null,
  capacity        integer not null default 40,
  assigned_count  integer not null default 0,
  stops           jsonb not null default '[]'::jsonb,
  fare_per_term   numeric not null default 0,
  shift           text not null default 'Both',
  status          text not null default 'Active',
  notes           text not null default '',
  tenant_id       text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists transport_routes_code_idx on public.transport_routes (route_code);
create index if not exists transport_routes_status_idx on public.transport_routes (status);

alter table public.transport_routes enable row level security;

-- ==== 059-create-asset-register-table.sql ====
-- VASA-EOS(SE) — durable table for the asset register & inventory (full-CRUD module).
--
-- Each row is one asset/stock line: identity (tag, name, category), location, quantity + unit,
-- condition and lifecycle status, optional assignment, procurement (purchase date, unit cost, useful
-- life, funding source) and a reorder level, keyed by the school's tenant node. Total value,
-- straight-line book value, accumulated depreciation and the low-stock flag are derived on read.
-- Written through the service-role client when configured; in-memory otherwise. RLS deny-by-default.

create table if not exists public.asset_register (
  id                 text primary key,
  asset_tag          text not null,
  name               text not null,
  category           text not null default 'Other',
  location           text not null default '',
  quantity           integer not null default 0,
  unit               text not null default 'Piece',
  condition          text not null default 'Good',
  status             text not null default 'In Stock',
  assigned_to        text not null default '',
  purchase_date      date not null,
  unit_cost          numeric not null default 0,
  useful_life_years  integer not null default 5,
  reorder_level      integer not null default 0,
  funding_source     text not null default 'Other',
  notes              text not null default '',
  tenant_id          text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists asset_register_tag_idx on public.asset_register (asset_tag);
create index if not exists asset_register_category_idx on public.asset_register (category);
create index if not exists asset_register_status_idx on public.asset_register (status);

alter table public.asset_register enable row level security;

-- ==== 060-create-staff-master-table.sql ====
-- VASA-EOS(SE) — durable table for the staff master / HR directory (full-CRUD module).
--
-- Each row is one staff member: identity (staff id, name), role (designation, cadre, department),
-- demographics (gender, dob), joining/qualification, contact (phone, email), employment type and
-- service status, plus casual/earned leave balances and pay scale, keyed by the school's tenant
-- node. Service years, age and the retirement-due flag are derived on read. Written through the
-- service-role client when configured; in-memory otherwise. RLS deny-by-default.

create table if not exists public.staff_master (
  id                    text primary key,
  staff_id              text not null,
  name                  text not null,
  designation           text not null,
  cadre                 text not null default 'Teaching',
  department            text not null default 'Administration',
  gender                text not null,
  dob                   date not null,
  doj                   date not null,
  qualification         text not null default '',
  phone                 text not null default '',
  email                 text not null default '',
  employment_type       text not null default 'Permanent',
  status                text not null default 'Active',
  casual_leave_balance  numeric not null default 0,
  earned_leave_balance  numeric not null default 0,
  pay_scale             text not null default '',
  notes                 text not null default '',
  tenant_id             text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists staff_master_staffid_idx on public.staff_master (staff_id);
create index if not exists staff_master_cadre_idx on public.staff_master (cadre);
create index if not exists staff_master_status_idx on public.staff_master (status);

alter table public.staff_master enable row level security;

-- ==== 061-create-ews-cases-table.sql ====
-- VASA-EOS(SE) — durable table for early-warning cases (the human-in-the-loop record).
--
-- The AI risk model + Analytics Engine flag at-risk students (advisory, derived at read time, not
-- stored). When a HUMAN acts, they open a case here and move it Open → Acknowledged → Resolved with
-- an assignee and intervention notes — the durable record that AI assists but humans decide. Keyed
-- by the school's tenant node. Written through the service-role client when configured; in-memory
-- otherwise. RLS deny-by-default.

create table if not exists public.ews_cases (
  id            text primary key,
  student       text not null,
  apaar_id      text not null default '',
  class_level   text not null default '',
  section       text not null default '',
  risk_level    text not null default 'Medium',
  score         integer not null default 0,
  factors       text not null default '',
  status        text not null default 'Open',
  assignee      text not null default '',
  intervention  text not null default '',
  opened_by     text not null default '',
  tenant_id     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists ews_cases_status_idx on public.ews_cases (status);
create index if not exists ews_cases_student_idx on public.ews_cases (student);

alter table public.ews_cases enable row level security;

-- ==== 062-create-diagnostics-table.sql ====
-- VASA-EOS(SE) — durable table for diagnostic assessments + remediation plans (full-CRUD module).
--
-- Each row is one learner's diagnostic: identity (student, class/section, subject), the assessment
-- title/type/date, the rubric (JSONB array of {id,objective,marks,awarded}) and the human-decided
-- remediation plan (status, approved_by, remediation notes), keyed by the school's tenant node.
-- The Assessment Engine diagnosis (per-objective mastery, weak objectives, band) is DERIVED on read
-- from the rubric — never stored — so it is always reproducible and explainable. Written through the
-- service-role client when configured; in-memory otherwise. RLS deny-by-default.

create table if not exists public.diagnostics (
  id               text primary key,
  student          text not null,
  apaar_id         text not null default '',
  class_level      text not null,
  section          text not null default 'A',
  subject          text not null,
  title            text not null,
  assessment_type  text not null default 'Diagnostic',
  date             date not null,
  items            jsonb not null default '[]'::jsonb,
  plan_status      text not null default 'AI Draft',
  approved_by      text not null default '',
  remediation      text not null default '',
  tenant_id        text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists diagnostics_student_idx on public.diagnostics (student);
create index if not exists diagnostics_subject_idx on public.diagnostics (subject);
create index if not exists diagnostics_plan_idx on public.diagnostics (plan_status);

alter table public.diagnostics enable row level security;

-- ==== 063-create-learning-pathways-table.sql ====
-- VASA-EOS(SE) — durable table for adaptive learning pathways (full-CRUD module).
--
-- Each row is one learner's adaptive pathway for a subject: the objectives (JSONB array of {id,
-- label, prereqs, mastery}), the mastery threshold, and the human-decided pathway plan (status,
-- approved_by, plan notes), keyed by the school's tenant node. The Personalisation Engine
-- recommendation (next-ready objectives) is DERIVED on read from the objectives — never stored — so
-- it is always reproducible. Written through the service-role client when configured; in-memory
-- otherwise. RLS deny-by-default.

create table if not exists public.learning_pathways (
  id           text primary key,
  student      text not null,
  apaar_id     text not null default '',
  class_level  text not null,
  section      text not null default 'A',
  subject      text not null,
  title        text not null,
  objectives   jsonb not null default '[]'::jsonb,
  threshold    integer not null default 70,
  plan_status  text not null default 'AI Draft',
  approved_by  text not null default '',
  plan         text not null default '',
  tenant_id    text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists learning_pathways_student_idx on public.learning_pathways (student);
create index if not exists learning_pathways_subject_idx on public.learning_pathways (subject);
create index if not exists learning_pathways_plan_idx on public.learning_pathways (plan_status);

alter table public.learning_pathways enable row level security;

-- ==== 064-create-policy-proposals-table.sql ====
-- VASA-EOS(SE) — durable table for policy proposals (full-CRUD module).
--
-- Each row is one policy-as-code proposal: the scheme + scope, the baseline (population, current
-- coverage, unit cost) and the coverage lever (target coverage, equity weighting), plus the
-- sanctioning decision (status, decided_by, sanctioned_budget, notes), keyed by the school's tenant
-- node. The Policy Engine projection (newly-covered, indicative cost, equity note) is DERIVED on
-- read from the baseline + lever — never stored — so it is always reproducible. Written through the
-- service-role client when configured; in-memory otherwise. RLS deny-by-default.

create table if not exists public.policy_proposals (
  id                     text primary key,
  title                  text not null,
  scheme                 text not null,
  scope                  text not null default 'District',
  population             integer not null default 0,
  baseline_coverage_pct  numeric not null default 0,
  unit_cost              numeric not null default 0,
  target_coverage_pct    numeric not null default 0,
  equity_weighted        boolean not null default false,
  status                 text not null default 'AI Draft',
  decided_by             text not null default '',
  sanctioned_budget      numeric not null default 0,
  notes                  text not null default '',
  tenant_id              text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists policy_proposals_scheme_idx on public.policy_proposals (scheme);
create index if not exists policy_proposals_status_idx on public.policy_proposals (status);

alter table public.policy_proposals enable row level security;

-- ==== 065-create-eligibility-cases-table.sql ====
-- VASA-EOS(SE) — durable table for eligibility & compliance cases (full-CRUD module).
--
-- Each row is one case: the subject (applicant/school) + reference, the rule-set category, the facts
-- (JSONB array of {key,value}) and the human decision (decision, decided_by, notes), keyed by the
-- school's tenant node. The Reasoning Engine derivation (which published rules fired, and why) is
-- DERIVED on read from the facts + the category's rule set — never stored — so it is always
-- reproducible and fully auditable. Written through the service-role client when configured;
-- in-memory otherwise. RLS deny-by-default.

create table if not exists public.eligibility_cases (
  id          text primary key,
  subject     text not null,
  reference   text not null default '',
  category    text not null,
  facts       jsonb not null default '[]'::jsonb,
  decision    text not null default 'AI Draft',
  decided_by  text not null default '',
  notes       text not null default '',
  tenant_id   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists eligibility_cases_category_idx on public.eligibility_cases (category);
create index if not exists eligibility_cases_decision_idx on public.eligibility_cases (decision);

alter table public.eligibility_cases enable row level security;

-- ==== 066-create-kb-articles-table.sql ====
-- VASA-EOS(SE) — durable table for the grounded knowledge base (full-CRUD module).
--
-- Each row is one curated knowledge article (the Tamil Nadu policy/scheme/pedagogy canon): title,
-- category, the grounded content the assistant may quote, and a citable source, keyed by the
-- school's tenant node. The Conversational Engine answers questions ONLY from these articles and
-- cites the source — it never invents. Written through the service-role client when configured;
-- in-memory otherwise. RLS deny-by-default.

create table if not exists public.kb_articles (
  id          text primary key,
  title       text not null,
  category    text not null default 'General',
  content     text not null,
  source      text not null default '',
  tenant_id   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists kb_articles_category_idx on public.kb_articles (category);

alter table public.kb_articles enable row level security;

-- ==== 067-create-agent-tasks-table.sql ====
-- VASA-EOS(SE) — durable table for the AI agent task inbox (full-CRUD module).
--
-- Each row is one task dispatched to a Native-AI agent: the agent + scope, the input, the agent's
-- advisory output (output, confidence, reasoning, available_tools JSONB, assertive, mode), the
-- high-stakes/approval flag, and the HUMAN review (status, reviewed_by, notes), keyed by the
-- school's tenant node. The agents operate under continuous human authority — high-stakes agents
-- route their action through human approval. Written through the service-role client when
-- configured; in-memory otherwise. RLS deny-by-default.

create table if not exists public.agent_tasks (
  id                 text primary key,
  agent              text not null,
  agent_label        text not null,
  scope              text not null default '',
  input              text not null,
  output             text not null default '',
  confidence         numeric not null default 0,
  reasoning          text not null default '',
  available_tools    jsonb not null default '[]'::jsonb,
  requires_approval  boolean not null default false,
  assertive          boolean not null default false,
  mode               text not null default 'mock',
  status             text not null default 'Pending',
  reviewed_by        text not null default '',
  notes              text not null default '',
  tenant_id          text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists agent_tasks_agent_idx on public.agent_tasks (agent);
create index if not exists agent_tasks_status_idx on public.agent_tasks (status);

alter table public.agent_tasks enable row level security;

-- ==== 068-create-school-kpis-table.sql ====
-- VASA-EOS(SE) — durable table for per-school KPI snapshots (multi-tier roll-up; full-CRUD module).
--
-- Each row is one school's KPI snapshot for an academic year: enrolment, attendance %, pass %, fee
-- collection %, at-risk count and compliance gaps, plus its district and block. These roll UP —
-- enrolment-weighted — to block, district and state for evidence-based governance. Keyed by the
-- school's tenant node. Written through the service-role client when configured; in-memory
-- otherwise. RLS deny-by-default.

create table if not exists public.school_kpis (
  id                  text primary key,
  school_name         text not null,
  udise               text not null,
  district            text not null,
  block               text not null,
  enrolment           integer not null default 0,
  attendance_pct      numeric not null default 0,
  pass_pct            numeric not null default 0,
  fee_collection_pct  numeric not null default 0,
  at_risk_count       integer not null default 0,
  compliance_gaps     integer not null default 0,
  academic_year       text not null,
  tenant_id           text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists school_kpis_district_idx on public.school_kpis (district);
create index if not exists school_kpis_block_idx on public.school_kpis (block);
create index if not exists school_kpis_udise_idx on public.school_kpis (udise);

alter table public.school_kpis enable row level security;

-- ==== 069-create-federation-logs-table.sql ====
-- VASA-EOS(SE) — durable table for federation reconciliation logs (full-CRUD module).
--
-- Each row records one federated lookup against a national system of record (APAAR / UDISE+ /
-- DIKSHA / PFMS): the source, the lookup key, a summary of the federated record, the gateway mode
-- (mock/live), and the human reconciliation (status Pending → Reconciled / Flagged, reconciled_by,
-- notes), keyed by the school's tenant node. The platform federates — it reads the source of truth
-- and a human reconciles — it never duplicates. Written through the service-role client when
-- configured; in-memory otherwise. RLS deny-by-default.

create table if not exists public.federation_logs (
  id            text primary key,
  source        text not null,
  source_label  text not null,
  key           text not null,
  summary       text not null default '',
  mode          text not null default 'mock',
  status        text not null default 'Pending',
  reconciled_by text not null default '',
  notes         text not null default '',
  tenant_id     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists federation_logs_source_idx on public.federation_logs (source);
create index if not exists federation_logs_status_idx on public.federation_logs (status);

alter table public.federation_logs enable row level security;

-- ==== 070-create-health-records-table.sql ====
-- VASA-EOS(SE) — durable table for the school health register (full-CRUD module).
--
-- Each row is one student's routine health screening: anthropometry (height, weight), vision/hearing/
-- dental results, immunisation status and an optional haemoglobin reading, keyed by the school's
-- tenant node. BMI, the nutrition band, the anaemia flag and the referral recommendation are DERIVED
-- on read — never stored — so they are always reproducible. Complements the RBSK clinical referral
-- flow. Written through the service-role client when configured; in-memory otherwise. RLS
-- deny-by-default.

create table if not exists public.health_records (
  id                       text primary key,
  student                  text not null,
  apaar_id                 text not null default '',
  class_level              text not null,
  section                  text not null default 'A',
  gender                   text not null,
  screening_date           date not null,
  height_cm                numeric not null default 0,
  weight_kg                numeric not null default 0,
  vision                   text not null default 'Normal',
  hearing                  text not null default 'Normal',
  dental                   text not null default 'Normal',
  immunisation_up_to_date  boolean not null default true,
  hemoglobin               numeric not null default 0,
  remarks                  text not null default '',
  tenant_id                text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists health_records_class_section_idx on public.health_records (class_level, section);
create index if not exists health_records_apaar_idx on public.health_records (apaar_id);

alter table public.health_records enable row level security;

-- ==== 071-create-cover-arrangements-table.sql ====
-- VASA-EOS(SE) — durable table for the substitute / cover arrangement register (full-CRUD module).
--
-- When a teacher is absent, every one of their periods must be covered. Each row is one uncovered
-- period for a class on a date — the absent teacher, the reason, the slot (class/section/period),
-- the subject, the assigned substitute (if any) and the status (Pending → Assigned → Completed),
-- keyed by the school's tenant node. Substitute SUGGESTIONS are derived live from the timetable
-- (teachers free in that exact day+period) — never stored — so they always reflect the current
-- roster. Written through the service-role client when configured; in-memory otherwise. RLS
-- deny-by-default.

create table if not exists public.cover_arrangements (
  id                  text primary key,
  date                date not null,
  absent_teacher      text not null,
  reason              text not null default 'Casual Leave',
  class_level         text not null,
  section             text not null default 'A',
  period              integer not null default 1,
  subject             text not null,
  substitute_teacher  text not null default '',
  status              text not null default 'Pending',
  notes               text not null default '',
  tenant_id           text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists cover_arrangements_date_idx on public.cover_arrangements (date);
create index if not exists cover_arrangements_status_idx on public.cover_arrangements (status);
create index if not exists cover_arrangements_slot_idx on public.cover_arrangements (class_level, section, period);

alter table public.cover_arrangements enable row level security;

-- ==== 072-create-scheme-fund-ledger-table.sql ====
-- VASA-EOS(SE) — durable table for the Scheme Fund-Flow Ledger (full-CRUD module).
--
-- The platform's LOCAL books for centrally/state-sponsored schemes: per scheme, financial year and
-- tier, the allocated → released → utilised amounts (whole rupees), keyed by the tenant node. PFMS is
-- the national source of truth; the Federation console reconciles each scheme's local figures against
-- PFMS to surface fund-flow drift (potential leakage/mis-posting). Release rate, utilisation and the
-- unspent/unreleased balances are DERIVED on read — never stored — so they are always reproducible.
-- Written through the service-role client when configured; in-memory otherwise. RLS deny-by-default.

create table if not exists public.scheme_fund_ledger (
  id              text primary key,
  scheme_code     text not null,
  scheme_name     text not null,
  financial_year  text not null,
  tier            text not null default 'State',
  allocated       numeric not null default 0,
  released        numeric not null default 0,
  utilised        numeric not null default 0,
  as_of           date not null,
  notes           text not null default '',
  tenant_id       text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists scheme_fund_ledger_scheme_idx on public.scheme_fund_ledger (scheme_code);
create index if not exists scheme_fund_ledger_fy_idx on public.scheme_fund_ledger (financial_year);
create index if not exists scheme_fund_ledger_tier_idx on public.scheme_fund_ledger (tier);

alter table public.scheme_fund_ledger enable row level security;

-- ==== 073-create-verifiable-credentials-table.sql ====
-- VASA-EOS(SE) — durable table for the Verifiable Credential Ledger (NFT / soulbound tokens).
--
-- Learner achievements minted as non-transferable (soulbound) credentials, soulbound to the holder's
-- APAAR id and ANCHORED to the tamper-evident audit ledger via anchor_seq. content_hash is computed
-- over the issuance fields at mint time; verification recomputes it to detect any post-mint tampering.
-- Revocation is an append-only overlay (revoked / revoked_at / revoke_reason) — it never alters the
-- minted content, so an authentically-minted-but-revoked credential still verifies as authentic while
-- reporting its revoked status. The in-app analogue of the brief's permissioned-blockchain academic
-- records + NFT credentials (NOT a distributed ledger / on-chain mint). RLS deny-by-default.

create table if not exists public.verifiable_credentials (
  id            text primary key,
  apaar_id      text not null,
  kind          text not null,
  title         text not null,
  issuer        text not null,
  issued_at     timestamptz not null default now(),
  soulbound     boolean not null default true,
  content_hash  text not null,
  anchor_seq    bigint not null,
  revoked       boolean not null default false,
  revoked_at    timestamptz,
  revoke_reason text not null default ''
);

create index if not exists verifiable_credentials_holder_idx on public.verifiable_credentials (apaar_id);
create index if not exists verifiable_credentials_kind_idx on public.verifiable_credentials (kind);
create index if not exists verifiable_credentials_anchor_idx on public.verifiable_credentials (anchor_seq);

alter table public.verifiable_credentials enable row level security;

-- ==== 074-smc-attributable-ballots.sql ====
-- VASA-EOS(SE) — add attributable ballots to the SMC (Education DAO) proposals table.
--
-- The DAO-style School Management Committee originally tallied anonymous vote counters. To make the
-- committee "on-chain ACCOUNTABLE" (every vote attributable, one member one vote), each proposal now
-- carries an array of member ballots. The legacy votes_for / votes_against counters are kept in sync
-- as the distinct-voter tally; the per-ballot tamper-evidence remains the hash-chained audit ledger.
-- Idempotent. (Base table created in scripts/015-persist-interactive-modules.sql.)

alter table if exists public.smc_proposals
  add column if not exists ballots jsonb not null default '[]'::jsonb;

-- ==== 075-create-iot-readings-table.sql ====
-- VASA-EOS(SE) — durable table for the IoT telemetry mesh (ingest + threshold alerting).
--
-- Each row is one device sample: a metric reading from a school environment / nutrition / infrastructure
-- / biometric-attendance sensor, keyed by the school UDISE and the tenant node. Severity (Normal /
-- Warning / Critical) is DERIVED on read from the metric's safe-operating bounds — never stored — so
-- thresholds can be tuned without rewriting history. Written through the service-role client when
-- configured; in-memory otherwise. RLS deny-by-default.

create table if not exists public.iot_readings (
  id            text primary key,
  device_id     text not null,
  device_label  text not null,
  school_udise  text not null,
  metric_key    text not null,
  value         numeric not null,
  captured_at   timestamptz not null default now(),
  tenant_id     text
);

create index if not exists iot_readings_device_idx on public.iot_readings (device_id);
create index if not exists iot_readings_metric_idx on public.iot_readings (metric_key);
create index if not exists iot_readings_captured_idx on public.iot_readings (captured_at);
create index if not exists iot_readings_school_idx on public.iot_readings (school_udise);

alter table public.iot_readings enable row level security;

-- ==== 076-create-outcome-records-table.sql ====
-- VASA-EOS(SE) — durable table for outcome instrumentation (TN Quality Index + Opportunity-Gap).
--
-- Each row is one cohort's term outcomes, disaggregated by district, school category, rural/urban,
-- gender, social category and disability (RPwD), with the component metrics (FLN, attendance,
-- transition, pass) 0-100 and a cohort size. The Quality Index and the Opportunity-Gap Index are
-- DERIVED on read (cohort-weighted composites) — never stored — so the weighting can be tuned and
-- the indices recomputed for any disaggregation. Written through the service-role client when
-- configured; in-memory otherwise. RLS deny-by-default.

create table if not exists public.outcome_records (
  id               text primary key,
  term             text not null,
  district         text not null,
  school_category  text not null,
  area             text not null,
  gender           text not null,
  social_category  text not null,
  pwd              boolean not null default false,
  fln_pct          numeric not null default 0,
  attendance_pct   numeric not null default 0,
  transition_pct   numeric not null default 0,
  pass_pct         numeric not null default 0,
  cohort_size      integer not null default 0,
  tenant_id        text
);

create index if not exists outcome_records_district_idx on public.outcome_records (district);
create index if not exists outcome_records_term_idx on public.outcome_records (term);
create index if not exists outcome_records_social_idx on public.outcome_records (social_category);

alter table public.outcome_records enable row level security;

-- ==== 077-rls-agent-tool-requests.sql ====
-- VASA-EOS(SE) — Phase-0 production hardening: close the last RLS gap.
--
-- A coverage audit of every migration found a single table created WITHOUT row-level security:
-- public.agent_tool_requests (the human-in-the-loop agent tool-approval queue, scripts/020). The
-- service-role client bypasses RLS and is the only identity that touches it in the app today, but
-- deny-by-default RLS on EVERY table is the correct government-grade posture (defence-in-depth for the
-- anon / authenticated keys). This enables it with no permissive policy. Idempotent.
--
-- tests/rls-coverage.test.ts now gates this: every `create table` must have RLS enabled somewhere in
-- the migration set, so this gap can never silently reopen.

alter table if exists public.agent_tool_requests enable row level security;

-- ==== 078-backfill-tenant-scoping.sql ====
-- VASA-EOS(SE) — backfill the ReBAC tenant scoping AFTER every operational table exists.
--
-- Migration 018 scopes tables in numeric order, but several of the scopable tables are created later
-- (023/024). This re-runs the same existence-guarded loop once all tables are present, so every scoped
-- table reliably has its tenant_id column + index. Idempotent (column/index use IF NOT EXISTS).

do $$
declare
  t text;
  scoped text[] := array[
    'alumni','assemblies','bagless_activities','bank_accounts','cadets','cctv_cameras','certificates',
    'competition_entries','cooks','council_candidates','cwsn_students','diagnostic_rounds','distribution',
    'drills','eco_activities','excursions','fitness_records','guest_lectures','homework','ict_sessions',
    'incidents','loans','lost_found','mdm_register','notices','oosc_children','promotion_runs',
    'question_papers','readers','result_publications','rte_applicants','rti_requests','safety_concerns',
    'scholarships','seating_plans','sf_projects','sport_results','staff_attendance_sheets',
    'stock_movements','tc_requests','textbook_indents','vacancy_lines','visitors','voc_enrolments','water_tests'
  ];
begin
  foreach t in array scoped loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I add column if not exists tenant_id text not null default ''TN-CHN-B1-S1'';', t);
      execute format('create index if not exists %I on public.%I (tenant_id);', t || '_tenant_id_idx', t);
    end if;
  end loop;
end $$;

-- ==== 079-enable-rls-all-tables.sql ====
-- VASA-EOS(SE) — Phase-0 production hardening: deny-by-default RLS on EVERY public table.
--
-- Per-table RLS is enabled across the migrations, but a few legacy tables (created with varying
-- syntax) slipped through. This is the belt-and-suspenders government-grade guarantee: a catalogue
-- loop that enables row-level security on every base table in the public schema, so the provisioned
-- database is deny-by-default everywhere regardless of how each table was created. Runs last;
-- idempotent (enabling RLS twice is a no-op). The service-role client the app uses bypasses RLS and
-- remains the only identity that touches these tables today.

do $$
declare
  r record;
begin
  for r in
    select tablename
    from pg_tables
    where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security;', r.tablename);
  end loop;
end $$;

-- ==== 081-create-calendar-entries-table.sql ====
-- VASA-EOS(SE) TN — Academic Calendar durable store (L6 calendar service / platformd).
-- Backs platform/integration/calendar_pg.go. Entries plan the academic year (terms, exams, holidays, PTM,
-- events) and carry their dynamic multi-level approval chain as JSONB. Applied automatically by the adapter's
-- ensureSchema() on first connect; kept here as the canonical migration of record.
CREATE TABLE IF NOT EXISTS calendar_entries (
    id            TEXT PRIMARY KEY,
    title         TEXT NOT NULL,
    type          TEXT NOT NULL,                       -- term | exam | holiday | ptm | event
    start_date    TEXT NOT NULL,                       -- YYYY-MM-DD (inclusive)
    end_date      TEXT NOT NULL,                       -- YYYY-MM-DD (inclusive)
    org_unit      TEXT NOT NULL,                       -- tenant node the entry applies to
    academic_year TEXT NOT NULL DEFAULT '',
    description   TEXT NOT NULL DEFAULT '',
    status        TEXT NOT NULL DEFAULT 'draft',       -- draft | pending | approved | rejected
    current_step  INT  NOT NULL DEFAULT 0,
    chain         JSONB NOT NULL DEFAULT '[]'::jsonb,  -- ordered approval steps (G-tier/role/scope/decision)
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL,
    synthetic     BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS calendar_entries_type_idx ON calendar_entries (type);
CREATE INDEX IF NOT EXISTS calendar_entries_org_idx  ON calendar_entries (org_unit);
CREATE INDEX IF NOT EXISTS calendar_entries_date_idx ON calendar_entries (start_date);

-- ==== 082-create-exam-sheets-tables.sql ====
-- VASA-EOS(SE) TN — Examinations & Results durable store (L6 exams service / platformd).
-- Backs platform/integration/exams_pg.go. A marks sheet per examination and one row per student result.
-- Applied automatically by the adapter's ensureSchema() on first connect; kept here as the migration of record.
CREATE TABLE IF NOT EXISTS exam_sheets (
    exam_id   TEXT PRIMARY KEY,
    org_unit  TEXT NOT NULL,                  -- the school (T6) the exam belongs to
    subject   TEXT NOT NULL,
    class     TEXT NOT NULL,
    max_marks INT  NOT NULL,
    status    TEXT NOT NULL DEFAULT 'open'    -- open | submitted | published | returned
);

CREATE TABLE IF NOT EXISTS exam_results (
    exam_id    TEXT NOT NULL REFERENCES exam_sheets(exam_id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,                 -- APAAR-anchored learner id (synthetic in demo)
    marks      INT  NOT NULL,
    grade      TEXT NOT NULL DEFAULT '',      -- A1..E, computed on submit
    pass       BOOLEAN NOT NULL DEFAULT false,
    seq        BIGSERIAL,                     -- preserves entry order
    PRIMARY KEY (exam_id, student_id)
);

CREATE INDEX IF NOT EXISTS exam_sheets_org_idx ON exam_sheets (org_unit);

-- ==== 083-create-leave-requests-table.sql ====
-- VASA-EOS(SE) TN — Staff Leave & Approval durable store (L6 leave service / platformd).
-- Backs platform/integration/leave_pg.go. The Next.js leave-approval flow (app/leave-approvals) calls platformd
-- which persists here. The dynamic multi-level approval chain (principal → +BEO over 5 days → +DEO over 15 days)
-- is stored as JSONB. Applied automatically by the adapter's ensureSchema(); kept here as the migration of record.
CREATE TABLE IF NOT EXISTS leave_requests (
    id           TEXT PRIMARY KEY,
    employee     TEXT NOT NULL,
    type         TEXT NOT NULL,                       -- casual | medical | earned | maternity | duty
    from_date    TEXT NOT NULL,                       -- YYYY-MM-DD
    to_date      TEXT NOT NULL,                       -- YYYY-MM-DD
    days         INT  NOT NULL,
    reason       TEXT NOT NULL DEFAULT '',
    org_unit     TEXT NOT NULL,                       -- the school the request is filed at
    status       TEXT NOT NULL DEFAULT 'pending',     -- pending | approved | rejected
    chain        JSONB NOT NULL DEFAULT '[]'::jsonb,  -- ordered approval steps (role/decision/decided_by/...)
    current_step INT  NOT NULL DEFAULT 0,
    created_at   TEXT NOT NULL,
    updated_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS leave_requests_org_idx    ON leave_requests (org_unit);
CREATE INDEX IF NOT EXISTS leave_requests_status_idx ON leave_requests (status);

-- ==== 084-create-audit-chain-table.sql ====
-- VASA-EOS(SE) TN — durable tamper-evident audit hash-chain (L5 audit / platformd).
-- Backs platform/integration/audit_pg.go (the audit.Sink). Append-only: the seq primary key and the UNIQUE
-- hash mean any insertion, reordering, or truncation is detectable, and each prev_hash links to the prior
-- record's hash. On startup the platform reloads this table and RE-VERIFIES the chain, refusing to run on a
-- tampered history. Applied automatically by the sink's ensureSchema(); kept here as the migration of record.
CREATE TABLE IF NOT EXISTS audit_chain (
    seq       BIGINT PRIMARY KEY,
    ts        TEXT NOT NULL DEFAULT '',
    actor     TEXT NOT NULL DEFAULT '',
    action    TEXT NOT NULL,
    resource  TEXT NOT NULL DEFAULT '',
    effect    TEXT NOT NULL DEFAULT '',   -- permit | deny | require-approval | executed
    detail    TEXT NOT NULL DEFAULT '',
    prev_hash TEXT NOT NULL,
    hash      TEXT NOT NULL UNIQUE        -- sha256 over the canonical payload (incl. prev_hash)
);

-- ==== 085-create-grievance-cases-table.sql ====
-- VASA-EOS(SE) TN — Grievance Redressal case store (L12 grievance service / platformd).
-- Backs platform/integration/grievance_case_pg.go. A citizen grievance becomes a durable case handled by a
-- tier of officers under an SLA; the escalation chain (by category) is stored as JSONB, and a case past its
-- due_at is auto-escalated by the platform's SLA sweep. Applied by the adapter's ensureSchema(); migration of record.
CREATE TABLE IF NOT EXISTS grievance_cases (
    id           TEXT PRIMARY KEY,
    complainant  TEXT NOT NULL,
    category     TEXT NOT NULL,                       -- academic | infrastructure | safety | financial | service
    subject      TEXT NOT NULL DEFAULT '',
    org_unit     TEXT NOT NULL,                       -- the school/office the grievance concerns
    status       TEXT NOT NULL DEFAULT 'open',        -- open | resolved | rejected | escalated
    chain        JSONB NOT NULL DEFAULT '[]'::jsonb,  -- ordered handler tiers (role/decision/decided_by/...)
    current_tier INT  NOT NULL DEFAULT 0,
    filed_at     TEXT NOT NULL,
    due_at       TEXT NOT NULL,                       -- SLA deadline for the current tier
    resolution   TEXT NOT NULL DEFAULT '',
    updated_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS grievance_cases_org_idx    ON grievance_cases (org_unit);
CREATE INDEX IF NOT EXISTS grievance_cases_status_idx ON grievance_cases (status);

-- ==== 086-create-admission-applications-table.sql ====
-- VASA-EOS(SE) TN — durable admission applications register (admission workflow / platformd).
-- Backs platform/integration/admission_pg.go. Records the decision for each RTE admission application — stage,
-- governing reasons, HITL request id, anchored credential id — WITHOUT cleartext PII (the applicant's name is
-- sealed under the tenant KEK during the workflow; only a pii_sealed flag is kept here). Applied by the
-- adapter's ensureSchema(); kept here as the migration of record.
CREATE TABLE IF NOT EXISTS admission_applications (
    id            TEXT PRIMARY KEY,                  -- applicant id (APAAR-anchored; synthetic in demo)
    category      TEXT NOT NULL DEFAULT '',          -- GEN | OBC | SC | ST | EWS | DG
    age           INT  NOT NULL DEFAULT 0,
    tenant        TEXT NOT NULL DEFAULT '',
    region        TEXT NOT NULL DEFAULT '',
    decision      TEXT NOT NULL DEFAULT '',          -- requested: admit | reject
    stage         TEXT NOT NULL DEFAULT '',          -- admitted | denied | pending-approval | residency
    effect        TEXT NOT NULL DEFAULT '',          -- permit | deny | require-approval (from the Rego PDP)
    reasons       TEXT NOT NULL DEFAULT '',          -- governing rule ids
    request_id    TEXT NOT NULL DEFAULT '',          -- HITL request id when pending approval
    credential_id TEXT NOT NULL DEFAULT '',          -- anchored admission credential id on admit
    pii_sealed    BOOLEAN NOT NULL DEFAULT false,    -- PII was enveloped under the tenant KEK
    decided_at    TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS admission_applications_tenant_idx ON admission_applications (tenant);
CREATE INDEX IF NOT EXISTS admission_applications_stage_idx  ON admission_applications (stage);

-- ==== 087-create-attendance-records-table.sql ====
-- VASA-EOS(SE) TN — Student Attendance durable store (L6 attendance service / platformd).
-- Backs platform/integration/attendance_pg.go. One row per student per day (upserted, so re-marking corrects
-- rather than duplicates). Feeds the RTE chronic-absentee early-warning analytics. Applied by the adapter's
-- ensureSchema(); kept here as the migration of record.
CREATE TABLE IF NOT EXISTS attendance_records (
    student_id TEXT NOT NULL,                 -- APAAR-anchored learner id (synthetic in demo)
    org_unit   TEXT NOT NULL,                 -- the school (T6 tenancy node)
    date       TEXT NOT NULL,                 -- YYYY-MM-DD
    status     TEXT NOT NULL,                 -- present | absent | late | excused
    source     TEXT NOT NULL DEFAULT '',      -- biometric | manual | rfid
    marked_by  TEXT NOT NULL DEFAULT '',
    marked_at  TEXT NOT NULL DEFAULT '',
    PRIMARY KEY (student_id, date)
);
CREATE INDEX IF NOT EXISTS attendance_org_date_idx ON attendance_records (org_unit, date);
CREATE INDEX IF NOT EXISTS attendance_student_idx  ON attendance_records (student_id);

-- ==== 088-create-scholarship-disbursements-table.sql ====
-- VASA-EOS(SE) TN — Scholarship / DBT durable store (L6 scholarship service / platformd).
-- Backs platform/integration/scholarship_pg.go. A scholarship is sanctioned through an amount-driven multi-level
-- fund-approval chain (PFMS/GFR, stored as JSONB), disbursed with a payment reference, then reconciled against
-- the rail (unmatched = a leakage flag). Money is held in paise (BIGINT) — never floats. Applied by the
-- adapter's ensureSchema(); kept here as the migration of record.
CREATE TABLE IF NOT EXISTS scholarship_disbursements (
    id           TEXT PRIMARY KEY,
    student_id   TEXT NOT NULL,                       -- APAAR-anchored learner id
    scheme       TEXT NOT NULL,                       -- pre-matric | post-matric | merit | maintenance
    amount_paise BIGINT NOT NULL,                     -- money in paise (Rs 1 = 100 paise)
    org_unit     TEXT NOT NULL,                       -- the school the beneficiary belongs to
    status       TEXT NOT NULL DEFAULT 'pending',     -- pending|sanctioned|disbursed|reconciled|flagged|rejected
    chain        JSONB NOT NULL DEFAULT '[]'::jsonb,  -- ordered sanction tiers (role/decision/decided_by/...)
    current_step INT  NOT NULL DEFAULT 0,
    payment_ref  TEXT NOT NULL DEFAULT '',            -- PFMS/treasury transaction reference on disbursement
    filed_at     TEXT NOT NULL,
    updated_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS scholarship_org_idx    ON scholarship_disbursements (org_unit);
CREATE INDEX IF NOT EXISTS scholarship_status_idx ON scholarship_disbursements (status);

-- ==== 089-create-cpd-records-table.sql ====
-- VASA-EOS(SE) TN — Teacher CPD durable store (L6 cpd service / platformd).
-- Backs platform/integration/cpd_pg.go. The record of in-service training (NISHTHA/SCERT/DIET/DIKSHA) a teacher
-- completes, feeding the NEP 2020 compliance analytics (>=50 hours/year). Applied by the adapter's
-- ensureSchema(); kept here as the migration of record.
CREATE TABLE IF NOT EXISTS cpd_records (
    id           TEXT PRIMARY KEY,
    teacher_id   TEXT NOT NULL,                 -- HRMS employee id (synthetic in demo)
    org_unit     TEXT NOT NULL,                 -- the teacher's school (T6 tenancy node)
    course       TEXT NOT NULL DEFAULT '',
    provider     TEXT NOT NULL,                 -- NISHTHA | SCERT | DIET | DIKSHA
    hours        INT  NOT NULL DEFAULT 0,
    year         INT  NOT NULL,
    status       TEXT NOT NULL,                 -- enrolled | completed | certified
    completed_on TEXT NOT NULL DEFAULT '',      -- YYYY-MM-DD
    recorded_at  TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS cpd_teacher_year_idx ON cpd_records (teacher_id, year);
CREATE INDEX IF NOT EXISTS cpd_org_year_idx     ON cpd_records (org_unit, year);

-- ==== 090-create-rbsk-screenings-table.sql ====
-- VASA-EOS(SE) TN — RBSK child-health screening durable store (L12 rbsk service / platformd).
-- Backs platform/integration/rbsk_pg.go. Every student is screened for the four Ds; any finding (stored as
-- JSONB) is auto-referred to the DEIC and tracked to closure. Applied by the adapter's ensureSchema(); kept
-- here as the migration of record.
CREATE TABLE IF NOT EXISTS rbsk_screenings (
    id             TEXT PRIMARY KEY,
    student_id     TEXT NOT NULL,                      -- APAAR-anchored learner id (synthetic in demo)
    org_unit       TEXT NOT NULL,                      -- the school (T6 tenancy node)
    screened_on    TEXT NOT NULL,                      -- YYYY-MM-DD
    findings       JSONB NOT NULL DEFAULT '[]'::jsonb, -- subset of: defect | disease | deficiency | disability
    status         TEXT NOT NULL,                      -- healthy | referred | under-treatment | closed
    referred_to    TEXT NOT NULL DEFAULT '',           -- DEIC on a finding
    closed_outcome TEXT NOT NULL DEFAULT '',
    updated_at     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS rbsk_org_idx    ON rbsk_screenings (org_unit);
CREATE INDEX IF NOT EXISTS rbsk_status_idx ON rbsk_screenings (status);

-- ==== 091-create-timetable-slots-table.sql ====
-- VASA-EOS(SE) TN — School Timetable durable store (L6 timetable service / platformd).
-- Backs platform/integration/timetable_pg.go. One subject+teacher per (class, day, period); the teacher-clash
-- invariant (a teacher can never be in two classes at once) is enforced by the adapter before each upsert.
-- Applied by the adapter's ensureSchema(); kept here as the migration of record.
CREATE TABLE IF NOT EXISTS timetable_slots (
    org_unit   TEXT NOT NULL,                 -- the school (T6 tenancy node)
    class      TEXT NOT NULL,                 -- e.g. "Grade 8-A"
    day        TEXT NOT NULL,                 -- monday..saturday
    period     INT  NOT NULL,                 -- 1..8
    subject    TEXT NOT NULL,
    teacher_id TEXT NOT NULL,
    PRIMARY KEY (org_unit, class, day, period)
);
CREATE INDEX IF NOT EXISTS timetable_teacher_idx ON timetable_slots (teacher_id, day, period);

-- ==== 092-create-library-loans-table.sql ====
-- VASA-EOS(SE) TN — School Library circulation durable store (L6 library service / platformd).
-- Backs platform/integration/library_pg.go. Each row is a circulation record (a physical copy issued to a
-- member). The one-copy-one-borrower invariant — a single physical copy can be on loan to at most one member
-- at a time — is enforced both by the adapter's pre-insert existence check AND by the partial unique index
-- below. Applied by the adapter's ensureSchema(); kept here as the migration of record.
CREATE TABLE IF NOT EXISTS library_loans (
    id          TEXT PRIMARY KEY,              -- loan id
    org_unit    TEXT NOT NULL,                 -- the school library (T6 tenancy node)
    book_id     TEXT NOT NULL,                 -- catalogue id / ISBN
    title       TEXT NOT NULL DEFAULT '',
    copy_id     TEXT NOT NULL,                 -- the physical copy barcode (unique within a library)
    member_id   TEXT NOT NULL,                 -- borrower (synthetic student/teacher id)
    issued_on   TEXT NOT NULL,                 -- YYYY-MM-DD
    due_on      TEXT NOT NULL,                 -- YYYY-MM-DD (issued + 14 days, extended on renewal)
    returned_on TEXT NOT NULL DEFAULT '',      -- YYYY-MM-DD when returned
    status      TEXT NOT NULL,                 -- on_loan | returned | lost
    renewals    INT  NOT NULL DEFAULT 0        -- capped at 2
);
CREATE INDEX IF NOT EXISTS library_member_idx ON library_loans (member_id);
-- at most one active loan per physical copy (the one-copy-one-borrower invariant, enforced in the schema).
CREATE UNIQUE INDEX IF NOT EXISTS library_copy_active_idx ON library_loans (org_unit, copy_id) WHERE status='on_loan';

-- ==== 093-create-transport-tables.sql ====
-- VASA-EOS(SE) TN — School Transport route-safety durable store (L6 transport service / platformd).
-- Backs platform/integration/transport_pg.go. Two tables: bus routes (vehicle + driver with statutory validity
-- dates) and the student seat allotments on them. The two hard safety invariants — a route can never exceed its
-- seating capacity, and no student may be allotted to an UNSERVICEABLE vehicle (lapsed fitness certificate or
-- driver licence) — are enforced by the adapter against the durable state before each insert; the
-- one-active-seat-per-student-per-route rule is backstopped by the partial unique index below. Applied by the
-- adapter's ensureSchema(); kept here as the migration of record.
CREATE TABLE IF NOT EXISTS transport_routes (
    id                 TEXT PRIMARY KEY,
    org_unit           TEXT NOT NULL,                 -- the school (T6 tenancy node)
    name               TEXT NOT NULL DEFAULT '',
    vehicle_no         TEXT NOT NULL,
    capacity           INT  NOT NULL,                 -- seating capacity (the hard ceiling)
    fitness_valid_till TEXT NOT NULL,                 -- vehicle FC expiry (YYYY-MM-DD)
    driver_name        TEXT NOT NULL DEFAULT '',
    licence_valid_till TEXT NOT NULL,                 -- driver licence expiry (YYYY-MM-DD)
    status             TEXT NOT NULL                  -- active | suspended
);
CREATE TABLE IF NOT EXISTS transport_allotments (
    id         TEXT PRIMARY KEY,
    route_id   TEXT NOT NULL,
    org_unit   TEXT NOT NULL,
    student_id TEXT NOT NULL,
    stop       TEXT NOT NULL DEFAULT '',
    status     TEXT NOT NULL                          -- allotted | withdrawn
);
CREATE INDEX IF NOT EXISTS transport_allot_route_idx ON transport_allotments (route_id, status);
-- at most one active seat per student per route.
CREATE UNIQUE INDEX IF NOT EXISTS transport_allot_unique_idx ON transport_allotments (route_id, student_id) WHERE status='allotted';

-- ==== 094-create-mdm-tables.sql ====
-- VASA-EOS(SE) TN — Mid-Day Meal (PM-POSHAN) durable store (L6 mdm service / platformd).
-- Backs platform/integration/mdm_pg.go. Two tables: the per-school foodgrain stock ledger (receipts in,
-- consumptions out) and the daily meal-service register. Foodgrain is tracked in GRAMS (BIGINT, never floats),
-- mirroring the money-in-paise discipline. The core accountability invariant — stock can never go negative (a
-- day can never cook more grain than is on hand) — is enforced by the adapter against the durable balance INSIDE
-- the same transaction that writes the meal + its matching consumption ledger entry, so service and draw-down
-- are atomic. Applied by the adapter's ensureSchema(); kept here as the migration of record.
CREATE TABLE IF NOT EXISTS mdm_ledger (
    id          TEXT PRIMARY KEY,
    org_unit    TEXT   NOT NULL,                  -- the school (T6 tenancy node)
    date        TEXT   NOT NULL,                  -- YYYY-MM-DD
    kind        TEXT   NOT NULL,                  -- receipt | consumption
    grain_grams BIGINT NOT NULL,                  -- positive movement size in grams
    note        TEXT   NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS mdm_meals (
    id           TEXT PRIMARY KEY,
    org_unit     TEXT   NOT NULL,
    date         TEXT   NOT NULL,
    meals_served INT    NOT NULL,                 -- <= enrolment (data-quality gate)
    enrolment    INT    NOT NULL,
    grain_grams  BIGINT NOT NULL                  -- grain cooked for this day's service
);
CREATE INDEX IF NOT EXISTS mdm_ledger_org_idx ON mdm_ledger (org_unit, kind);
CREATE INDEX IF NOT EXISTS mdm_meals_org_idx  ON mdm_meals (org_unit, date);

-- ==== 095-create-infra-tables.sql ====
-- VASA-EOS(SE) TN — Infrastructure & Asset Register durable store (L6 infra service / platformd).
-- Backs platform/integration/infra_pg.go. Two tables: the school asset register (rooms/ICT/furniture/sanitation
-- with a condition grade) and the maintenance tickets raised against them. The register invariants — a ticket
-- may only be raised against a known, non-decommissioned asset; a ticket walks open → in_progress → resolved →
-- closed; and an asset can never be decommissioned (or returned to service) while it still has open tickets — are
-- enforced by the adapter against the durable state (a critical ticket's auto-flip to under_maintenance is
-- written in the same transaction as the ticket). Applied by the adapter's ensureSchema(); kept here as the
-- migration of record.
CREATE TABLE IF NOT EXISTS infra_assets (
    id          TEXT PRIMARY KEY,
    org_unit    TEXT NOT NULL,                 -- the school (T6 tenancy node)
    name        TEXT NOT NULL,
    category    TEXT NOT NULL,                 -- room | furniture | equipment | ict | sanitation | ...
    condition   TEXT NOT NULL,                 -- good | fair | poor | unusable
    status      TEXT NOT NULL,                 -- in_service | under_maintenance | decommissioned
    acquired_on TEXT NOT NULL DEFAULT ''       -- YYYY-MM-DD
);
CREATE TABLE IF NOT EXISTS infra_tickets (
    id          TEXT PRIMARY KEY,
    asset_id    TEXT NOT NULL,
    org_unit    TEXT NOT NULL,
    issue       TEXT NOT NULL,
    severity    TEXT NOT NULL,                 -- low | medium | high | critical
    status      TEXT NOT NULL,                 -- open | in_progress | resolved | closed
    raised_on   TEXT NOT NULL,
    assignee    TEXT NOT NULL DEFAULT '',
    resolved_on TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS infra_assets_org_idx    ON infra_assets (org_unit, status);
CREATE INDEX IF NOT EXISTS infra_tickets_asset_idx ON infra_tickets (asset_id, status);

-- ==== 096-create-fee-tables.sql ====
-- VASA-EOS(SE) TN — Fee & Finance Ledger durable store (L6 fees service / platformd).
-- Backs platform/integration/fees_pg.go. Two tables: fee demands raised against students and the payments
-- collected against them. Every amount is in PAISE (BIGINT, never floats), mirroring the money-in-paise
-- discipline used across the platform's finance verticals. The no-overpayment invariant — a payment can never
-- take the collected total above the amount demanded — is enforced by the adapter against the durable collected
-- total INSIDE the same transaction that writes the payment and recomputes the demand status (pending → partial
-- → paid), so collection and status are atomic. Applied by the adapter's ensureSchema(); kept here as the
-- migration of record.
CREATE TABLE IF NOT EXISTS fee_demands (
    id           TEXT PRIMARY KEY,
    org_unit     TEXT   NOT NULL,                -- the school (T6 tenancy node)
    student_id   TEXT   NOT NULL,
    category     TEXT   NOT NULL,                -- exam | hostel | special | ...
    term         TEXT   NOT NULL DEFAULT '',
    amount_paise BIGINT NOT NULL,                -- gross amount due, in paise
    status       TEXT   NOT NULL,                -- pending | partial | paid | waived | cancelled
    due_on       TEXT   NOT NULL                 -- YYYY-MM-DD
);
CREATE TABLE IF NOT EXISTS fee_payments (
    id           TEXT PRIMARY KEY,
    demand_id    TEXT   NOT NULL,
    org_unit     TEXT   NOT NULL,
    student_id   TEXT   NOT NULL,
    amount_paise BIGINT NOT NULL,                -- collection amount, in paise
    mode         TEXT   NOT NULL,                -- cash | online | upi | dd | cheque
    reference    TEXT   NOT NULL DEFAULT '',
    paid_on      TEXT   NOT NULL                 -- YYYY-MM-DD
);
CREATE INDEX IF NOT EXISTS fee_demands_org_idx     ON fee_demands (org_unit, status);
CREATE INDEX IF NOT EXISTS fee_payments_demand_idx ON fee_payments (demand_id);

-- ==== 097-create-immunisation-table.sql ====
-- VASA-EOS(SE) TN — School Health Immunisation durable store (L6 immunisation service / platformd).
-- Backs platform/integration/immunisation_pg.go. Each row is one vaccine dose administered to a student under
-- the school-health schedule (UIP / RBSK school-age vaccines). The clinical invariants — a dose may only be
-- recorded in SEQUENCE (dose N requires doses 1..N-1 already given), a vaccine can never exceed its scheduled
-- dose count, and a dose cannot be future-dated — are enforced by the adapter against the durable doses before
-- the upsert; the partial unique index below backstops the no-duplicate-dose-slot rule. Health data is
-- sensitive: aggregate coverage is surfaced publicly, the per-child worklist only to the governing officer.
-- Applied by the adapter's ensureSchema(); kept here as the migration of record.
CREATE TABLE IF NOT EXISTS immunisation_doses (
    id              TEXT PRIMARY KEY,
    student_id      TEXT NOT NULL,
    org_unit        TEXT NOT NULL,                 -- the school (T6 tenancy node)
    vaccine         TEXT NOT NULL,                 -- schedule code (Td10 | Td16 | MR | JE | VitA | Albendazole)
    dose_number     INT  NOT NULL,                 -- 1..required for the vaccine
    administered_on TEXT NOT NULL,                 -- YYYY-MM-DD (never future-dated)
    batch           TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS immunisation_student_idx ON immunisation_doses (student_id, vaccine);
CREATE INDEX IF NOT EXISTS immunisation_org_idx     ON immunisation_doses (org_unit);
-- a student can hold a given vaccine dose number at most once (backstops the no-duplicate-slot invariant).
CREATE UNIQUE INDEX IF NOT EXISTS immunisation_dose_slot_idx ON immunisation_doses (student_id, vaccine, dose_number);

-- ==== 098-create-ptm-tables.sql ====
-- VASA-EOS(SE) TN — Parent-Teacher Meeting durable store (L6 ptm service / platformd).
-- Backs platform/integration/ptm_pg.go. Two tables: scheduled PTM sessions (with a fixed slot count) and the
-- guardian bookings against them. The capacity-checked booking invariants — a session can never be OVERBOOKED
-- beyond its slots, a guardian can never double-book the same session, a cancelled session takes no bookings,
-- and a booking walks booked → attended | no_show (a cancellation frees its slot) — are enforced by the adapter
-- against the durable bookings; the partial unique index below backstops the no-double-booking rule. Applied by
-- the adapter's ensureSchema(); kept here as the migration of record.
CREATE TABLE IF NOT EXISTS ptm_sessions (
    id       TEXT PRIMARY KEY,
    org_unit TEXT NOT NULL,                       -- the school (T6 tenancy node)
    title    TEXT NOT NULL,
    date     TEXT NOT NULL,                        -- YYYY-MM-DD
    slots    INT  NOT NULL,                        -- booking capacity (the hard ceiling)
    status   TEXT NOT NULL                         -- scheduled | cancelled
);
CREATE TABLE IF NOT EXISTS ptm_bookings (
    id         TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    org_unit   TEXT NOT NULL,
    student_id TEXT NOT NULL,
    guardian   TEXT NOT NULL DEFAULT '',
    status     TEXT NOT NULL,                      -- booked | attended | no_show | cancelled
    slot       TEXT NOT NULL DEFAULT ''            -- optional time-slot label
);
CREATE INDEX IF NOT EXISTS ptm_bookings_session_idx ON ptm_bookings (session_id, status);
-- a student holds at most one active (non-cancelled) booking per session.
CREATE UNIQUE INDEX IF NOT EXISTS ptm_bookings_active_idx ON ptm_bookings (session_id, student_id) WHERE status<>'cancelled';

-- ==== 099-create-entitlement-tables.sql ====
-- VASA-EOS(SE) TN — Free-Supply Entitlement Distribution durable store (L6 entitlement service / platformd).
-- Backs platform/integration/entitlement_pg.go. Two tables: the per-student entitlements under TN's free-supply
-- schemes (textbooks/uniforms/notebooks/…) and the issues (distribution events) made against them. The
-- accountability invariant — a student can never be issued MORE than their entitlement (the over-issue/leakage
-- gate) — is enforced by the adapter against the durable issued total INSIDE the same transaction that writes
-- the issue and recomputes the entitlement status (pending → partial → fulfilled), so the distribution and
-- status are atomic. Applied by the adapter's ensureSchema(); kept here as the migration of record.
CREATE TABLE IF NOT EXISTS entitlements (
    id           TEXT PRIMARY KEY,
    org_unit     TEXT NOT NULL,                    -- the school (T6 tenancy node)
    student_id   TEXT NOT NULL,
    item         TEXT NOT NULL,                    -- textbook | notebook | uniform | shoes | bag | cycle | ...
    entitled_qty INT  NOT NULL,                    -- units owed
    term         TEXT NOT NULL DEFAULT '',
    status       TEXT NOT NULL                     -- pending | partial | fulfilled | cancelled
);
CREATE TABLE IF NOT EXISTS entitlement_issues (
    id             TEXT PRIMARY KEY,
    entitlement_id TEXT NOT NULL,
    org_unit       TEXT NOT NULL,
    student_id     TEXT NOT NULL,
    qty            INT  NOT NULL,                  -- units issued in this distribution event
    issued_on      TEXT NOT NULL,                  -- YYYY-MM-DD
    reference      TEXT NOT NULL DEFAULT ''        -- goods-received-note / acknowledgement ref
);
CREATE INDEX IF NOT EXISTS entitlements_org_idx       ON entitlements (org_unit, status);
CREATE INDEX IF NOT EXISTS entitlement_issues_ent_idx ON entitlement_issues (entitlement_id);

-- ==== 100-create-establishment-tables.sql ====
-- VASA-EOS(SE) TN — Staff Establishment & Sanctioned-Post Register durable store (L6 establishment service /
-- platformd). Backs platform/integration/establishment_pg.go. Two tables: the sanctioned-post lines (a cadre at
-- a school with a sanctioned strength) and the appointments made against them. The accountability invariant —
-- the FILLED posts of a cadre can never exceed its SANCTIONED strength (the over-appointment gate) — is enforced
-- by the adapter against the durable filled count before each insert; the partial unique index below backstops
-- the one-filled-post-per-employee-per-establishment rule. A vacated post frees its slot; vacancy (sanctioned −
-- filled) is derived. Applied by the adapter's ensureSchema(); kept here as the migration of record.
CREATE TABLE IF NOT EXISTS establishments (
    id         TEXT PRIMARY KEY,
    org_unit   TEXT NOT NULL,                      -- the school (T6 tenancy node)
    cadre      TEXT NOT NULL,                       -- e.g. Graduate Teacher (BT) | Headmaster | Office Assistant
    sanctioned INT  NOT NULL,                       -- sanctioned strength (the hard ceiling)
    status     TEXT NOT NULL                        -- active | frozen
);
CREATE TABLE IF NOT EXISTS establishment_appointments (
    id               TEXT PRIMARY KEY,
    establishment_id TEXT NOT NULL,
    org_unit         TEXT NOT NULL,
    employee_id      TEXT NOT NULL,
    name             TEXT NOT NULL DEFAULT '',
    status           TEXT NOT NULL,                 -- filled | vacated
    appointed_on     TEXT NOT NULL                  -- YYYY-MM-DD
);
CREATE INDEX IF NOT EXISTS establishments_org_idx        ON establishments (org_unit, status);
CREATE INDEX IF NOT EXISTS estab_appts_establishment_idx ON establishment_appointments (establishment_id, status);
-- an employee holds at most one filled post per establishment.
CREATE UNIQUE INDEX IF NOT EXISTS estab_appts_emp_idx ON establishment_appointments (establishment_id, employee_id) WHERE status='filled';

commit;
