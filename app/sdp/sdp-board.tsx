"use client"

import { useState } from "react"
import { SDP_HEADS, TOTAL_GRANT, sdpSummary, inr, type SdpPriority } from "@/lib/sdp"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

export function SdpBoard() {
  const [priorities, setPriorities] = useState<SdpPriority[]>([])
  const [title, setTitle] = useState("")
  const [head, setHead] = useState(SDP_HEADS[0])
  const [amount, setAmount] = useState(50000)

  const s = sdpSummary(priorities)

  function add() {
    if (!title.trim() || amount <= 0) return
    setPriorities((prev) => [{ id: `sp-${Date.now()}`, title: title.trim(), head, amount }, ...prev])
    setTitle("")
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Grant</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{inr(TOTAL_GRANT)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Allocated</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{inr(s.allocated)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Balance</CardTitle></CardHeader><CardContent><div className={`text-2xl font-bold ${s.overBudget ? "text-destructive" : ""}`}>{inr(s.balance)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Utilisation</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.utilisationPct}%</div><Progress value={Math.min(100, s.utilisationPct)} className="mt-2 h-1.5" /></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader><CardTitle>Add SDP priority</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="t">Priority / activity</Label><Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Repair Class 7 roof" /></div>
            <div className="space-y-1.5">
              <Label>Budget head</Label>
              <select value={head} onChange={(e) => setHead(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {SDP_HEADS.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div className="space-y-1.5"><Label htmlFor="a">Amount (₹)</Label><Input id="a" type="number" min={0} value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></div>
            {s.overBudget ? <p className="text-xs text-destructive">Allocation exceeds the grant.</p> : null}
            <Button onClick={add} disabled={!title.trim() || amount <= 0} className="w-full">Add priority</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Plan ({priorities.length})</CardTitle></CardHeader>
          <CardContent>
            {priorities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No priorities added yet.</p>
            ) : (
              <ul className="space-y-2">
                {priorities.map((p) => (
                  <li key={p.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <span>
                      <span className="font-medium">{p.title}</span>
                      <span className="block text-xs text-muted-foreground">{p.head}</span>
                    </span>
                    <Badge variant="outline">{inr(p.amount)}</Badge>
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
