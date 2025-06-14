-- 1. Enable RLS for all relevant tables
-- This will block all access by default until we create policies
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
-- Add other tables here as needed, e.g., policies
-- ALTER TABLE policies ENABLE ROW LEVEL SECURITY;


-- 2. Create Policies for the 'users' table
-- Policy: Allow users to see their own profile information.
CREATE POLICY "Users can view their own data"
ON users FOR SELECT
USING (auth.uid() = id);

-- Policy: Allow users to update their own profile information.
CREATE POLICY "Users can update their own data"
ON users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);


-- 3. Create Policies for the 'courses' table
-- Policy: Allow any authenticated user to view all courses.
-- (You might want to restrict this later, e.g., only users from the same school)
CREATE POLICY "Authenticated users can view courses"
ON courses FOR SELECT
USING (auth.role() = 'authenticated');


-- 4. Create Policies for 'enrollments'
-- Policy: Allow users to see their own enrollments.
CREATE POLICY "Users can see their own enrollments"
ON enrollments FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Allow students to enroll themselves in a course.
-- (This assumes a student initiates the enrollment)
CREATE POLICY "Students can create their own enrollments"
ON enrollments FOR INSERT
WITH CHECK (auth.uid() = user_id);


-- 5. Create Policies for 'submissions'
-- Policy: Allow users to see their own submissions.
CREATE POLICY "Users can see their own submissions"
ON submissions FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Allow users to create their own submissions.
CREATE POLICY "Users can create their own submissions"
ON submissions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow users to update their own submissions (e.g., before grading).
CREATE POLICY "Users can update their own submissions"
ON submissions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
