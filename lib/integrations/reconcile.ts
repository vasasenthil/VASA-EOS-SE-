// UDISE+ reconciliation — turns the school-registry federation from a read-only lookup into a load-bearing
// VERIFICATION gate. A platform school record is only trustworthy if it agrees with UDISE+ (the statutory source
// of truth for every Indian school). reconcileSchool() compares the platform's local record against the registry
// record field-by-field and reports verified / mismatch / not_found with the exact field-level diffs.
//
// This is pure and mode-agnostic: it runs identically whether integrations.udise is the mock adapter or the
// live state-hosted UDISE+ gateway (INTEGRATION_UDISE=live). Flipping to live changes the data source, not the
// gate — so the federation is real, not theatre.

import type { IntegrationResult, SchoolRecord } from "./types"

export type VerificationStatus = "verified" | "mismatch" | "not_found"

export interface FieldMismatch {
  field: string
  local: string
  registry: string
}

export interface SchoolVerification {
  udiseCode: string
  status: VerificationStatus
  mismatches: FieldMismatch[]
  /** number of locally-asserted fields actually compared against the registry */
  checked: number
  /** correlation id from the lookup (mock or live), for the audit trail */
  traceId?: string
}

// The comparable fields. The udiseCode itself is the key, not a compared attribute.
const FIELDS: { key: keyof SchoolRecord; label: string }[] = [
  { key: "name", label: "name" },
  { key: "district", label: "district" },
  { key: "block", label: "block" },
  { key: "managementType", label: "management" },
  { key: "board", label: "board" },
]

function norm(v: string | undefined): string {
  return (v ?? "").trim().toLowerCase()
}

/**
 * reconcileSchool compares the platform's local school record against the UDISE+ registry record.
 * The registry is the source of truth, so only fields the LOCAL record actually asserts (non-empty) are
 * checked — an empty local field is "not claimed", never a mismatch. Comparison is case/whitespace-insensitive.
 */
export function reconcileSchool(local: SchoolRecord, registry: SchoolRecord | null | undefined): SchoolVerification {
  if (!registry || !registry.udiseCode) {
    return { udiseCode: local.udiseCode, status: "not_found", mismatches: [], checked: 0 }
  }
  const mismatches: FieldMismatch[] = []
  let checked = 0
  for (const f of FIELDS) {
    const lv = norm(local[f.key])
    if (lv === "") continue // the platform doesn't assert this field → nothing to verify
    checked++
    if (lv !== norm(registry[f.key])) {
      mismatches.push({ field: f.label, local: String(local[f.key] ?? ""), registry: String(registry[f.key] ?? "") })
    }
  }
  return {
    udiseCode: local.udiseCode,
    status: mismatches.length > 0 ? "mismatch" : "verified",
    mismatches,
    checked,
  }
}

/**
 * verifyFromResult adapts a lookup IntegrationResult (mock or live) into a verification, carrying the trace id
 * for the audit and treating a failed/empty lookup as not_found.
 */
export function verifyFromResult(local: SchoolRecord, res: IntegrationResult<SchoolRecord>): SchoolVerification {
  const v = reconcileSchool(local, res.ok ? res.data : undefined)
  return { ...v, traceId: res.traceId }
}

/** verificationLabel renders a status as a short human label for dashboards. */
export function verificationLabel(s: VerificationStatus): string {
  switch (s) {
    case "verified":
      return "Verified against UDISE+"
    case "mismatch":
      return "Mismatch with UDISE+"
    case "not_found":
      return "Not found in UDISE+"
  }
}
