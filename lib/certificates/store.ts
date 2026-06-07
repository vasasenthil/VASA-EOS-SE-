// VASA-EOS(SE) — Certificate issuance persistence (server-only).
// Issues TC / Bonafide / Conduct certificates with a sequential reference number.
// Durable in Supabase when configured; in-memory otherwise. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
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
  }
}

const store: Certificate[] = []

export interface NewCertificate {
  type: CertType
  studentApaar: string
  studentName: string
  remarks?: string
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
