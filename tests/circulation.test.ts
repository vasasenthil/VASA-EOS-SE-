import { test } from "node:test"
import assert from "node:assert/strict"
import { addDays, dueDate, isOverdue, loanStatus, circSummary, LOAN_DAYS, type Loan } from "@/lib/circulation"

const loan = (over: Partial<Loan>): Loan => ({
  id: "L1",
  bookId: "B1",
  bookTitle: "Thirukkural",
  borrower: "A",
  issuedOn: "2026-06-01",
  dueOn: "2026-06-15",
  tenantId: "TN-CHN-B1-S1",
  ...over,
})

test("addDays / dueDate compute the 14-day loan window", () => {
  assert.equal(addDays("2026-06-01", LOAN_DAYS), "2026-06-15")
  assert.equal(dueDate("2026-01-30"), "2026-02-13")
})

test("a returned loan is never overdue", () => {
  assert.equal(isOverdue(loan({ returnedOn: "2026-06-20" }), "2026-06-30"), false)
})

test("loanStatus reflects active / overdue / returned", () => {
  assert.equal(loanStatus(loan({}), "2026-06-10"), "active")
  assert.equal(loanStatus(loan({}), "2026-06-20"), "overdue")
  assert.equal(loanStatus(loan({ returnedOn: "2026-06-12" }), "2026-06-20"), "returned")
})

test("circSummary counts the three states", () => {
  const loans = [loan({ id: "a" }), loan({ id: "b", dueOn: "2026-06-02" }), loan({ id: "c", returnedOn: "2026-06-05" })]
  const s = circSummary(loans, "2026-06-10")
  assert.equal(s.active, 1)
  assert.equal(s.overdue, 1)
  assert.equal(s.returned, 1)
})
