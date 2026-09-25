import { getSession, type VasaSession } from "./session"
import { requireDb } from "@/lib/db/require-db"

export interface SchoolScope { udiseCode: string; tenantId: string; subject: string }
export class SchoolScopeError extends Error {}

/** session, when supplied by an internal caller, must come from verified Auth. */
export async function resolveSchoolScope(udiseCode?: string, write = false, verifiedSession?: VasaSession): Promise<SchoolScope> {
  const db = requireDb()
  const session = verifiedSession ?? await getSession()
  if (!session) throw new SchoolScopeError("Authentication required")
  const allowed = write
    ? ["ADMIN", "PRINCIPAL", "ACADEMIC_HEAD", "TEACHER", "BEO", "DEO", "DIRECTOR", "SECRETARY"]
    : ["ADMIN", "PRINCIPAL", "ACADEMIC_HEAD", "TEACHER", "BEO", "DEO", "DIRECTOR", "SECRETARY", "MINISTER"]
  if (!session.roles.some(role => allowed.includes(role))) throw new SchoolScopeError("School access denied")
  let query = db.from("school_tenant_bindings").select("*")
  if (udiseCode) query = query.eq("udise_code", udiseCode)
  else if (session.tenant.schoolId) query = query.eq("school_id", session.tenant.schoolId)
  else throw new SchoolScopeError("Select a school within your jurisdiction")
  const { data: school, error } = await query.maybeSingle()
  if (error) throw error
  if (!school || !school.tenant_id) throw new SchoolScopeError("Verified school ownership unavailable")
  const claims = session.tenant
  // Bind to the most specific posting. A school-bound account cannot use a wider
  // state claim to read a neighbouring school. ADMIN also requires jurisdiction.
  const permitted = claims.schoolId ? claims.schoolId === school.school_id
    : claims.blockId ? claims.blockId === school.block_id
    : claims.districtId ? claims.districtId === school.district_id
    : claims.stateId ? claims.stateId === school.state_id : false
  if (!permitted) throw new SchoolScopeError("School is outside your jurisdiction")
  return { udiseCode: school.udise_code, tenantId: school.tenant_id, subject: session.subject }
}
