export interface GovernanceTier {
  id: number
  name: string
  level_order: number
  description?: string | null
  created_at: string
  updated_at: string
}

export interface OrganizationalUnit {
  id: string // UUID
  name: string
  tier_id: number
  parent_ou_id?: string | null // UUID
  region_code?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  address?: string | null
  metadata?: Record<string, any> | null // JSONB
  created_at: string
  updated_at: string

  // Optional hydrated fields
  tier?: GovernanceTier
  parent_ou?: OrganizationalUnit
  child_ous?: OrganizationalUnit[]
  user_count?: number
}

export interface Role {
  id: string // UUID
  name: string // e.g., "UNION_MINISTER_EDUCATION", "PRINCIPAL"
  description?: string | null
  is_system_role: boolean // Indicates if it's a core system role vs. a custom one
  created_at: string
  updated_at: string

  // Optional hydrated fields
  permissions?: Permission[]
  permissions_count?: number
  assigned_user_count?: number
}

export interface Permission {
  id: string // UUID
  action: string // e.g., 'view', 'manage', 'approve', 'create'
  resource: string // e.g., 'dashboard_national_nep', 'policy_workflow', 'student_assessment_school'
  description?: string | null
  created_at: string
  updated_at: string
  assigned_roles_count?: number
}

export interface RolePermission {
  role_id: string // UUID
  permission_id: string // UUID
  created_at: string

  // Optional hydrated fields
  role?: Role
  permission?: Permission
}

export interface AuthUser {
  id: string // UUID
  email?: string | null
  raw_user_meta_data?: {
    name?: string
    avatar_url?: string
  } | null
}

export interface UserOUAssignment {
  id: string // UUID
  user_id: string // UUID
  ou_id: string // UUID
  role_id: string // UUID
  is_primary_assignment: boolean
  assigned_at: string

  // Optional hydrated fields
  user?: AuthUser
  organizational_unit?: OrganizationalUnit
  role?: Role
}

export interface OrganizationalUnitInput
  extends Omit<
    OrganizationalUnit,
    "id" | "created_at" | "updated_at" | "tier" | "parent_ou" | "child_ous" | "user_count"
  > {}

export interface RoleInput
  extends Omit<
    Role,
    "id" | "created_at" | "updated_at" | "permissions" | "permissions_count" | "assigned_user_count"
  > {}

export interface PermissionInput
  extends Omit<Permission, "id" | "created_at" | "updated_at" | "assigned_roles_count"> {}

export interface UserOUAssignmentInput
  extends Omit<UserOUAssignment, "id" | "assigned_at" | "user" | "organizational_unit" | "role"> {}

/**
 * Illustrative System Roles based on VASA-EOS (SE) RBAC Document.
 * The actual string values should be unique identifiers for these roles.
 * This list is not exhaustive and represents key roles from different hierarchical levels.
 */
export const SYSTEM_ROLES = {
  // System-Wide
  SUPER_ADMIN: "SYSTEM_SUPER_ADMIN", // For overall system administration

  // National Level
  UNION_MINISTER_EDUCATION: "ROLE_UNION_MINISTER_EDUCATION",
  SECRETARY_EDUCATION: "ROLE_SECRETARY_EDUCATION",
  NCERT_DIRECTOR: "ROLE_NCERT_DIRECTOR",
  CBSE_CHAIRPERSON: "ROLE_CBSE_CHAIRPERSON",
  NATIONAL_POLICY_ANALYST: "ROLE_NATIONAL_POLICY_ANALYST",
  SAMAGRA_SHIKSHA_NODAL_OFFICER: "ROLE_SAMAGRA_SHIKSHA_NODAL_OFFICER",
  KVS_COMMISSIONER: "ROLE_KVS_COMMISSIONER",

  // State/UT Level
  STATE_MINISTER_EDUCATION: "ROLE_STATE_MINISTER_EDUCATION",
  PRINCIPAL_SECRETARY_STATE_EDUCATION: "ROLE_PRINCIPAL_SECRETARY_STATE_EDUCATION",
  STATE_SCERT_DIRECTOR: "ROLE_STATE_SCERT_DIRECTOR",
  STATE_BOARD_CHAIRPERSON: "ROLE_STATE_BOARD_CHAIRPERSON",

  // District Level
  DISTRICT_EDUCATION_OFFICER: "ROLE_DISTRICT_EDUCATION_OFFICER",

  // Block Level
  BLOCK_RESOURCE_COORDINATOR: "ROLE_BLOCK_RESOURCE_COORDINATOR",

  // Cluster Level
  CLUSTER_RESOURCE_COORDINATOR: "ROLE_CLUSTER_RESOURCE_COORDINATOR",

  // Institutional (School) Level
  PRINCIPAL: "ROLE_PRINCIPAL",
  VICE_PRINCIPAL: "ROLE_VICE_PRINCIPAL",
  SUBJECT_TEACHER: "ROLE_SUBJECT_TEACHER",
  CLASS_TEACHER: "ROLE_CLASS_TEACHER",
  SPECIAL_EDUCATOR: "ROLE_SPECIAL_EDUCATOR",
  SCHOOL_ACCOUNTANT: "ROLE_SCHOOL_ACCOUNTANT",
  IT_COORDINATOR_SCHOOL: "ROLE_IT_COORDINATOR_SCHOOL",
  LIBRARIAN: "ROLE_LIBRARIAN",

  // Individual User Level
  STUDENT: "ROLE_STUDENT",
  PARENT_GUARDIAN: "ROLE_PARENT_GUARDIAN",

  // Existing roles (can be reviewed/merged if overlapping)
  // NATIONAL_POLICY_ADMIN: "NATIONAL_POLICY_ADMIN", // Example: Could be covered by more specific national roles
  // STATE_POLICY_ADMIN: "STATE_POLICY_ADMIN",
  // DISTRICT_DATA_VIEWER: "DISTRICT_DATA_VIEWER", // Example: Could be a permission set for DEO or other district roles
} as const

