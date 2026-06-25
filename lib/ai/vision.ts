// VASA-EOS(SE) — Vision & Document-AI capability (Native-AI pillar 8).
//
// The deterministic, testable half of the vision pillar: OMR answer-grid scoring (reusing
// lib/omr) and DOCUMENT FIELD EXTRACTION — pulling labelled key/value fields (Name, DOB,
// marks, UDISE, …) out of OCR'd, semi-structured text from transfer certificates, mark
// sheets and government forms. On-device camera capture / handwriting OCR sits behind a
// seam; this module is the pure scoring + extraction logic that runs on its output.
// Advisory: a human verifies extracted fields before they are committed.

import { scoreOmr, type OmrScore } from "@/lib/omr"

export { scoreOmr }
export type { OmrScore }

export interface FieldSpec {
  key: string
  /** Accepted labels for this field (case-insensitive); first match wins. */
  labels: string[]
}

export interface ExtractedField {
  key: string
  value: string
  /** 0–1 confidence: 1 when a label was matched and a non-empty value followed. */
  confidence: number
  sourceLine: number
}

export interface ExtractionResult {
  fields: ExtractedField[]
  /** Fraction of requested fields that were found with a value. */
  coverage: number
  /** Advisory — extracted fields must be human-verified before use. */
  humanAuthority: true
}

function normalise(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ")
}

/** Extract labelled fields from OCR'd, semi-structured document text. */
export function extractFields(text: string, specs: FieldSpec[]): ExtractionResult {
  const lines = text.split(/\r?\n/).map((l) => l.trim())
  const fields: ExtractedField[] = []

  for (const spec of specs) {
    let found: ExtractedField | null = null
    // Try the most specific (longest) labels first so "UDISE Code" beats "UDISE".
    const labels = [...spec.labels].sort((a, b) => b.length - a.length)
    for (let i = 0; i < lines.length && !found; i++) {
      const line = lines[i]
      const lower = normalise(line)
      for (const label of labels) {
        const lab = normalise(label)
        const idx = lower.indexOf(lab)
        if (idx === -1) continue
        // Value is whatever follows the label (after an optional ":" / "-").
        const after = line.slice(idx + label.length).replace(/^\s*[:\-]\s*/, "").trim()
        const value = after
        found = { key: spec.key, value, confidence: value ? 1 : 0.4, sourceLine: i }
        break
      }
    }
    fields.push(found ?? { key: spec.key, value: "", confidence: 0, sourceLine: -1 })
  }

  const withValue = fields.filter((f) => f.value).length
  return {
    fields,
    coverage: specs.length ? Math.round((withValue / specs.length) * 100) / 100 : 0,
    humanAuthority: true,
  }
}

/** A transfer-certificate / mark-sheet field schema, ready for extractFields. */
export const TC_FIELD_SPEC: FieldSpec[] = [
  { key: "name", labels: ["Name", "Student Name", "Pupil Name"] },
  { key: "dob", labels: ["DOB", "Date of Birth"] },
  { key: "udise", labels: ["UDISE", "UDISE Code"] },
  { key: "class", labels: ["Class", "Std", "Standard"] },
  { key: "admissionNo", labels: ["Admission No", "Adm No", "Admission Number"] },
]
