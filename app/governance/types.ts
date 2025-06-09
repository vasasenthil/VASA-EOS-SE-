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
}

export interface Permission {
  id: string // UUID
  action: string // e.g., 'create', 'read'
  resource: string // e.g., 'policy', 'report'
  description?: string | null
  created_at: string
  updated_at: string
}

export interface RolePermission {
  role_id: string // UUID
  permission_id: string // UUID
  created_at: string

  // Optional hydrated fields
  role?: Role
  permission?: Permission
}

export interface UserOUAssignment {
  id: string // UUID
  user_id: string // UUID from auth.users
  ou_id: string // UUID
  role_id: string // UUID
  is_primary_assignment: boolean
  assigned_at: string

  // Optional hydrated fields
  user_email?: string // If joining with auth.users
  organizational_unit?: OrganizationalUnit
  role?: Role
}

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
