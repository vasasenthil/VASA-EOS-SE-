import type { VasaSession } from "./session"

export interface TenantContext {
  subject: string
  schoolId?: string
  blockId?: string
  districtId?: string
  stateId?: string
}

export function getTenantContext(session: VasaSession): TenantContext {
  return {
    subject: session.subject,
    schoolId: session.tenant.schoolId,
    blockId: session.tenant.blockId,
    districtId: session.tenant.districtId,
    stateId: session.tenant.stateId,
  }
}
