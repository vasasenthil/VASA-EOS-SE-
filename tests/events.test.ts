import { test } from "node:test"
import assert from "node:assert/strict"
import { SAMPLE_EVENTS, sortEvents, upcoming, calendarSummary, type AcademicEvent } from "@/lib/events"

const events: AcademicEvent[] = [
  { id: "a", title: "Late", type: "event", date: "2026-12-01" },
  { id: "b", title: "Early", type: "exam", date: "2026-06-01" },
  { id: "c", title: "Mid", type: "holiday", date: "2026-09-01" },
]

test("sortEvents orders by date ascending", () => {
  assert.deepEqual(sortEvents(events).map((e) => e.id), ["b", "c", "a"])
})

test("upcoming filters from today inclusive, soonest first", () => {
  const up = upcoming(events, "2026-09-01")
  assert.deepEqual(up.map((e) => e.id), ["c", "a"])
})

test("calendarSummary counts by type", () => {
  const s = calendarSummary(SAMPLE_EVENTS)
  assert.equal(s.total, SAMPLE_EVENTS.length)
  assert.equal(s.byType.term + s.byType.exam + s.byType.holiday + s.byType.ptm + s.byType.event, SAMPLE_EVENTS.length)
})
