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
