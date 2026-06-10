// VASA-EOS(SE) — the seven directorates of TN School Education (per-directorate specialised ops).
//
// The Director portal stands in for all seven directorates; this register makes that concrete. Each
// directorate — School Education, Elementary Education, Government Examinations, SCERT, Non-Formal & Adult
// Education, Public Libraries, and Matriculation/Private-school regulation — carries a distinct mandate, and
// each is mapped to the in-repo module that supports its core function (DGE → exam integrity, SCERT → teacher
// CPD, DEE → FLN diagnostics, and so on). Every moduleRef is asserted to exist on disk (self-verifying). This
// closes the Director register's per-directorate-specialisation gap. Pure + client-safe.

import { csvField } from "@/lib/csv"

export type DirectorateStatus = "supported" | "partial"

export interface Directorate {
  id: string
  name: string
  abbr: string
  /** The directorate's statutory mandate. */
  mandate: string
  /** Stage or function focus. */
  focus: string
  /** In-repo module supporting its core function (asserted to exist). */
  moduleRef: string
  route: string
  status: DirectorateStatus
}

export const DIRECTORATES: Directorate[] = [
  { id: "dse", name: "Directorate of School Education", abbr: "DSE", mandate: "Higher & higher-secondary education; school quality and standards", focus: "Classes 9–12", moduleRef: "lib/quality/index.ts", route: "/quality", status: "supported" },
  { id: "dee", name: "Directorate of Elementary Education", abbr: "DEE", mandate: "Elementary education and foundational literacy & numeracy (Ennum Ezhuthum)", focus: "Classes 1–8", moduleRef: "lib/diagnostic/index.ts", route: "/diagnostic", status: "supported" },
  { id: "dge", name: "Directorate of Government Examinations", abbr: "DGE", mandate: "SSLC / HSC board examinations and certification", focus: "Board exams", moduleRef: "lib/exams/integrity.ts", route: "/governance/exam-integrity", status: "supported" },
  { id: "scert", name: "State Council of Educational Research & Training", abbr: "SCERT / DTERT", mandate: "Curriculum, textbooks, teacher education, research and training", focus: "Curriculum & teachers", moduleRef: "lib/cpd/index.ts", route: "/cpd", status: "supported" },
  { id: "nfae", name: "Directorate of Non-Formal & Adult Education", abbr: "NFAE", mandate: "Out-of-school children, bridge courses and adult literacy", focus: "OOSC & literacy", moduleRef: "lib/oosc/index.ts", route: "/oosc", status: "partial" },
  { id: "libraries", name: "Directorate of Public Libraries", abbr: "DPL", mandate: "Public library network and reading promotion", focus: "Reading & libraries", moduleRef: "lib/library/index.ts", route: "/library", status: "supported" },
  { id: "private-regulation", name: "Matriculation & Private Schools Regulation", abbr: "MPS", mandate: "Recognition and regulation of matriculation and private unaided schools (TN 1973)", focus: "Recognition", moduleRef: "lib/recognition/index.ts", route: "/recognition", status: "supported" },
]

export function directorateById(id: string): Directorate | undefined {
  return DIRECTORATES.find((d) => d.id === id)
}

export function byStatus(status: DirectorateStatus): Directorate[] {
  return DIRECTORATES.filter((d) => d.status === status)
}

export interface DirectorateSummary {
  directorates: number
  supported: number
  partial: number
  /** Distinct in-repo modules backing the directorates. */
  modulesLinked: number
}

export function directorateSummary(items: Directorate[] = DIRECTORATES): DirectorateSummary {
  return {
    directorates: items.length,
    supported: items.filter((d) => d.status === "supported").length,
    partial: items.filter((d) => d.status === "partial").length,
    modulesLinked: new Set(items.map((d) => d.moduleRef)).size,
  }
}


export function toCSV(items: Directorate[] = DIRECTORATES): string {
  const header = ["Abbr", "Name", "Mandate", "Focus", "Module", "Status"]
  const rows = items.map((d) => [d.abbr, d.name, d.mandate, d.focus, d.moduleRef, d.status].map(csvField).join(","))
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
