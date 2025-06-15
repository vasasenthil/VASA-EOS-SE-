-- 1. Enable RLS for all relevant tables
-- This will block all access by default until we create policies
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

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
USING (auth.uid() = id);

-- Policy: Allow users to update their own profile information.
CREATE POLICY "Users can update their own data"
ON public.users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy: Allow authenticated users to insert their own user record
-- (This is often needed if user creation involves inserting into public.users after auth.users creation)
-- Ensure the ID matches the authenticated user's ID.
CREATE POLICY "Users can insert their own user record"
ON public.users FOR INSERT
WITH CHECK (auth.uid() = id);


-- 3. Create Policies for the 'courses' table
-- Policy: Allow any authenticated user to view all courses.
CREATE POLICY "Authenticated users can view courses"
ON public.courses FOR SELECT
USING (auth.role() = 'authenticated');
-- Add policies for INSERT, UPDATE, DELETE for courses as needed, likely restricted to specific roles (e.g., admin, teacher)


-- 4. Create Policies for 'enrollments'
-- Policy: Allow users to see their own enrollments.
CREATE POLICY "Users can see their own enrollments"
ON public.enrollments FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Allow students to enroll themselves in a course.
CREATE POLICY "Students can create their own enrollments"
ON public.enrollments FOR INSERT
WITH CHECK (auth.uid() = user_id);


-- 5. Create Policies for 'assignments'
-- Policy: Allow authenticated users to view assignments (e.g., for enrolled courses).
-- This might need to be more specific, e.g., join with enrollments.
CREATE POLICY "Authenticated users can view assignments"
ON public.assignments FOR SELECT
USING (auth.role() = 'authenticated');


-- 6. Create Policies for 'submissions'
-- Policy: Allow users to see their own submissions.
CREATE POLICY "Users can see their own submissions"
ON public.submissions FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Allow users to create their own submissions.
CREATE POLICY "Users can create their own submissions"
ON public.submissions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow users to update their own submissions (e.g., before grading).
CREATE POLICY "Users can update their own submissions"
ON public.submissions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


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
