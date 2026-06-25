// VASA-EOS(SE) — cabinet-note / policy-note drafting tool (the Secretary's submission to Cabinet).
//
// Major school-education decisions reach the Council of Ministers as a Cabinet note. The TN Secretariat
// Business Rules fix the anatomy of that note — Subject, Background, Proposal, Financial Implications,
// Legal & Statutory position, Inter-departmental Consultation, and Recommendation. This models that
// structure as a drafting tool: each mandatory section cites the in-repo module that informs it (Financial
// Implications draws on the budget-sanction engine, Consultation on the coordination desk, Legal on the
// regulatory register…), and validateNote() refuses to call a note complete until every mandatory section
// is filled — so an incompletely-drafted note is caught, not waved through. Pure + client-safe.

import { csvField } from "@/lib/csv"

export type NoteStatus = "draft" | "vetted" | "approved"

export interface NoteSection {
  key: string
  heading: string
  mandatory: boolean
  /** Module that informs this section (asserted to exist on disk). */
  sourceRef: string
}

export const CABINET_NOTE_SECTIONS: NoteSection[] = [
  { key: "subject", heading: "Subject", mandatory: true, sourceRef: "lib/governance/secretary-capabilities.ts" },
  { key: "background", heading: "Background & Context", mandatory: true, sourceRef: "lib/tracking/analytics.ts" },
  { key: "proposal", heading: "Proposal", mandatory: true, sourceRef: "lib/governance-framework/index.ts" },
  { key: "financial", heading: "Financial Implications", mandatory: true, sourceRef: "lib/finance/sanction.ts" },
  { key: "legal", heading: "Legal & Statutory Position", mandatory: true, sourceRef: "lib/compliance/regulatory.ts" },
  { key: "consultation", heading: "Inter-departmental Consultation", mandatory: true, sourceRef: "lib/governance/coordination.ts" },
  { key: "recommendation", heading: "Recommendation", mandatory: true, sourceRef: "lib/governance/oversight.ts" },
]

export interface CabinetNote {
  id: string
  subject: string
  /** Filled content keyed by section key. */
  content: Record<string, string>
  status: NoteStatus
}

export const CABINET_NOTES: CabinetNote[] = [
  {
    id: "CN-FLN-01",
    subject: "Tamil Nadu Foundational Literacy & Numeracy Mission (Ennum Ezhuthum / NIPUN)",
    status: "approved",
    content: {
      subject: "Sanction of a state-wide foundational literacy & numeracy mission to meet NIPUN Bharat goals by 2026-27.",
      background: "Diagnostic analytics show a share of learners below grade-level FLN; NEP 2020 mandates universal foundational learning.",
      proposal: "Establish a mission with district FLN cells, teacher capacity-building and a termly assessment cadence.",
      financial: "₹ outlay met from the Samagra Shiksha composite grant, with re-appropriation of savings where heads under-utilise.",
      legal: "Consistent with RTE 2009 §29 (curriculum) and NEP 2020; no fresh legislation required.",
      consultation: "Concurrence of Finance for outlay; convergence with Social Welfare (anganwadi continuity) and the multilateral FLN partner.",
      recommendation: "Approve the mission and authorise the Secretary to issue implementation orders.",
    },
  },
  {
    id: "CN-SHRI-02",
    subject: "Upgrade of schools under PM SHRI to exemplar standards",
    status: "vetted",
    content: {
      subject: "Selection and upgrade of schools under the PM SHRI scheme to model-school standards.",
      background: "Infrastructure readiness data identifies schools with RTE §19 gaps suitable for exemplar upgrade.",
      proposal: "Upgrade a phased cohort with green-building norms, labs and inclusive facilities.",
      financial: "Centre-state shared funding; state share routed through the infrastructure head with sanction controls.",
      legal: "Within RTE §19 Schedule norms and PM SHRI guidelines; environmental clearances per civil-works norms.",
      consultation: "Convergence with Rural Development (civil works) and the IT Department (connectivity).",
      recommendation: "Approve the first-phase cohort and delegate execution oversight to the Directorate.",
    },
  },
  {
    id: "CN-CADRE-03",
    subject: "Rationalisation of the teacher cadre against pupil-teacher ratios",
    status: "draft",
    content: {
      subject: "Rationalisation and redeployment of teachers to meet RTE pupil-teacher ratios.",
      background: "Postings data reveals PTR imbalances between surplus and deficit schools.",
      proposal: "Counselling-based transfers to deficit schools with transparency safeguards.",
      financial: "Cost-neutral redeployment; no fresh outlay.",
      legal: "Within RTE §25 (PTR) and state service rules.",
      // consultation deliberately omitted — note is still in draft and incomplete.
      recommendation: "Place before Cabinet after Finance and consultation sign-off.",
    },
  },
]

export function mandatorySections(): NoteSection[] {
  return CABINET_NOTE_SECTIONS.filter((s) => s.mandatory)
}

export interface NoteValidation {
  ok: boolean
  missing: string[]
}

export function validateNote(note: CabinetNote): NoteValidation {
  const missing = mandatorySections()
    .filter((s) => !note.content[s.key] || note.content[s.key].trim() === "")
    .map((s) => s.key)
  return { ok: missing.length === 0, missing }
}

export function noteById(id: string): CabinetNote | undefined {
  return CABINET_NOTES.find((n) => n.id === id)
}

export function byStatus(status: NoteStatus): CabinetNote[] {
  return CABINET_NOTES.filter((n) => n.status === status)
}

export interface CabinetNoteSummary {
  notes: number
  approved: number
  vetted: number
  draft: number
  mandatorySections: number
  /** Notes passing the completeness check. */
  complete: number
}

export function cabinetNoteSummary(notes: CabinetNote[] = CABINET_NOTES): CabinetNoteSummary {
  return {
    notes: notes.length,
    approved: notes.filter((n) => n.status === "approved").length,
    vetted: notes.filter((n) => n.status === "vetted").length,
    draft: notes.filter((n) => n.status === "draft").length,
    mandatorySections: mandatorySections().length,
    complete: notes.filter((n) => validateNote(n).ok).length,
  }
}


export function toCSV(notes: CabinetNote[] = CABINET_NOTES): string {
  const header = ["ID", "Subject", "Status", "Complete", "Missing sections"]
  const rows = notes.map((n) => {
    const v = validateNote(n)
    return [n.id, n.subject, n.status, v.ok ? "yes" : "no", v.missing.join("; ") || "—"].map(csvField).join(",")
  })
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
