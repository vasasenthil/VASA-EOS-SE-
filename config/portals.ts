import type { RoleGrants } from "@/lib/access"

// The 13 stakeholder portals from the dossier (Part XVIII), plus the extra
// school/cluster sub-roles already present in this codebase. Each portal is a
// role with a home route, a governance tier, and a default action grant set.

export type PortalRole =
  | "STUDENT"
  | "PARENT"
  | "TEACHER"
  | "PRINCIPAL"
  | "CRCC"
  | "BEO"
  | "DEO" // DEO / CEO (district)
  | "DIRECTOR"
  | "SECRETARY"
  | "MINISTER" // Minister / CM (executive)
  | "VENDOR" // EdTech / NEAT vendor
  | "RESEARCHER"
  | "PUBLIC"
  // existing sub-roles retained
  | "ADMIN"
  | "SUBJECT_INCHARGE"
  | "ACADEMIC_HEAD"
  | "INSTITUTION_HEAD"

export type GovernanceTier =
  | "national"
  | "state"
  | "directorate"
  | "district"
  | "block"
  | "cluster"
  | "school"
  | "public"

export interface PortalDef {
  role: PortalRole
  label: string
  home: string
  tier: GovernanceTier
  description: string
}

export const PORTALS: Record<PortalRole, PortalDef> = {
  STUDENT: { role: "STUDENT", label: "Student", home: "/student/dashboard", tier: "school", description: "Adaptive learning, results, credentials" },
  PARENT: { role: "PARENT", label: "Parent / Guardian", home: "/parent/dashboard", tier: "school", description: "Child progress, fees, schemes, grievances" },
  TEACHER: { role: "TEACHER", label: "Teacher", home: "/teacher/dashboard", tier: "school", description: "Class management, CPD, assessment" },
  PRINCIPAL: { role: "PRINCIPAL", label: "Principal / Headmaster", home: "/principal/dashboard", tier: "school", description: "School operations & compliance" },
  CRCC: { role: "CRCC", label: "CRC Coordinator", home: "/crcc/dashboard", tier: "cluster", description: "Field visits, mentoring, NIPUN cluster tracking" },
  BEO: { role: "BEO", label: "Block Education Officer", home: "/beo/dashboard", tier: "block", description: "Block ops, inspections, schemes" },
  DEO: { role: "DEO", label: "District Education Officer / CEO", home: "/deo/dashboard", tier: "district", description: "District KPIs, heat maps, resource allocation" },
  DIRECTOR: { role: "DIRECTOR", label: "State Director (Directorate)", home: "/director/dashboard", tier: "directorate", description: "Directorate-wide operations & reporting" },
  SECRETARY: { role: "SECRETARY", label: "Secretary, School Education", home: "/secretary/dashboard", tier: "state", description: "State-wide visibility & policy decisions" },
  MINISTER: { role: "MINISTER", label: "Hon'ble Minister / CM", home: "/minister/dashboard", tier: "state", description: "Executive dashboards & scheme outcomes" },
  VENDOR: { role: "VENDOR", label: "EdTech Vendor (NEAT)", home: "/vendor/dashboard", tier: "national", description: "Marketplace, sandbox, outcome reporting" },
  RESEARCHER: { role: "RESEARCHER", label: "Researcher", home: "/researcher/dashboard", tier: "national", description: "Anonymised datasets & federated studies" },
  PUBLIC: { role: "PUBLIC", label: "Public / Citizen", home: "/public/dashboard", tier: "public", description: "Transparency dashboards, school finder, RTI" },
  ADMIN: { role: "ADMIN", label: "Administrator", home: "/admin/dashboard", tier: "state", description: "Platform governance & administration" },
  SUBJECT_INCHARGE: { role: "SUBJECT_INCHARGE", label: "Subject In-charge", home: "/subject-incharge/dashboard", tier: "school", description: "Curriculum & teacher coordination" },
  ACADEMIC_HEAD: { role: "ACADEMIC_HEAD", label: "Academic Head", home: "/academic-head/dashboard", tier: "school", description: "Curriculum development & assessment" },
  INSTITUTION_HEAD: { role: "INSTITUTION_HEAD", label: "Institution Head", home: "/institution-head/dashboard", tier: "school", description: "Strategy & stakeholder management" },
}

/** Default RBAC grants per portal role (extend as modules land). */
export const DEFAULT_GRANTS: RoleGrants = {
  STUDENT: ["read:self", "read:learning", "read:credentials", "manage:consent"],
  PARENT: ["read:child", "pay:fees", "read:scheme", "file:grievance", "create:proposal", "vote:smc", "manage:consent"],
  TEACHER: ["read:class", "write:attendance", "write:assessment", "read:cpd"],
  PRINCIPAL: ["manage:school", "read:class", "manage:staff", "read:compliance", "create:proposal", "vote:smc", "resolve:grievance", "manage:meals"],
  CRCC: ["read:cluster", "write:visit", "read:nipun"],
  BEO: ["read:block", "schedule:inspection", "read:scheme", "resolve:grievance"],
  DEO: ["read:district", "allocate:resource", "read:scheme", "approve:recognition", "resolve:grievance"],
  DIRECTOR: ["read:directorate", "read:statutory"],
  SECRETARY: ["read:state", "read:compliance", "read:scheme"],
  MINISTER: ["read:executive", "read:constituency"],
  VENDOR: ["read:sandbox", "report:outcome"],
  RESEARCHER: ["read:anonymised"],
  PUBLIC: ["read:public", "file:rti", "file:grievance"],
  ADMIN: ["*"],
  SUBJECT_INCHARGE: ["read:class", "manage:curriculum"],
  ACADEMIC_HEAD: ["manage:curriculum", "read:assessment"],
  INSTITUTION_HEAD: ["read:strategy", "manage:policy"],
}