/**
 * Illustrative Permissions based on VASA-EOS (SE) RBAC Document.
 * Format: "action:resource_or_feature" or "action:module_feature"
 * This list is not exhaustive.
 */
export const PERMISSIONS = {
  // Policy Management (example refinement)
  POLICY_CREATE_NATIONAL: "create:policy_national",
  POLICY_READ_NATIONAL: "read:policy_national",
  POLICY_UPDATE_NATIONAL: "update:policy_national",
  POLICY_DELETE_NATIONAL: "delete:policy_national",
  POLICY_APPROVE_NATIONAL: "approve:policy_national",
  POLICY_CREATE_STATE: "create:policy_state", // Example for state-level policies

  // User & Access Management
  USERS_MANAGE_SYSTEM: "manage:users_system", // Manage any user
  USERS_MANAGE_SCHOOL: "manage:users_school", // Manage users within a school (e.g., by Principal)
  ROLES_MANAGE_SYSTEM: "manage:roles_system",
  OUS_MANAGE_SYSTEM: "manage:ous_system",

  // Dashboard & Reporting (examples based on RBAC doc)
  VIEW_DASHBOARD_NATIONAL_OVERVIEW: "view:dashboard_national_overview", // For Union Minister
  VIEW_DASHBOARD_NATIONAL_NEP_IMPLEMENTATION: "view:dashboard_national_nep_implementation",
  VIEW_DASHBOARD_NATIONAL_SDG4: "view:dashboard_national_sdg4",
  VIEW_DASHBOARD_STATE_OVERVIEW: "view:dashboard_state_overview", // For State Minister
  VIEW_DASHBOARD_DISTRICT_PERFORMANCE: "view:dashboard_district_performance", // For DEO
  VIEW_DASHBOARD_SCHOOL_ANALYTICS: "view:dashboard_school_analytics", // For Principal

  // Curriculum & Assessment
  MANAGE_CURRICULUM_NATIONAL: "manage:curriculum_national", // For NCERT Director
  MANAGE_EXAMS_NATIONAL: "manage:exams_national", // For CBSE Chairperson
  MANAGE_ASSESSMENT_FRAMEWORK_NATIONAL: "manage:assessment_framework_national", // For PARAKH
  MANAGE_CURRICULUM_STATE: "manage:curriculum_state", // For State SCERT Director
  MANAGE_STUDENT_ASSESSMENT_SCHOOL: "manage:student_assessment_school", // For Teachers/Principal

  // LMS & Student Specific
  ACCESS_LMS_COURSE_CONTENT_STUDENT: "access:lms_course_content_student",
  SUBMIT_ASSIGNMENT_STUDENT: "submit:lms_assignment_student",
  GRADE_ASSIGNMENT_TEACHER: "grade:lms_assignment_teacher",
  VIEW_CHILD_PROGRESS_PARENT: "view:child_progress_parent",
  COMMUNICATE_WITH_TEACHER_PARENT: "communicate:teacher_parent",

  // Scheme Management
  MANAGE_SCHEME_SAMAGRA_SHIKSHA_NATIONAL: "manage:scheme_samagra_shiksha_national",
  MONITOR_SCHEME_PM_POSHAN_NATIONAL: "monitor:scheme_pm_poshan_national",

  // General Admin
  MANAGE_SCHOOL_FINANCES: "manage:school_finances", // For School Accountant/Principal
  MANAGE_SCHOOL_HR: "manage:school_hr", // For Principal

  // Keep existing general permissions if still broadly applicable, or refine them
  // POLICY_CREATE: "create:policy", // Too generic now, replaced by _NATIONAL, _STATE etc.
  // POLICY_READ: "read:policy",
  // POLICY_UPDATE: "update:policy",
  // POLICY_DELETE: "delete:policy",
  // POLICY_APPROVE: "approve:policy",
  // USERS_MANAGE: "manage:users", // Replaced by more specific user management
  // ROLES_MANAGE: "manage:roles", // Replaced
  // OUS_MANAGE: "manage:ous", // Replaced
  // DASHBOARD_NATIONAL_VIEW: "view:dashboard_national", // Replaced by more specific dashboards
  // DASHBOARD_STATE_VIEW: "view:dashboard_state",
  // DASHBOARD_DISTRICT_VIEW: "view:dashboard_district",
} as const

// Utility type to get all role values
export type SystemRoleValue = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES]

// Utility type to get all permission values
export type PermissionValue = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
