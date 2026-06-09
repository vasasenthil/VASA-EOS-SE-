// VASA-EOS(SE) — Certificate issuance persistence (server-only).
// Issues TC / Bonafide / Conduct certificates with a sequential reference number.
// Durable in Supabase when configured; in-memory otherwise. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import { certRef, type CertType, type Certificate } from "./index"

function id(): string {
  return `CRT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  ref: string
  type: CertType
  student_apaar: string
  student_name: string
  issued_on: string
  remarks: string | null
  tenant_id: string
  created_at: string
}

function fromRow(r: Row): Certificate {
  return {
    id: r.id,
    ref: r.ref,
    type: r.type,
    studentApaar: r.student_apaar,
    studentName: r.student_name,
    issuedOn: r.issued_on,
    remarks: r.remarks ?? undefined,
    tenantId: r.tenant_id ?? DEFAULT_SCHOOL_NODE,
  }
}

// Seeded across tenant nodes so certificate issuance rolls up by jurisdiction.
const store: Certificate[] = [
  { id: "CRT-SEED1", ref: certRef("bonafide", 1), type: "bonafide", studentApaar: "APAAR-0001", studentName: "Asha R", issuedOn: "2026-05-26", tenantId: "TN-CHN-B1-S1" },
  { id: "CRT-SEED2", ref: certRef("conduct", 1), type: "conduct", studentApaar: "APAAR-0002", studentName: "Bala K", issuedOn: "2026-05-24", tenantId: "TN-CHN-B2-S1" },
  { id: "CRT-SEED3", ref: certRef("transfer", 1), type: "transfer", studentApaar: "APAAR-0003", studentName: "Chitra M", issuedOn: "2026-06-01", tenantId: "TN-CBE-B1-S1" },
]

export interface NewCertificate {
  type: CertType
  studentApaar: string
  studentName: string
  remarks?: string
  /** Tenant node the certificate is issued at; defaults to the demo school. */
  tenantId?: string
}

export async function issueCertificate(input: NewCertificate): Promise<Certificate> {
  // Sequential ref per type, derived from existing certificates of that type.
  const existing = (await listCertificates()).filter((c) => c.type === input.type).length
  const cert: Certificate = {
    id: id(),
    ref: certRef(input.type, existing + 1),
    type: input.type,
    studentApaar: input.studentApaar,
    studentName: input.studentName,
    issuedOn: new Date().toISOString().slice(0, 10),
    remarks: input.remarks?.trim() || undefined,
    tenantId: input.tenantId ?? DEFAULT_SCHOOL_NODE,
  }
  const db = getDb()
  if (db) {
    await db.from("certificates").insert({
      id: cert.id,
      ref: cert.ref,
      type: cert.type,
      student_apaar: cert.studentApaar,
      student_name: cert.studentName,
      issued_on: cert.issuedOn,
      remarks: cert.remarks ?? null,
      tenant_id: cert.tenantId,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(cert)
  }
  await appendAudit({ actor: "office", action: "certificate.issue", resource: cert.id, details: { ref: cert.ref } })
  return cert
}

export async function deleteCertificate(cid: string): Promise<boolean> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("certificates").select("*").eq("id", cid).maybeSingle()
    if (!data) return false
    await db.from("certificates").delete().eq("id", cid)
  } else {
    const i = store.findIndex((x) => x.id === cid)
    if (i < 0) return false
    store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "certificate.delete", resource: cid })
  return true
}

export async function listCertificates(): Promise<Certificate[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("certificates").select("*").order("created_at", { ascending: false })
      return ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return [...store]
}
