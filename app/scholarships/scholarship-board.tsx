"use client"

import { useState } from "react"
import { SCHOLARSHIP_LEDGER, nextStatus, scholarshipSummary, inr, type ScholarRow, type ScholarStatus } from "@/lib/scholarship"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const STATUS_VARIANT: Record<ScholarStatus, "default" | "secondary" | "outline"> = {
  eligible: "outline",
  applied: "secondary",
  sanctioned: "secondary",
  disbursed: "default",
}

export function ScholarshipBoard() {
  const [rows, setRows] = useState<ScholarRow[]>(SCHOLARSHIP_LEDGER)
  const s = scholarshipSummary(rows)

  function advance(id: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: nextStatus(r.status) } : r)))
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Beneficiaries</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.beneficiaries}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Sanctioned</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.sanctioned}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Disbursed</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.disbursed}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Amount disbursed</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{inr(s.amountDisbursed)}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Disbursement pipeline</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Beneficiary</TableHead>
                <TableHead>Scheme</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.scheme}</TableCell>
                  <TableCell className="text-right">{inr(r.amount)}</TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    {r.status !== "disbursed" ? (
                      <Button size="sm" variant="outline" onClick={() => advance(r.id)}>Advance</Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
