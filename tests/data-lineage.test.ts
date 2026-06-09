import { test } from "node:test"
import assert from "node:assert/strict"
import {
  DATASETS,
  SOURCE_SYSTEMS,
  datasetById,
  byLayer,
  lineageOf,
  danglingRefs,
  layerViolations,
  unknownStores,
  lineageSummary,
  toCSV,
} from "@/lib/data/lineage"

test("the lineage DAG has no dangling upstream references", () => {
  assert.deepEqual(danglingRefs(), [])
})

test("the medallion flow is valid (bronze<-source, silver<-bronze, gold<-silver/gold)", () => {
  assert.deepEqual(layerViolations(), [])
})

test("every dataset's store is a declared polyglot store", () => {
  assert.deepEqual(unknownStores(), [])
})

test("bronze datasets are 1:1 from a source system", () => {
  for (const b of byLayer("bronze")) {
    assert.equal(b.upstream.length, 1, `${b.id} should ingest one source`)
    assert.ok(SOURCE_SYSTEMS.some((s) => s.id === b.upstream[0]), `${b.id} upstream is a source`)
  }
})

test("gold products named in the brief exist and trace back to sources", () => {
  for (const g of ["gld_dropout_risk", "gld_learning_gap", "gld_scheme_leakage"]) {
    const d = datasetById(g)
    assert.equal(d?.layer, "gold")
    assert.ok((d?.upstream.length ?? 0) >= 1)
  }
  // student-360 conforms identity from APAAR + SIS + enrolment + CWSN
  const s360 = lineageOf("slv_student_360")
  assert.ok(s360.datasets.some((d) => d.id === "brz_apaar"))
})

test("PII propagates: dropout-risk is PII, aggregated KPIs are not", () => {
  assert.equal(datasetById("gld_dropout_risk")?.pii, true)
  assert.equal(datasetById("gld_enrolment_kpis")?.pii, false)
})

test("summary tallies layers, sources and PII datasets", () => {
  const s = lineageSummary()
  assert.equal(s.datasets, DATASETS.length)
  assert.equal(s.sources, SOURCE_SYSTEMS.length)
  assert.equal(s.bronze + s.silver + s.gold, s.datasets)
  assert.ok(s.piiDatasets > 0 && s.piiDatasets < s.datasets)
})

test("CSV has a header plus one row per dataset", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Dataset,Layer,Store,PII,Upstream,Description")
  assert.equal(lines.length, DATASETS.length + 1)
})
