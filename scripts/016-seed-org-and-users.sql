-- VASA-EOS(SE) — demo users seed (generated from lib/org + lib/directory).
-- DEMO credentials only; adapt column names to your users table. Passwords are set
-- via your auth provider (Supabase Auth / SSO), never stored here. The role +
-- school_id columns are what resolveSubject()/getUserRoleAndSchool() read to bind a
-- signed-in user to the access policy. See docs/CREDENTIALS.md.

insert into public.users (id, email, full_name, role, school_id, status) values
  ('minister', 'minister@vasa-eos.tn.gov.in', 'Hon''ble Minister (School Education)', 'MINISTER', null, 'active'),
  ('secretary', 'secretary@vasa-eos.tn.gov.in', 'Secretary, School Education', 'SECRETARY', null, 'active'),
  ('admin', 'admin@vasa-eos.tn.gov.in', 'Platform Administrator', 'ADMIN', null, 'active'),
  ('dir-dse', 'dir-dse@vasa-eos.tn.gov.in', 'Director of School Education', 'DIRECTOR', null, 'active'),
  ('dir-dee', 'dir-dee@vasa-eos.tn.gov.in', 'Director of Elementary Education', 'DIRECTOR', null, 'active'),
  ('dir-dge', 'dir-dge@vasa-eos.tn.gov.in', 'Director of Government Examinations', 'DIRECTOR', null, 'active'),
  ('dir-dms', 'dir-dms@vasa-eos.tn.gov.in', 'Director of Matriculation Schools', 'DIRECTOR', null, 'active'),
  ('dir-dtert', 'dir-dtert@vasa-eos.tn.gov.in', 'Director of Teacher Education (SCERT)', 'DIRECTOR', null, 'active'),
  ('dir-dnfe', 'dir-dnfe@vasa-eos.tn.gov.in', 'Director of Non-Formal Education', 'DIRECTOR', null, 'active'),
  ('dir-dpse', 'dir-dpse@vasa-eos.tn.gov.in', 'Director of Private Schools', 'DIRECTOR', null, 'active'),
  ('deo-chennai', 'deo-chennai@vasa-eos.tn.gov.in', 'District Education Officer — Chennai', 'DEO', null, 'active'),
  ('beo-egmore', 'beo-egmore@vasa-eos.tn.gov.in', 'Block Education Officer — Egmore', 'BEO', null, 'active'),
  ('crcc-egmore', 'crcc-egmore@vasa-eos.tn.gov.in', 'CRC Coordinator — Egmore', 'CRCC', null, 'active'),
  ('principal-egmore', 'principal-egmore@vasa-eos.tn.gov.in', 'Principal — GHSS Egmore', 'PRINCIPAL', '33010100101', 'active'),
  ('acadhead-egmore', 'acadhead-egmore@vasa-eos.tn.gov.in', 'Academic Head — GHSS Egmore', 'ACADEMIC_HEAD', '33010100101', 'active'),
  ('subinch-maths', 'subinch-maths@vasa-eos.tn.gov.in', 'Subject In-charge (Maths)', 'SUBJECT_INCHARGE', '33010100101', 'active'),
  ('insthead-egmore', 'insthead-egmore@vasa-eos.tn.gov.in', 'Institution Head — GHSS Egmore', 'INSTITUTION_HEAD', '33010100101', 'active'),
  ('teacher-egmore', 'teacher-egmore@vasa-eos.tn.gov.in', 'Teacher — Class 9-A', 'TEACHER', '33010100101', 'active'),
  ('student-aarthi', 'student-aarthi@vasa-eos.tn.gov.in', 'Aarthi M (Class 9-A)', 'STUDENT', '33010100101', 'active'),
  ('parent-aarthi', 'parent-aarthi@vasa-eos.tn.gov.in', 'Guardian of Aarthi M', 'PARENT', '33010100101', 'active'),
  ('vendor-neat', 'vendor-neat@vasa-eos.tn.gov.in', 'EdTech Vendor (NEAT)', 'VENDOR', null, 'active'),
  ('researcher', 'researcher@vasa-eos.tn.gov.in', 'Education Researcher', 'RESEARCHER', null, 'active'),
  ('public', 'public@vasa-eos.tn.gov.in', 'Citizen / Public', 'PUBLIC', null, 'active')
on conflict (id) do nothing;
