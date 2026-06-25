// VASA-EOS(SE) — medallion data-lineage catalogue (Data pillar / Bronze·Silver·Gold).
//
// lib/data declares the polyglot stores, tiers and zones. This makes the lakehouse
// concrete: the actual dataset DAG — raw source systems ingested to Bronze, conformed
// to Silver, and modelled to Gold (the analytics/ML products named in the policy brief:
// dropout-risk, learning-gap, scheme-leakage). It is the dbt-style model graph as
// inspectable data. Three relationships are self-verified by tests: every upstream ref
// resolves (no dangling lineage), the layer flow is valid (bronze<-source, silver<-
// bronze/source, gold<-silver/gold), and every dataset's store is a real polyglot store.
// Pure + client-safe.

import { csvField } from "@/lib/csv"

import { POLYGLOT_STORES } from "./index"

export type Layer = "bronze" | "silver" | "gold"

export interface SourceSystem {
  id: string
  name: string
  ofRecord: string
}

// Systems of record ingested into the lake (APAAR/UDISE+ are the master identities).
export const SOURCE_SYSTEMS: SourceSystem[] = [
  { id: "src_apaar", name: "APAAR registry", ofRecord: "Lifelong learner identity" },
  { id: "src_udise", name: "UDISE+", ofRecord: "School & enrolment master" },
  { id: "src_sis", name: "SIS", ofRecord: "Student records" },
  { id: "src_attendance", name: "Attendance", ofRecord: "Daily attendance" },
  { id: "src_assessment", name: "Assessment / HPC", ofRecord: "Scores & holistic progress" },
  { id: "src_dbt", name: "DBT / scholarships", ofRecord: "Scheme disbursements" },
  { id: "src_rbsk", name: "RBSK health", ofRecord: "Health screening" },
  { id: "src_cwsn", name: "CWSN / inclusion", ofRecord: "Disability & IEP" },
]

export interface Dataset {
  id: string
  name: string
  layer: Layer
  /** Polyglot store (must match a POLYGLOT_STORES name). */
  store: string
  description: string
  /** Upstream source-system ids (bronze) or dataset ids (silver/gold). */
  upstream: string[]
  pii: boolean
}

export const DATASETS: Dataset[] = [
  // Bronze — raw, immutable, 1:1 from a source system.
  { id: "brz_apaar", name: "Raw APAAR", layer: "bronze", store: "Object Storage", description: "Immutable APAAR identity landing", upstream: ["src_apaar"], pii: true },
  { id: "brz_students", name: "Raw students", layer: "bronze", store: "Object Storage", description: "Immutable SIS student landing", upstream: ["src_sis"], pii: true },
  { id: "brz_enrolment", name: "Raw enrolment", layer: "bronze", store: "Object Storage", description: "UDISE+ enrolment landing", upstream: ["src_udise"], pii: false },
  { id: "brz_attendance", name: "Raw attendance", layer: "bronze", store: "Object Storage", description: "Daily attendance events landing", upstream: ["src_attendance"], pii: false },
  { id: "brz_assessments", name: "Raw assessments", layer: "bronze", store: "Object Storage", description: "Scores / HPC landing", upstream: ["src_assessment"], pii: false },
  { id: "brz_schemes", name: "Raw scheme disbursements", layer: "bronze", store: "Object Storage", description: "DBT disbursement landing", upstream: ["src_dbt"], pii: true },
  { id: "brz_health", name: "Raw health screening", layer: "bronze", store: "Object Storage", description: "RBSK screening landing", upstream: ["src_rbsk"], pii: true },
  { id: "brz_cwsn", name: "Raw CWSN", layer: "bronze", store: "Object Storage", description: "Disability / IEP landing", upstream: ["src_cwsn"], pii: true },

  // Silver — cleaned, conformed, joined.
  { id: "slv_student_360", name: "Conformed student 360", layer: "silver", store: "Relational", description: "Single conformed student dimension (APAAR-keyed)", upstream: ["brz_students", "brz_apaar", "brz_enrolment", "brz_cwsn"], pii: true },
  { id: "slv_attendance_daily", name: "Attendance daily fact", layer: "silver", store: "Relational", description: "Cleaned daily attendance joined to student 360", upstream: ["brz_attendance", "slv_student_360"], pii: false },
  { id: "slv_assessment_facts", name: "Assessment facts", layer: "silver", store: "Relational", description: "Conformed scores / HPC joined to student 360", upstream: ["brz_assessments", "slv_student_360"], pii: false },
  { id: "slv_scheme_disbursements", name: "Scheme disbursement facts", layer: "silver", store: "Relational", description: "Conformed DBT disbursements joined to student 360", upstream: ["brz_schemes", "slv_student_360"], pii: true },

  // Gold — business-ready / ML products (named in the policy brief).
  { id: "gld_dropout_risk", name: "Dropout risk (early warning)", layer: "gold", store: "Analytics (OLAP)", description: "Per-student dropout-risk features & score", upstream: ["slv_attendance_daily", "slv_assessment_facts", "slv_student_360"], pii: true },
  { id: "gld_learning_gap", name: "Learning-gap forecast", layer: "gold", store: "Analytics (OLAP)", description: "Foundational learning-gap signals (NIPUN)", upstream: ["slv_assessment_facts"], pii: false },
  { id: "gld_scheme_leakage", name: "Scheme leakage detection", layer: "gold", store: "Analytics (OLAP)", description: "Disbursement anomalies / leakage indicators", upstream: ["slv_scheme_disbursements"], pii: false },
  { id: "gld_enrolment_kpis", name: "Enrolment & equity KPIs (VSK)", layer: "gold", store: "Analytics (OLAP)", description: "Aggregated dashboards — no row-level PII", upstream: ["slv_student_360", "slv_attendance_daily"], pii: false },
]

