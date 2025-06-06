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
