import { getSession, type VasaSession } from "./session"

export interface TenantContext {
  subject: string
  schoolId?: string
  blockId?: string
  districtId?: string
  stateId?: string
}

export async function getTenantContext(session?: VasaSession): Promise<TenantContext> {
  const current = session ?? await getSession()
  if (!current) return { subject: "anonymous" }
  return {
    subject: current.subject,
    schoolId: current.tenant.schoolId,
    blockId: current.tenant.blockId,
    districtId: current.tenant.districtId,
    stateId: current.tenant.stateId,
  }
}
