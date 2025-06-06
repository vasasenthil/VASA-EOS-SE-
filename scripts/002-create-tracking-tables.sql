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
