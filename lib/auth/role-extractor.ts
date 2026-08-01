import type { VasaSession } from "./session"

export type VasaRole =
  | "ADMIN"
  | "SECRETARY"
  | "MINISTER"
  | "CABINET"
  | "DIRECTOR"
  | "DEO"
  | "BEO"
  | "PRINCIPAL"
  | "TEACHER"
  | "ML_ADMIN"

const roleAliases: Record<string, VasaRole> = {
  SUPER_ADMIN: "ADMIN",
  STATE_SECRETARY: "SECRETARY",
  EDUCATION_SECRETARY: "SECRETARY",
  EDUCATION_MINISTER: "MINISTER",
  CABINET_MEMBER: "CABINET",
  DISTRICT_EDUCATION_OFFICER: "DEO",
  CHIEF_EDUCATIONAL_OFFICER: "DEO",
  CEO_DISTRICT: "DEO",
  BLOCK_EDUCATION_OFFICER: "BEO",
  SCHOOL_PRINCIPAL: "PRINCIPAL",
  HEADMASTER: "PRINCIPAL",
  SCHOOL_HEADMASTER: "PRINCIPAL",
}

export function extractRoles(session: VasaSession): VasaRole[] {
  return [...new Set(session.roles.map((role) => roleAliases[role] ?? role).filter((role): role is VasaRole => role in allowedRoleSet))]
}

const allowedRoleSet: Record<VasaRole, true> = {
  ADMIN: true,
  SECRETARY: true,
  MINISTER: true,
  CABINET: true,
  DIRECTOR: true,
  DEO: true,
  BEO: true,
  PRINCIPAL: true,
  TEACHER: true,
  ML_ADMIN: true,
}
