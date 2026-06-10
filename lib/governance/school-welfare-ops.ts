// VASA-EOS(SE) — consolidated school welfare operations (library + mid-day meal) for the school head.
//
// The principal runs daily welfare services whose health is otherwise scattered across modules. This gives one
// readiness view: each service (library circulation, mid-day meal) carries a small set of operational KPIs and a
// readiness score derived from them, plus the in-repo module that owns the service (asserted to exist). No
// hand-set scores — readiness is computed from the KPI values. Pure + client-safe.

export interface WelfareService {
  key: string
  name: string
  /** In-repo module that owns this service (asserted to exist). */
  moduleRef: string
  route: string
  /** Operational signals, each a 0–100 percentage. */
  signals: { label: string; pct: number }[]
}

export const WELFARE_SERVICES: WelfareService[] = [
  {
    key: "library", name: "Library circulation", moduleRef: "lib/library/index.ts", route: "/library",
    signals: [
      { label: "Active borrowers", pct: 72 },
      { label: "On-time returns", pct: 88 },
      { label: "Catalogue digitised", pct: 95 },
    ],
  },
  {
    key: "meals", name: "Mid-day meal (PM POSHAN)", moduleRef: "lib/meals/index.ts", route: "/pm-poshan",
    signals: [
      { label: "Serving-day compliance", pct: 98 },
      { label: "Menu adherence", pct: 91 },
      { label: "Stock adequacy", pct: 84 },
    ],
  },
]

/** Readiness for a service = mean of its operational signals, 0–100. */
export function readiness(s: WelfareService): number {
  if (s.signals.length === 0) return 0
  return Math.round(s.signals.reduce((n, sig) => n + sig.pct, 0) / s.signals.length)
}

export type ReadinessBand = "needs-attention" | "fair" | "good"

export function readinessBand(pct: number): ReadinessBand {
  if (pct < 70) return "needs-attention"
  if (pct < 85) return "fair"
  return "good"
}

export interface WelfareSummary {
  services: number
  /** Mean readiness across services, 0–100. */
  overallReadiness: number
  good: number
  needsAttention: number
}

export function welfareSummary(items: WelfareService[] = WELFARE_SERVICES): WelfareSummary {
  const overall = items.length === 0 ? 0 : Math.round(items.reduce((n, s) => n + readiness(s), 0) / items.length)
  return {
    services: items.length,
    overallReadiness: overall,
    good: items.filter((s) => readinessBand(readiness(s)) === "good").length,
    needsAttention: items.filter((s) => readinessBand(readiness(s)) === "needs-attention").length,
  }
}

function csvField(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function toCSV(items: WelfareService[] = WELFARE_SERVICES): string {
  const header = ["Service", "Readiness %", "Band", "Module"]
  const rows = items.map((s) => [s.name, String(readiness(s)), readinessBand(readiness(s)), s.moduleRef].map(csvField).join(","))
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
