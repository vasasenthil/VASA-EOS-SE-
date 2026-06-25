// Property-based / fuzz robustness tests — assert invariants across many random inputs.
// No external fuzzing dependency (the project bans new deps): a seeded PRNG drives the
// generators so failures are reproducible.

import { test } from "node:test"
import assert from "node:assert/strict"
import { csvField } from "@/lib/csv"
import { parseCSV } from "@/lib/ingestion/csv"
import { ingest } from "@/lib/ingestion"
import { SCHOOL_SCHEMA, type SchoolRecord } from "@/lib/ingestion/school-registry"

/** Deterministic PRNG (mulberry32) so fuzz runs are reproducible. */
function rng(seed: number): () => number {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const CHARS = ['a', 'B', '9', ' ', ',', '"', '\n', '\r', '=', '+', '-', '@', '\t', '₹', "'", '|', '0']
function randomString(r: () => number, maxLen = 12): string {
  const n = Math.floor(r() * maxLen)
  let s = ''
  for (let i = 0; i < n; i++) s += CHARS[Math.floor(r() * CHARS.length)]
  return s
}

const FORMULA_NUMERIC = /^-?\d+(\.\d+)?$/

test("property: csvField → parseCSV round-trips for arbitrary strings", () => {
  const r = rng(12345)
  for (let i = 0; i < 500; i++) {
    const s = randomString(r)
    const decoded = parseCSV(csvField(s) + '\n')[0]?.[0] ?? ''
    // The decoder recovers exactly what csvField encoded (which may carry a leading
    // formula-neutralising quote).
    const expected = /^[=+\-@\t\r]/.test(s) && !FORMULA_NUMERIC.test(s) ? "'" + s : s
    assert.equal(decoded, expected, `round-trip failed for ${JSON.stringify(s)}`)
  }
})

test("property: an escaped cell never decodes to a live spreadsheet formula", () => {
  const r = rng(98765)
  for (let i = 0; i < 500; i++) {
    const s = randomString(r)
    const decoded = parseCSV(csvField(s) + '\n')[0]?.[0] ?? ''
    if (FORMULA_NUMERIC.test(decoded)) continue // genuine numbers are fine
    // No decoded cell may begin with a formula trigger (=, +, @) — those are neutralised.
    assert.ok(!/^[=+@]/.test(decoded), `formula leaked through for ${JSON.stringify(s)} → ${JSON.stringify(decoded)}`)
  }
})

function randomSchoolCSV(r: () => number, n: number): { csv: string; codes: string[] } {
  const codes: string[] = []
  const lines = ['UDISE Code,School Name,District,Block,School Category,Management,Total Enrolment']
  const cats = ['Primary', 'Upper Primary', 'Secondary', 'Higher Secondary', 'Pre-Primary']
  const mgmt = ['Government', 'Aided', 'Private Unaided', 'Local Body']
  for (let i = 0; i < n; i++) {
    // 11-digit UDISE; deliberately reuse an earlier code sometimes to exercise dedup.
    const reuse = codes.length > 0 && r() < 0.3
    const code = reuse ? codes[Math.floor(r() * codes.length)] : String(33000000000 + Math.floor(r() * 99999999)).slice(0, 11)
    if (!reuse) codes.push(code)
    const enrol = Math.floor(r() * 2000)
    lines.push(`${code},School ${i},Madurai,Block ${i % 3},${cats[i % cats.length]},${mgmt[i % mgmt.length]},${enrol}`)
  }
  return { csv: lines.join('\n'), codes }
}

test("property: school ingestion is always idempotent and never duplicates a UDISE code", () => {
  const r = rng(2026)
  for (let iter = 0; iter < 60; iter++) {
    const n = 1 + Math.floor(r() * 12)
    const { csv } = randomSchoolCSV(r, n)
    const first = ingest<SchoolRecord>(csv, SCHOOL_SCHEMA)
    // unique UDISE codes after load
    const codes = first.records.map((s) => s.udiseCode)
    assert.equal(new Set(codes).size, codes.length, 'duplicate UDISE survived a load')
    // re-loading the same export inserts nothing and keeps the set stable
    const second = ingest<SchoolRecord>(csv, SCHOOL_SCHEMA, first.records)
    assert.equal(second.inserted, 0, 'idempotency broken: re-load inserted rows')
    assert.equal(second.records.length, first.records.length, 'record count drifted on re-load')
  }
})
