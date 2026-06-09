import { test } from "node:test"
import assert from "node:assert/strict"
import { nextTicketStatus, maintenanceSummary, type Ticket } from "@/lib/maintenance"

const t = (over: Partial<Ticket>): Ticket => ({
  id: "T1",
  category: "Electrical",
  description: "x",
  priority: "medium",
  status: "open",
  raisedOn: "2026-06-01",
  ...over,
})

test("nextTicketStatus advances open -> in_progress -> resolved", () => {
  assert.equal(nextTicketStatus("open"), "in_progress")
  assert.equal(nextTicketStatus("in_progress"), "resolved")
  assert.equal(nextTicketStatus("resolved"), "resolved")
})

test("summary counts statuses and high-priority open backlog", () => {
  const tickets = [
    t({ id: "a", status: "open", priority: "high" }),
    t({ id: "b", status: "in_progress", priority: "high" }),
    t({ id: "c", status: "resolved", priority: "high" }),
    t({ id: "d", status: "open", priority: "low" }),
  ]
  const s = maintenanceSummary(tickets)
  assert.equal(s.total, 4)
  assert.equal(s.open, 2)
  assert.equal(s.inProgress, 1)
  assert.equal(s.resolved, 1)
  assert.equal(s.highOpen, 2) // high & not resolved
})
