import { test } from "node:test"
import assert from "node:assert/strict"
import { baglessSummary, BAGLESS_TARGET, BAGLESS_TYPES, type BaglessActivity } from "@/lib/bagless"

const a = (date: string, participants: number): BaglessActivity => ({
  id: `a-${Math.random()}`,
  title: "t",
  type: BAGLESS_TYPES[0],
  date,
  classGroup: "6-8",
  participants,
})

test("target is the NEP 10 bagless days", () => {
  assert.equal(BAGLESS_TARGET, 10)
})

test("summary counts distinct days, participants and target progress", () => {
  const s = baglessSummary([a("2026-06-01", 30), a("2026-06-01", 10), a("2026-06-02", 25)])
  assert.equal(s.activities, 3)
  assert.equal(s.daysLogged, 2)
  assert.equal(s.participants, 65)
  assert.equal(s.targetPct, 20)
})

test("progress caps at 100 percent", () => {
  const many = Array.from({ length: 12 }, (_, i) => a(`2026-06-${String(i + 1).padStart(2, "0")}`, 1))
  assert.equal(baglessSummary(many).targetPct, 100)
})
