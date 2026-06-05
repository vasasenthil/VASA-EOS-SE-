import { test } from "node:test"
import assert from "node:assert/strict"
import { ROUTES, freeSeats, canBoard, board, alight, transportSummary } from "@/lib/transport"

test("freeSeats / canBoard reflect capacity", () => {
  assert.equal(freeSeats(70, 64), 6)
  assert.equal(freeSeats(70, 70), 0)
  assert.equal(canBoard(70, 69), true)
  assert.equal(canBoard(70, 70), false)
})

test("board never exceeds capacity; alight never below zero", () => {
  assert.equal(board(69, 70), 70)
  assert.equal(board(70, 70), 70)
  assert.equal(alight(1), 0)
  assert.equal(alight(0), 0)
})

test("every route has capacity >= current students", () => {
  for (const r of ROUTES) assert.ok(r.capacity >= r.students, `over capacity: ${r.id}`)
})

test("transportSummary still aggregates students and CWSN", () => {
  const s = transportSummary()
  assert.equal(s.routes, ROUTES.length)
  assert.ok(s.students > 0)
})
