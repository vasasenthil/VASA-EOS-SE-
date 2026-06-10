// VASA-EOS(SE) — generic, reusable data-ingestion engine (the reference template for all CRUD modules).
//
// One schema-driven pipeline: parse CSV → map source columns to canonical fields → validate every cell →
// idempotently UPSERT by a natural key. "Idempotent" is the property that matters for government data: loading
// the same export twice must not duplicate a single school or child — the second load updates in place. Invalid
// rows are reported (row, column, message) and skipped, never silently dropped or half-written. The engine is
// store-agnostic: it merges into the records you pass and returns the merged set, so a store.ts can persist the
// result via the existing getDb() seam (or the in-memory fallback). Pure + client-safe.

import { parseCSV } from "@/lib/ingestion/csv"

export interface FieldSpec<T> {
  /** Source CSV column header. */
  column: string
  /** Canonical record key it maps to. */
  key: keyof T
  required?: boolean
  /** Return an error message, or null if the raw value is acceptable. */
  validate?: (raw: string) => string | null
  /** Convert the raw trimmed string to the typed value (default: the string itself). */
  transform?: (raw: string) => unknown
}

export interface Schema<T> {
  name: string
  /** The natural key used for idempotent upsert (e.g. UDISE code, APAAR id). */
  idField: keyof T
  fields: FieldSpec<T>[]
}

export interface RowError {
  /** 1-based data-row number (excludes the header). */
  row: number
  column: string
  message: string
}

export interface IngestResult<T> {
  /** Total data rows seen. */
  rows: number
  inserted: number
  updated: number
  skipped: number
  errors: RowError[]
  /** The full merged record set after the load. */
  records: T[]
}

/** Ingest CSV text against a schema, idempotently merging into `existing`. */
export function ingest<T>(csvText: string, schema: Schema<T>, existing: T[] = []): IngestResult<T> {
  const table = parseCSV(csvText)
  if (table.length === 0) {
    return { rows: 0, inserted: 0, updated: 0, skipped: 0, errors: [], records: [...existing] }
  }
  const header = table[0].map((h) => h.trim())
  const colIndex = new Map<string, number>()
  header.forEach((h, i) => colIndex.set(h, i))

  // A required source column missing from the header is a fatal mapping error.
  const errors: RowError[] = []
  for (const f of schema.fields) {
    if (f.required && !colIndex.has(f.column)) {
      errors.push({ row: 0, column: f.column, message: "required column missing from header" })
    }
  }

  const map = new Map<unknown, T>()
  for (const rec of existing) map.set(rec[schema.idField], rec)

  let inserted = 0
  let updated = 0
  let skipped = 0
  const dataRows = table.slice(1)

  if (errors.length === 0) {
    dataRows.forEach((cells, idx) => {
      const rowNo = idx + 1
      const record: Record<string, unknown> = {}
      const rowErrors: RowError[] = []

      for (const f of schema.fields) {
        const ci = colIndex.get(f.column)
        const raw = (ci === undefined ? "" : cells[ci] ?? "").trim()
        if (f.required && raw === "") {
          rowErrors.push({ row: rowNo, column: f.column, message: "required value missing" })
          continue
        }
        if (raw !== "" && f.validate) {
          const msg = f.validate(raw)
          if (msg) {
            rowErrors.push({ row: rowNo, column: f.column, message: msg })
            continue
          }
        }
        if (raw === "") continue // optional + empty → leave unset
        record[f.key as string] = f.transform ? f.transform(raw) : raw
      }

      if (rowErrors.length > 0) {
        errors.push(...rowErrors)
        skipped++
        return
      }
      const rec = record as T
      const id = rec[schema.idField]
      if (map.has(id)) updated++
      else inserted++
      map.set(id, rec)
    })
  } else {
    // header mapping failed → nothing is loaded
    skipped = dataRows.length
  }

  return {
    rows: dataRows.length,
    inserted,
    updated,
    skipped,
    errors,
    records: [...map.values()],
  }
}

// --- common reusable validators ---

export function digits(len: number): (raw: string) => string | null {
  return (raw) => (new RegExp(`^\\d{${len}}$`).test(raw) ? null : `must be ${len} digits`)
}

export function oneOf(allowed: readonly string[]): (raw: string) => string | null {
  return (raw) => (allowed.includes(raw) ? null : `must be one of: ${allowed.join(", ")}`)
}

export function nonNegativeInt(raw: string): string | null {
  return /^\d+$/.test(raw) ? null : "must be a non-negative integer"
}

export function toInt(raw: string): number {
  return parseInt(raw, 10)
}

export function toFloat(raw: string): number {
  return parseFloat(raw)
}