export function datasetById(id: string): Dataset | undefined {
  return DATASETS.find((d) => d.id === id)
}

export function sourceById(id: string): SourceSystem | undefined {
  return SOURCE_SYSTEMS.find((s) => s.id === id)
}

export function byLayer(layer: Layer): Dataset[] {
  return DATASETS.filter((d) => d.layer === layer)
}

/** Direct upstream nodes (datasets and/or source systems) of a dataset. */
export function lineageOf(id: string): { datasets: Dataset[]; sources: SourceSystem[] } {
  const d = datasetById(id)
  if (!d) return { datasets: [], sources: [] }
  const datasets: Dataset[] = []
  const sources: SourceSystem[] = []
  for (const u of d.upstream) {
    const ds = datasetById(u)
    if (ds) datasets.push(ds)
    const src = sourceById(u)
    if (src) sources.push(src)
  }
  return { datasets, sources }
}

/** Upstream refs that resolve to neither a dataset nor a source system. */
export function danglingRefs(): string[] {
  const ids = new Set<string>([...DATASETS.map((d) => d.id), ...SOURCE_SYSTEMS.map((s) => s.id)])
  const bad = new Set<string>()
  for (const d of DATASETS) for (const u of d.upstream) if (!ids.has(u)) bad.add(u)
  return [...bad]
}

const LAYER_RANK: Record<Layer, number> = { bronze: 0, silver: 1, gold: 2 }

/**
 * Medallion flow violations. Bronze may only derive from source systems; silver from
 * bronze (or source); gold from silver or gold. An upstream dataset must never sit in a
 * higher layer than its consumer (prevents inverted/cyclic lineage).
 */
export function layerViolations(): string[] {
  const issues: string[] = []
  for (const d of DATASETS) {
    for (const u of d.upstream) {
      const up = datasetById(u)
      if (!up) {
        // source-system upstream: only valid for bronze and silver
        if (d.layer === "gold") issues.push(`${d.id} (gold) reads source ${u} directly`)
        continue
      }
      if (LAYER_RANK[up.layer] > LAYER_RANK[d.layer]) issues.push(`${d.id} (${d.layer}) reads higher-layer ${up.id} (${up.layer})`)
      if (d.layer === "bronze") issues.push(`${d.id} (bronze) must read source systems only, not ${up.id}`)
    }
  }
  return issues
}

export interface LineageSummary {
  sources: number
  datasets: number
  bronze: number
  silver: number
  gold: number
  piiDatasets: number
}

export function lineageSummary(): LineageSummary {
  return {
    sources: SOURCE_SYSTEMS.length,
    datasets: DATASETS.length,
    bronze: byLayer("bronze").length,
    silver: byLayer("silver").length,
    gold: byLayer("gold").length,
    piiDatasets: DATASETS.filter((d) => d.pii).length,
  }
}

/** Store names referenced by datasets that are not a declared polyglot store. */
export function unknownStores(): string[] {
  const known = new Set(POLYGLOT_STORES.map((s) => s.name))
  return [...new Set(DATASETS.map((d) => d.store).filter((s) => !known.has(s)))]
}


export function toCSV(items: Dataset[] = DATASETS): string {
  const header = ["Dataset", "Layer", "Store", "PII", "Upstream", "Description"]
  const rows = items.map((d) =>
    [d.name, d.layer, d.store, d.pii ? "yes" : "no", d.upstream.join("; "), d.description].map(csvField).join(","),
  )
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
