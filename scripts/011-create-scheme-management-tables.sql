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
    governance_tier_id UUID REFERENCES governance_tiers(id) ON DELETE SET NULL, -- Optional: typical tier this subtype belongs to
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
    tier_id UUID NOT NULL REFERENCES governance_tiers(id) ON DELETE CASCADE,
    role_description TEXT, -- e.g., "Implementing Agency", "Monitoring Body", "Beneficiary Level"
    PRIMARY KEY (scheme_id, tier_id)
);

-- Update policies table to link schemes (optional, if policies can lead to schemes)
-- ALTER TABLE policies ADD COLUMN related_scheme_id UUID REFERENCES schemes(id) ON DELETE SET NULL;
-- CREATE INDEX IF NOT EXISTS idx_policies_related_scheme_id ON policies(related_scheme_id);

-- Enable RLS and define policies as needed for these tables later.
