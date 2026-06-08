"use client"

import { useState, useTransition } from "react"
import { bankingSummary, applyTxn, inr, type Account } from "@/lib/banking"
import { openAccountAction, transactAction } from "./actions"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function BankingBoard({ initial = [] }: { initial?: Account[] }) {
  const [accounts, setAccounts] = useState<Account[]>(initial)
  const [student, setStudent] = useState("")
  const [cls, setCls] = useState("")
  const [opening, setOpening] = useState(0)
  const [amount, setAmount] = useState(10)
  const [, startTransition] = useTransition()

  const s = bankingSummary(accounts)

  function open() {
    if (!student.trim() || opening < 0) return
    const optimistic: Account = { id: `ac-${Date.now()}`, student: student.trim(), cls: cls.trim() || "—", balance: opening, tenantId: DEFAULT_SCHOOL_NODE }
    setAccounts((prev) => [optimistic, ...prev])
    startTransition(async () => {
      const saved = await openAccountAction({ student: optimistic.student, cls: optimistic.cls, opening: optimistic.balance })
      if (saved) setAccounts((prev) => prev.map((a) => (a.id === optimistic.id ? saved : a)))
    })
    setStudent("")
    setCls("")
    setOpening(0)
  }

  function txn(id: string, kind: "deposit" | "withdraw") {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, balance: applyTxn(a.balance, kind, amount) } : a)))
    startTransition(async () => {
      const saved = await transactAction(id, kind, amount)
      if (saved) setAccounts((prev) => prev.map((a) => (a.id === id ? saved : a)))
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Accounts</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.accounts}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total savings</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{inr(s.totalSavings)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Avg balance</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{inr(s.avgBalance)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active savers</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.activeSavers}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader><CardTitle>Open a savings account</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="st">Student</Label><Input id="st" value={student} onChange={(e) => setStudent(e.target.value)} placeholder="Student name" /></div>
            <div className="space-y-1.5"><Label htmlFor="c">Class / section</Label><Input id="c" value={cls} onChange={(e) => setCls(e.target.value)} placeholder="e.g. 6A" /></div>
            <div className="space-y-1.5"><Label htmlFor="op">Opening balance (₹)</Label><Input id="op" type="number" min={0} value={opening} onChange={(e) => setOpening(Number(e.target.value))} /></div>
            <Button onClick={open} disabled={!student.trim()} className="w-full">Open account</Button>
            <div className="space-y-1.5 border-t pt-3"><Label htmlFor="am">Transaction amount (₹)</Label><Input id="am" type="number" min={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></div>
            <p className="text-xs text-muted-foreground">A school savings bank teaches financial literacy; withdrawals never overdraw a child&apos;s balance.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Passbooks ({accounts.length})</CardTitle></CardHeader>
          <CardContent>
            {accounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No accounts opened yet.</p>
            ) : (
              <ul className="space-y-2">
                {accounts.map((a) => (
                  <li key={a.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{a.student} <span className="text-xs text-muted-foreground">· {a.cls}</span></span>
                      <Badge variant={a.balance > 0 ? "default" : "outline"}>{inr(a.balance)}</Badge>
                    </div>
                    <div className="mt-2 flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => txn(a.id, "deposit")}>Deposit {inr(amount)}</Button>
                      <Button size="sm" variant="outline" onClick={() => txn(a.id, "withdraw")}>Withdraw {inr(amount)}</Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
