"use client"

import { useState } from "react"
import { CATALOGUE } from "@/lib/library"
import { dueDate, loanStatus, circSummary, type Loan, type LoanStatus } from "@/lib/circulation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const STATUS_VARIANT: Record<LoanStatus, "default" | "secondary" | "destructive"> = {
  active: "secondary",
  overdue: "destructive",
  returned: "default",
}

const TODAY = new Date().toISOString().slice(0, 10)

export function CirculationDesk() {
  const [available, setAvailable] = useState<Record<string, number>>(() =>
    Object.fromEntries(CATALOGUE.map((b) => [b.id, b.available])),
  )
  const [loans, setLoans] = useState<Loan[]>([])
  const [seq, setSeq] = useState(1)
  const [bookId, setBookId] = useState(CATALOGUE[0]?.id ?? "")
  const [borrower, setBorrower] = useState("")

  const summary = circSummary(loans, TODAY)

  function issue() {
    const book = CATALOGUE.find((b) => b.id === bookId)
    if (!book || !borrower.trim() || (available[bookId] ?? 0) <= 0) return
    setLoans((prev) => [
      { id: `L-${seq}`, bookId, bookTitle: book.title, borrower: borrower.trim(), issuedOn: TODAY, dueOn: dueDate(TODAY) },
      ...prev,
    ])
    setAvailable((a) => ({ ...a, [bookId]: a[bookId] - 1 }))
    setSeq((n) => n + 1)
    setBorrower("")
  }

  function returnLoan(id: string) {
    setLoans((prev) =>
      prev.map((l) => {
        if (l.id === id && !l.returnedOn) {
          setAvailable((a) => ({ ...a, [l.bookId]: (a[l.bookId] ?? 0) + 1 }))
          return { ...l, returnedOn: TODAY }
        }
        return l
      }),
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">On loan</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{summary.active}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{summary.overdue}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Returned</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{summary.returned}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader>
            <CardTitle>Issue a book</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <select value={bookId} onChange={(e) => setBookId(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {CATALOGUE.map((b) => (
                  <option key={b.id} value={b.id} disabled={(available[b.id] ?? 0) <= 0}>
                    {b.title} ({available[b.id] ?? 0} avail)
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="br">Borrower</Label>
              <Input id="br" value={borrower} onChange={(e) => setBorrower(e.target.value)} placeholder="Student / staff name" />
            </div>
            <Button onClick={issue} disabled={!borrower.trim() || (available[bookId] ?? 0) <= 0} className="w-full">
              Issue (due in 14 days)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Loans ({loans.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loans.length === 0 ? (
              <p className="text-sm text-muted-foreground">No loans yet.</p>
            ) : (
              <ul className="space-y-2">
                {loans.map((l) => {
                  const st = loanStatus(l, TODAY)
                  return (
                    <li key={l.id} className="flex items-center justify-between gap-2 rounded-md border p-3 text-sm">
                      <div>
                        <div className="font-medium">{l.bookTitle}</div>
                        <div className="text-xs text-muted-foreground">{l.borrower} · due {l.dueOn}{l.returnedOn ? ` · returned ${l.returnedOn}` : ""}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={STATUS_VARIANT[st]}>{st}</Badge>
                        {!l.returnedOn ? (
                          <Button size="sm" variant="outline" onClick={() => returnLoan(l.id)}>Return</Button>
                        ) : null}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
