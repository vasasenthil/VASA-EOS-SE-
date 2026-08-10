import { test } from "node:test"
import assert from "node:assert/strict"
import { BUDGET, financeSummary } from "@/lib/finance"
import { generateStatutoryReportPack, statutoryReportPackToCSV } from "@/lib/finance/statutory-reports"

test("statutory report pack binds finance totals to CAG and RTI modules", () => {
  const pack = generateStatutoryReportPack({ fiscalYear: "2026-27", generatedAt: "2026-07-21T00:00:00.000Z", auditAnchorHash: "abcd1234" })

  assert.equal(pack.packId, "STAT-CAG-RTI-2026-27")
  assert.deepEqual(pack.totals, financeSummary(BUDGET))
  assert.equal(pack.lines.length, BUDGET.length)
  assert.ok(pack.lines.some((line) => line.moduleId === "66.3"))
  assert.ok(pack.lines.some((line) => line.moduleId === "66.4"))
  assert.ok(pack.lines.every((line) => line.evidence.includes("abcd1234")))
})

test("statutory report pack public assurances exclude child-level disclosures", () => {
  const pack = generateStatutoryReportPack({ fiscalYear: "2026-27", auditAnchorHash: "abcd1234" })
  assert.ok(pack.publicAssurance.some((line) => /aggregate-first/i.test(line)))
  assert.ok(pack.publicAssurance.some((line) => /excluded/i.test(line)))
  assert.doesNotMatch(JSON.stringify(pack.lines), /studentName|apaar|bank account|grievance narrative/i)
})

test("statutory report CSV has one row per budget head and remains public-safe", () => {
  const pack = generateStatutoryReportPack({ fiscalYear: "2026-27", auditAnchorHash: "abcd1234" })
  const csv = statutoryReportPackToCSV(pack)

  assert.equal(csv.trim().split("\r\n").length, BUDGET.length + 1)
  assert.match(csv, /auditAnchorHash/)
  assert.doesNotMatch(csv, /studentName|apaar|ifsc|accountNumber/i)
})
