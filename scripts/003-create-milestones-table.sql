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
