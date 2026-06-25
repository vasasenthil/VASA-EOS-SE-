// VASA-EOS(SE) — safe CSV field escaping (RFC-4180 + formula-injection hardening).
//
// CSV exports are opened in spreadsheet software, which executes a cell beginning with = + - @ (or tab/CR) as a
// FORMULA — so an attacker-controlled value like "=HYPERLINK(...)" in a grievance description or vendor name
// becomes code execution on the reviewer's machine (OWASP "CSV Injection"). This neutralises that: a value with
// a formula-trigger lead is prefixed with a single quote so it is treated as text — while genuine negative
// numbers (-5, -3.2) are left intact. It also applies standard RFC-4180 quoting. Pure + client-safe.

const FORMULA_LEAD = /^[=+\-@\t\r]/
const NUMERIC = /^-?\d+(\.\d+)?$/

/** Escape a single CSV field: neutralise formula injection, then RFC-4180-quote. */
export function csvField(value: string): string {
  let s = value
  // Neutralise a formula lead unless the value is a plain number (so "-5" stays "-5").
  if (FORMULA_LEAD.test(s) && !NUMERIC.test(s)) s = "'" + s
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Join cells into one CSV row with safe escaping. */
export function csvRow(cells: string[]): string {
  return cells.map(csvField).join(",")
}
