import { test } from "node:test"
import assert from "node:assert/strict"
import { sortNotices, noticeSummary, type Notice } from "@/lib/notices"

const n = (over: Partial<Notice>): Notice => ({ id: "n", title: "t", body: "", category: "General", audience: "All", date: "2026-06-01", pinned: false, ...over })

test("sortNotices puts pinned first, then most recent", () => {
  const list = [
    n({ id: "a", date: "2026-06-01", pinned: false }),
    n({ id: "b", date: "2026-05-01", pinned: true }),
    n({ id: "c", date: "2026-07-01", pinned: false }),
  ]
  assert.deepEqual(sortNotices(list).map((x) => x.id), ["b", "c", "a"])
})

test("summary counts pinned and urgent", () => {
  const list = [n({ id: "a", pinned: true }), n({ id: "b", category: "Urgent" }), n({ id: "c" })]
  const s = noticeSummary(list)
  assert.equal(s.total, 3)
  assert.equal(s.pinned, 1)
  assert.equal(s.urgent, 1)
})
