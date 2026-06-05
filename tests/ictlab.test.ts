import { test } from "node:test"
import assert from "node:assert/strict"
import { ictSummary, hasShortage, ICT_SUBJECTS, type IctSession } from "@/lib/ictlab"

const s = (students: number, devicesWorking: number, devicesTotal: number): IctSession => ({
  id: `s-${Math.random()}`,
  cls: "8A",
  subject: ICT_SUBJECTS[0],
  date: "2026-06-05",
  students,
  devicesWorking,
  devicesTotal,
})

test("subject catalogue is non-empty", () => {
  assert.ok(ICT_SUBJECTS.includes("Coding / robotics"))
})

test("shortage when working devices cannot cover the class", () => {
  assert.equal(hasShortage(s(40, 20, 40)), true)
  assert.equal(hasShortage(s(40, 40, 40)), false)
})

test("summary totals students, device uptime and shortage sessions", () => {
  const sum = ictSummary([s(40, 20, 40), s(30, 30, 30)])
  assert.equal(sum.sessions, 2)
  assert.equal(sum.studentsReached, 70)
  assert.equal(sum.uptimePct, 71) // (20+30)/(40+30)=50/70
  assert.equal(sum.shortageSessions, 1)
})

test("empty log yields zero uptime", () => {
  assert.equal(ictSummary([]).uptimePct, 0)
})
