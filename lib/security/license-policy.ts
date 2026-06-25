// VASA-EOS(SE) — open-source license policy (supply-chain / procurement compliance).
// Classifies each dependency's SPDX license against a government-OSS policy:
// permissive licenses are allowed; weak-copyleft and unknown need review; strong
// copyleft / non-OSS are denied without explicit legal sign-off. Pure + testable;
// scripts/license-check.mjs collects real licenses from node_modules and runs this.

export type LicenseClass = "allowed" | "review" | "denied"

// Permissive — safe for a government platform to distribute/operate.
export const PERMISSIVE = new Set([
  "MIT", "ISC", "0BSD", "BSD-2-Clause", "BSD-3-Clause", "Apache-2.0", "Unlicense",
  "CC0-1.0", "Python-2.0", "BlueOak-1.0.0", "Zlib", "WTFPL",
])

// Strong copyleft / non-OSS — denied pending explicit legal review.
export const DENIED = new Set([
  "GPL-2.0", "GPL-2.0-only", "GPL-2.0-or-later", "GPL-3.0", "GPL-3.0-only",
  "GPL-3.0-or-later", "AGPL-3.0", "AGPL-3.0-only", "SSPL-1.0", "BUSL-1.1",
])

/** Classify a single SPDX license id. Unknown/empty => review (never silently OK). */
export function classifyLicense(id: string | undefined): LicenseClass {
  const norm = (id ?? "").trim()
  if (!norm) return "review"
  // Take the most-restrictive term of an SPDX expression (e.g. "(MIT OR GPL-3.0)").
  const terms = norm.split(/\s+(?:OR|AND)\s+|\/|,/i).map((t) => t.replace(/[()]/g, "").trim()).filter(Boolean)
  if (terms.some((t) => DENIED.has(t))) return "denied"
  if (terms.length > 0 && terms.every((t) => PERMISSIVE.has(t))) return "allowed"
  return "review"
}

export interface LicenseItem {
  name: string
  license?: string
}

export interface LicenseFinding {
  name: string
  license: string
  class: LicenseClass
}

/** Every component that is not cleanly allowed — the compliance worklist. */
export function checkLicenses(items: LicenseItem[]): LicenseFinding[] {
  return items
    .map((i) => ({ name: i.name, license: i.license ?? "UNKNOWN", class: classifyLicense(i.license) }))
    .filter((f) => f.class !== "allowed")
}

export interface LicenseSummary {
  total: number
  allowed: number
  review: number
  denied: number
  /** The CI gate: no denied licenses. */
  passesGate: boolean
}

export function licenseSummary(items: LicenseItem[]): LicenseSummary {
  const classes = items.map((i) => classifyLicense(i.license))
  const denied = classes.filter((c) => c === "denied").length
  return {
    total: items.length,
    allowed: classes.filter((c) => c === "allowed").length,
    review: classes.filter((c) => c === "review").length,
    denied,
    passesGate: denied === 0,
  }
}
