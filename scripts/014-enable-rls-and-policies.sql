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
