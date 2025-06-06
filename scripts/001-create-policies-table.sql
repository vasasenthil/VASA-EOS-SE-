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
