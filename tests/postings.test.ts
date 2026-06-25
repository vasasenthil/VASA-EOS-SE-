import { test } from "node:test"
import assert from "node:assert/strict"
import { nextTransferStatus, transferSummary, type TransferRequest } from "@/lib/postings"

const r = (over: Partial<TransferRequest>): TransferRequest => ({ id: "t", teacher: "A", fromSchool: "X", toSchool: "Y", reason: "", status: "requested", ...over })

test("status advances requested -> approved -> posted", () => {
  assert.equal(nextTransferStatus("requested"), "approved")
  assert.equal(nextTransferStatus("approved"), "posted")
  assert.equal(nextTransferStatus("posted"), "posted")
})

test("summary counts each status", () => {
  const reqs = [r({ id: "a" }), r({ id: "b", status: "approved" }), r({ id: "c", status: "posted" }), r({ id: "d", status: "rejected" })]
  const s = transferSummary(reqs)
  assert.equal(s.total, 4)
  assert.equal(s.requested, 1)
  assert.equal(s.approved, 1)
  assert.equal(s.posted, 1)
  assert.equal(s.rejected, 1)
})
