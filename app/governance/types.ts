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
  name: string // e.g., NATIONAL_ADMIN
  description?: string | null
  is_system_role: boolean
  created_at: string
  updated_at: string

  // Optional hydrated fields
  permissions?: Permission[]
  permissions_count?: number
  assigned_user_count?: number
}

export interface Permission {
  id: string // UUID
  action: string // e.g., 'create', 'read'
  resource: string // e.g., 'policy', 'report'
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

// Constants for known role names (useful in code)
export const SYSTEM_ROLES = {
  SUPER_ADMIN: "SYSTEM_SUPER_ADMIN",
  NATIONAL_POLICY_ADMIN: "NATIONAL_POLICY_ADMIN",
  STATE_POLICY_ADMIN: "STATE_POLICY_ADMIN",
  DISTRICT_DATA_VIEWER: "DISTRICT_DATA_VIEWER",
  SCHOOL_PRINCIPAL: "SCHOOL_PRINCIPAL",
} as const

// Constants for known permission structures (action:resource)
export const PERMISSIONS = {
  POLICY_CREATE: "create:policy",
  POLICY_READ: "read:policy",
  POLICY_UPDATE: "update:policy",
  POLICY_DELETE: "delete:policy",
  POLICY_APPROVE: "approve:policy",
  USERS_MANAGE: "manage:users",
  ROLES_MANAGE: "manage:roles",
  OUS_MANAGE: "manage:ous",
  DASHBOARD_NATIONAL_VIEW: "view:dashboard_national",
  DASHBOARD_STATE_VIEW: "view:dashboard_state",
  DASHBOARD_DISTRICT_VIEW: "view:dashboard_district",
} as const
