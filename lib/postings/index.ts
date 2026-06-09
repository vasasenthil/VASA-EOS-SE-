// VASA-EOS(SE) — teacher posting / transfer (Sec 16 / counselling-based transfers).
// Transfer requests move requested → approved → posted (or rejected). Pure logic.

export type TransferStatus = "requested" | "approved" | "posted" | "rejected"

export const TRANSFER_FLOW: TransferStatus[] = ["requested", "approved", "posted"]

export function nextTransferStatus(s: TransferStatus): TransferStatus {
  const i = TRANSFER_FLOW.indexOf(s)
  return i < 0 || i >= TRANSFER_FLOW.length - 1 ? "posted" : TRANSFER_FLOW[i + 1]
}

export interface TransferRequest {
  id: string
  teacher: string
  fromSchool: string
  toSchool: string
  reason: string
  status: TransferStatus
}

export interface TransferSummary {
  total: number
  requested: number
  approved: number
  posted: number
  rejected: number
}

export function transferSummary(reqs: TransferRequest[]): TransferSummary {
  return {
    total: reqs.length,
    requested: reqs.filter((r) => r.status === "requested").length,
    approved: reqs.filter((r) => r.status === "approved").length,
    posted: reqs.filter((r) => r.status === "posted").length,
    rejected: reqs.filter((r) => r.status === "rejected").length,
  }
}
