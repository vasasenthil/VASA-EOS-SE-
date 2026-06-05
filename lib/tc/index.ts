// VASA-EOS(SE) — transfer / leaving certificate (TC) issuance register.
// Request, verify and issue TCs with a reason and unique number. Pure logic.

export type TcStatus = "requested" | "verified" | "issued"

export const TC_FLOW: TcStatus[] = ["requested", "verified", "issued"]

export function nextTcStatus(s: TcStatus): TcStatus {
  const i = TC_FLOW.indexOf(s)
  return i < 0 || i >= TC_FLOW.length - 1 ? "issued" : TC_FLOW[i + 1]
}

export const TC_REASONS = [
  "Relocation / family transfer",
  "Admission to higher class elsewhere",
  "Completed final grade",
  "Migration (inter-state)",
  "Medical reasons",
  "Other",
]

export interface TcRequest {
  id: string
  student: string
  cls: string
  reason: string
  status: TcStatus
  date: string
}

export interface TcSummary {
  total: number
  issued: number
  pending: number
}

export function tcSummary(requests: TcRequest[]): TcSummary {
  return {
    total: requests.length,
    issued: requests.filter((r) => r.status === "issued").length,
    pending: requests.filter((r) => r.status !== "issued").length,
  }
}

// Sequential TC number for the year, e.g. TC/2026/0007.
export function tcNumber(year: number, seq: number): string {
  return `TC/${year}/${String(seq).padStart(4, "0")}`
}
