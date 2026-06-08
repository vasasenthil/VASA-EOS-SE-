import { test } from "node:test"
import assert from "node:assert/strict"
import { goLiveRows, goLiveSummary, toCSV } from "@/lib/golive"
import type { IntegrationStatus } from "@/lib/integrations/status"

function st(over: Partial<IntegrationStatus>): IntegrationStatus {
  return {
    key: "udise",
    label: "UDISE+",
    port: "SchoolRegistry",
    note: "",
    flag: "INTEGRATION_UDISE",
    mode: "mock",
    env: [{ name: "UDISE_BASE_URL", required: true, present: false }],
    liveReady: false,
    ...over,
  }
}

test("state derives from mode + liveReady (live / ready / blocked)", () => {
  const rows = goLiveRows([
    st({ key: "a", mode: "live" }),
    st({ key: "b", mode: "mock", liveReady: true }),
    st({ key: "c", mode: "mock", liveReady: false }),
  ])
  assert.deepEqual(rows.map((r) => r.state), ["live", "ready", "blocked"])
})

test("every row carries a prerequisite and owner", () => {
  const rows = goLiveRows([st({ key: "diksha" }), st({ key: "exams" }), st({ key: "aadhaar" })])
  assert.ok(rows.every((r) => r.prerequisite && r.owner))
  assert.equal(rows.find((r) => r.key === "diksha")?.prerequisite, "public-api")
  assert.equal(rows.find((r) => r.key === "aadhaar")?.prerequisite, "mou")
})

test("summary tallies states and ready percentage", () => {
  const rows = goLiveRows([st({ mode: "live" }), st({ liveReady: true }), st({ liveReady: false }), st({ liveReady: false })])
  const s = goLiveSummary(rows)
  assert.equal(s.total, 4)
  assert.equal(s.live, 1)
  assert.equal(s.ready, 1)
  assert.equal(s.blocked, 2)
  assert.equal(s.readyPct, 50)
})

test("CSV has a header and one row per port", () => {
  const rows = goLiveRows([st({}), st({ key: "diksha", mode: "live" })])
  const lines = toCSV(rows).split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Port,Label,State,Prerequisite,Owner,Flag,Env vars set")
  assert.equal(lines.length, rows.length + 1)
})
