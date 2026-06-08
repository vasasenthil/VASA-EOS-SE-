// VASA-EOS(SE) — per-port go-live checklist & credentials tracker (Integration
// pillar). For every integration port, what it takes to flip from mock to live:
// the prerequisite (MoU / sandbox / public API), the env vars to set, the owning
// authority, and a derived readiness state from the live integration status.
// Pure: takes the integration status rows so it is unit-testable.

import type { IntegrationStatus } from "@/lib/integrations/status"

export type Prerequisite = "public-api" | "sandbox" | "mou" | "internal"

export interface GoLiveStep {
  key: string
  label: string
  prerequisite: Prerequisite
  owner: string
  flag: string
}

// Owner + prerequisite per port (the parts that aren't derivable from env presence).
const META: Record<string, { prerequisite: Prerequisite; owner: string }> = {
  apaar: { prerequisite: "mou", owner: "MoE / APAAR registry" },
  aadhaar: { prerequisite: "mou", owner: "UIDAI (via licensed AUA/KUA)" },
  digilocker: { prerequisite: "mou", owner: "MeitY / DigiLocker" },
  dbt: { prerequisite: "mou", owner: "NPCI / PFMS sponsor bank" },
  udise: { prerequisite: "sandbox", owner: "MoE / UDISE+ (state mirror)" },
  diksha: { prerequisite: "public-api", owner: "MoE / DIKSHA (no MoU)" },
  language: { prerequisite: "sandbox", owner: "MeitY / Bhashini (ULCA)" },
  agents: { prerequisite: "sandbox", owner: "State AI / LLM provider" },
  emis: { prerequisite: "internal", owner: "TN School Education / EMIS cell" },
  portal: { prerequisite: "internal", owner: "TN School Education / web team" },
  exams: { prerequisite: "internal", owner: "Directorate of Govt Examinations" },
  retrieval: { prerequisite: "sandbox", owner: "State AI / vector-DB provider" },
}

export const PREREQUISITE_LABEL: Record<Prerequisite, string> = {
  "public-api": "Public API (no agreement)",
  sandbox: "Provider sandbox + keys",
  mou: "MoU / data-sharing agreement",
  internal: "State-internal endpoint",
}

export type GoLiveState = "live" | "ready" | "blocked"

export interface GoLiveRow {
  key: string
  label: string
  port: string
  prerequisite: Prerequisite
  owner: string
  flag: string
  /** Env vars and whether each is set (never the value). */
  env: { name: string; required: boolean; present: boolean }[]
  /** live = already flipped; ready = configured, flip the flag; blocked = secrets missing. */
  state: GoLiveState
}

/** Derive a go-live row per port from the live integration status rows. */
export function goLiveRows(statuses: IntegrationStatus[]): GoLiveRow[] {
  return statuses.map((s) => {
    const meta = META[s.key] ?? { prerequisite: "sandbox" as Prerequisite, owner: "—" }
    const state: GoLiveState = s.mode === "live" ? "live" : s.liveReady ? "ready" : "blocked"
    return {
      key: s.key,
      label: s.label,
      port: s.port,
      prerequisite: meta.prerequisite,
      owner: meta.owner,
      flag: s.flag,
      env: s.env,
      state,
    }
  })
}

export interface GoLiveSummary {
  total: number
  live: number
  ready: number
  blocked: number
  /** % of ports either live or configuration-ready. */
  readyPct: number
}

export function goLiveSummary(rows: GoLiveRow[]): GoLiveSummary {
  const live = rows.filter((r) => r.state === "live").length
  const ready = rows.filter((r) => r.state === "ready").length
  const blocked = rows.filter((r) => r.state === "blocked").length
  return {
    total: rows.length,
    live,
    ready,
    blocked,
    readyPct: rows.length === 0 ? 0 : Math.round(((live + ready) / rows.length) * 100),
  }
}

function csvField(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

/** RFC 4180 CSV of the go-live tracker (one row per port). */
export function toCSV(rows: GoLiveRow[]): string {
  const header = ["Port", "Label", "State", "Prerequisite", "Owner", "Flag", "Env vars set"]
  const lines = rows.map((r) => {
    const env = `${r.env.filter((e) => e.present).length}/${r.env.length}`
    return [r.port, r.label, r.state, PREREQUISITE_LABEL[r.prerequisite], r.owner, r.flag, env].map(csvField).join(",")
  })
  return [header.join(","), ...lines].join("\r\n") + "\r\n"
}
