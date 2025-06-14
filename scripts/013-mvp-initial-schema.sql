-- Enable pgcrypto extension if not already enabled, for gen_random_uuid()
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Schools Table
CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE schools IS 'Stores basic information about educational institutions.';
COMMENT ON COLUMN schools.name IS 'Official name of the school.';

-- 2. Users Table
CREATE TYPE user_role AS ENUM ('STUDENT', 'TEACHER', 'SCHOOL_ADMIN', 'STATE_ADMIN');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL,
    school_id UUID REFERENCES schools(id) ON DELETE SET NULL, -- School admin, teacher, student belong to a school. State admin might not.
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_school_id ON users(school_id);

COMMENT ON TABLE users IS 'Stores information for all individuals interacting with the system.';
COMMENT ON COLUMN users.school_id IS 'Identifier linking to the school the user belongs to. Nullable for state-level admins.';

-- 3. Courses Table
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Course must have a teacher
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_courses_teacher_id ON courses(teacher_id);

COMMENT ON TABLE courses IS 'Represents a course of study created by a Teacher.';
COMMENT ON COLUMN courses.teacher_id IS 'The user ID of the teacher who created/owns the course.';

-- 4. Course Enrollments Table (Junction Table)
CREATE TABLE course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (student_id, course_id) -- Ensures a student can only be enrolled once in the same course
);

CREATE INDEX idx_course_enrollments_student_id ON course_enrollments(student_id);
CREATE INDEX idx_course_enrollments_course_id ON course_enrollments(course_id);

COMMENT ON TABLE course_enrollments IS 'Manages the many-to-many relationship between Students and Courses.';

-- 5. Course Materials Table
CREATE TYPE material_type AS ENUM ('FILE', 'LINK');

CREATE TABLE course_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    material_type material_type NOT NULL,
    file_path TEXT, -- URL/path for Vercel Blob storage if type is FILE
    url TEXT,       -- External URL if type is LINK
    uploaded_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT, -- User who uploaded (typically the teacher)
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT chk_material_path_or_url CHECK (
        (material_type = 'FILE' AND file_path IS NOT NULL AND url IS NULL) OR
        (material_type = 'LINK' AND url IS NOT NULL AND file_path IS NULL)
    )
);

CREATE INDEX idx_course_materials_course_id ON course_materials(course_id);

COMMENT ON TABLE course_materials IS 'Stores learning materials (files or links) associated with a Course.';
COMMENT ON COLUMN course_materials.file_path IS 'If material_type is FILE, this stores the path/URL to the file in Vercel Blob storage.';
COMMENT ON COLUMN course_materials.url IS 'If material_type is LINK, this stores the external URL.';

-- 6. Policies Table
CREATE TABLE policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    publication_date DATE NOT NULL,
    file_path TEXT NOT NULL, -- Path/URL to the policy document in Vercel Blob storage
    uploaded_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT, -- State Admin who uploaded
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_policies_publication_date ON policies(publication_date);

COMMENT ON TABLE policies IS 'Stores policy documents uploaded by State Administrators.';
COMMENT ON COLUMN policies.file_path IS 'Path/URL to the policy document (e.g., PDF) in Vercel Blob storage.';

-- Function to update updated_at timestamp (can be reused from your existing scripts if it's identical)
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_schools_modtime
BEFORE UPDATE ON schools
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_users_modtime
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_courses_modtime
BEFORE UPDATE ON courses
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- No updated_at for course_enrollments as it's typically just an event table

CREATE TRIGGER update_course_materials_modtime
BEFORE UPDATE ON course_materials
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_policies_modtime
BEFORE UPDATE ON policies
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
