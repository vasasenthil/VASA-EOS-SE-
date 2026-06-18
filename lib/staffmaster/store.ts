// VASA-EOS(SE) — Staff Master persistence (server-only). Full CRUD.
// Durable in Supabase when configured; in-memory seeded fallback otherwise. Every mutation audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { StaffMember, StaffInput } from "./index"

function id(): string {
  return `STF-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  staff_id: string
  name: string
  designation: string
  cadre: string
  department: string
  gender: string
  dob: string
  doj: string
  qualification: string
  phone: string
  email: string
  employment_type: string
  status: string
  casual_leave_balance: number
  earned_leave_balance: number
  pay_scale: string
  notes: string
  tenant_id: string
  created_at: string
  updated_at: string
}

function fromRow(r: Row): StaffMember {
  return {
    id: r.id, staffId: r.staff_id, name: r.name, designation: r.designation, cadre: r.cadre, department: r.department,
    gender: r.gender, dob: r.dob, doj: r.doj, qualification: r.qualification ?? "", phone: r.phone ?? "", email: r.email ?? "",
    employmentType: r.employment_type, status: (r.status as StaffMember["status"]) ?? "Active",
    casualLeaveBalance: r.casual_leave_balance ?? 0, earnedLeaveBalance: r.earned_leave_balance ?? 0,
    payScale: r.pay_scale ?? "", notes: r.notes ?? "", createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

function toRow(s: StaffMember, tenantId: string): Record<string, unknown> {
  return {
    id: s.id, staff_id: s.staffId, name: s.name, designation: s.designation, cadre: s.cadre, department: s.department,
    gender: s.gender, dob: s.dob, doj: s.doj, qualification: s.qualification, phone: s.phone, email: s.email,
    employment_type: s.employmentType, status: s.status, casual_leave_balance: s.casualLeaveBalance,
    earned_leave_balance: s.earnedLeaveBalance, pay_scale: s.payScale, notes: s.notes, tenant_id: tenantId,
    created_at: s.createdAt, updated_at: s.updatedAt,
  }
}

function seed(): StaffMember[] {
  const now = "2026-04-01T00:00:00.000Z"
  const mk = (
    i: number, staffId: string, name: string, designation: string, cadre: string, dept: string, gender: string,
    dob: string, doj: string, qual: string, phone: string, email: string, etype: string, status: StaffMember["status"],
    cl: number, el: number, scale: string,
  ): StaffMember => ({
    id: `demo-staff-${i}`, staffId, name, designation, cadre, department: dept, gender, dob, doj, qualification: qual,
    phone, email, employmentType: etype, status, casualLeaveBalance: cl, earnedLeaveBalance: el, payScale: scale, notes: "", createdAt: now, updatedAt: now,
  })
  return [
    mk(1, "EMP-001", "Mr. Rajendran", "Headmaster / Principal", "Teaching", "Administration", "Male", "1967-03-12", "1992-06-01", "M.A., M.Ed.", "9840020001", "principal-egmore@vasa-eos.tn.gov.in", "Permanent", "Active", 10, 240, "Level 20"), // retiring soon
    mk(2, "EMP-002", "Mr. Sharma", "Post Graduate Teacher (PGT)", "Teaching", "Mathematics", "Male", "1982-09-05", "2008-07-15", "M.Sc., B.Ed.", "9840020002", "sharma@vasa-eos.tn.gov.in", "Permanent", "Active", 8, 120, "Level 17"),
    mk(3, "EMP-003", "Ms. Rao", "Graduate Teacher (BT)", "Teaching", "Science", "Female", "1988-01-22", "2013-06-10", "B.Sc., B.Ed.", "9840020003", "rao@vasa-eos.tn.gov.in", "Permanent", "Active", 12, 60, "Level 15"),
    mk(4, "EMP-004", "Mrs. Selvi", "Secondary Grade Teacher (SGT)", "Teaching", "Tamil", "Female", "1990-11-30", "2016-06-01", "B.Litt., D.T.Ed.", "9840020004", "selvi@vasa-eos.tn.gov.in", "Permanent", "On Leave", 6, 30, "Level 13"),
    mk(5, "EMP-005", "Mr. Anand", "Office Assistant / Clerk", "Non-teaching", "Administration", "Male", "1995-04-18", "2019-08-01", "B.Com.", "9840020005", "anand@vasa-eos.tn.gov.in", "Permanent", "Active", 12, 24, "Level 8"),
    mk(6, "EMP-006", "Ms. Fathima", "Special Teacher", "Teaching", "Computer Science", "Female", "1992-07-09", "2021-06-15", "M.C.A.", "9840020006", "fathima@vasa-eos.tn.gov.in", "Contract", "Active", 12, 0, "Consolidated"),
  ]
}

const store: StaffMember[] = seed()

export async function listStaff(): Promise<StaffMember[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("staff_master").select("*").order("staff_id", { ascending: true })
      const rows = ((data as Row[] | null) ?? []).map(fromRow)
      return rows.length > 0 ? rows : seed()
    } catch {
      return seed()
    }
  }
  return [...store]
}

export async function getStaff(sid: string): Promise<StaffMember | undefined> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("staff_master").select("*").eq("id", sid).maybeSingle()
      if (data) return fromRow(data as Row)
    } catch {
      /* fall through */
    }
    return seed().find((s) => s.id === sid)
  }
  return store.find((s) => s.id === sid)
}

export async function createStaff(input: StaffInput, tenantId = DEFAULT_SCHOOL_NODE): Promise<StaffMember> {
  const now = new Date().toISOString()
  const s: StaffMember = { id: id(), ...input, createdAt: now, updatedAt: now }
  const db = getDb()
  if (db) await db.from("staff_master").insert(toRow(s, tenantId))
  else store.unshift(s)
  await appendAudit({ actor: "hr", action: "staff.create", resource: s.id, details: { staffId: s.staffId, designation: s.designation } })
  return s
}

export async function updateStaff(sid: string, input: StaffInput): Promise<StaffMember | undefined> {
  const existing = await getStaff(sid)
  if (!existing) return undefined
  const updated: StaffMember = { ...existing, ...input, updatedAt: new Date().toISOString() }
  const db = getDb()
  if (db) {
    await db.from("staff_master").update({
      staff_id: updated.staffId, name: updated.name, designation: updated.designation, cadre: updated.cadre, department: updated.department,
      gender: updated.gender, dob: updated.dob, doj: updated.doj, qualification: updated.qualification, phone: updated.phone, email: updated.email,
      employment_type: updated.employmentType, status: updated.status, casual_leave_balance: updated.casualLeaveBalance,
      earned_leave_balance: updated.earnedLeaveBalance, pay_scale: updated.payScale, notes: updated.notes, updated_at: updated.updatedAt,
    }).eq("id", sid)
  } else {
    const i = store.findIndex((s) => s.id === sid)
    if (i >= 0) store[i] = updated
  }
  await appendAudit({ actor: "hr", action: "staff.update", resource: sid, details: { status: updated.status } })
  return updated
}

export async function deleteStaff(sid: string): Promise<boolean> {
  const db = getDb()
  if (db) {
    await db.from("staff_master").delete().eq("id", sid)
  } else {
    const i = store.findIndex((s) => s.id === sid)
    if (i < 0) return false
    store.splice(i, 1)
  }
  await appendAudit({ actor: "hr", action: "staff.delete", resource: sid })
  return true
}

export async function seedStaff(tenantId = DEFAULT_SCHOOL_NODE): Promise<number> {
  const rows = seed()
  const db = getDb()
  if (db) {
    for (const s of rows) await db.from("staff_master").upsert(toRow(s, tenantId))
  } else {
    for (const s of rows) if (!store.some((x) => x.id === s.id)) store.push(s)
  }
  await appendAudit({ actor: "hr", action: "staff.seed", resource: "staff_master", details: { count: rows.length } })
  return rows.length
}
