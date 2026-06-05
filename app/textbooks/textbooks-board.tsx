"use client"

import { useState } from "react"
import { textbookSummary, pendingOf, type Indent } from "@/lib/textbooks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

export function TextbooksBoard() {
  const [indents, setIndents] = useState<Indent[]>([])
  const [cls, setCls] = useState("")
  const [subject, setSubject] = useState("")
  const [required, setRequired] = useState(50)

  const s = textbookSummary(indents)

  function add() {
    if (!cls.trim() || !subject.trim() || required <= 0) return
    setIndents((prev) => [{ id: `tb-${Date.now()}`, cls: cls.trim(), subject: subject.trim(), required, received: 0 }, ...prev])
    setSubject("")
  }

  function receive(id: string, qty: number) {
    setIndents((prev) => prev.map((i) => (i.id === id ? { ...i, received: Math.max(0, i.received + qty) } : i)))
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Title lines</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.titles}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Required</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.required}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle></CardHeader><CardContent><div className={`text-2xl font-bold ${s.pending > 0 ? "text-destructive" : ""}`}>{s.pending}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Fulfilment</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.fulfilmentPct}%</div><Progress value={s.fulfilmentPct} className="mt-2 h-1.5" /></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader><CardTitle>Raise an indent</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="c">Class</Label><Input id="c" value={cls} onChange={(e) => setCls(e.target.value)} placeholder="e.g. 5" /></div>
            <div className="space-y-1.5"><Label htmlFor="su">Subject / title</Label><Input id="su" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Mathematics Term 1" /></div>
            <div className="space-y-1.5"><Label htmlFor="rq">Copies required</Label><Input id="rq" type="number" min={1} value={required} onChange={(e) => setRequired(Number(e.target.value))} /></div>
            <Button onClick={add} disabled={!cls.trim() || !subject.trim() || required <= 0} className="w-full">Raise indent</Button>
            <p className="text-xs text-muted-foreground">Free-textbook scheme: indent by class, record receipts, and watch pending copies to plan distribution day.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Indents ({indents.length})</CardTitle></CardHeader>
          <CardContent>
            {indents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No indents raised yet.</p>
            ) : (
              <ul className="space-y-2">
                {indents.map((i) => (
                  <li key={i.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Class {i.cls} · {i.subject}</span>
                      {pendingOf(i) === 0 ? <Badge>Fulfilled</Badge> : <Badge variant="secondary">{pendingOf(i)} pending</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{i.received}/{i.required} received</p>
                    <div className="mt-2">
                      <Progress value={Math.round((Math.min(i.received, i.required) / i.required) * 100)} className="h-1.5" />
                    </div>
                    {pendingOf(i) > 0 ? (
                      <div className="mt-2 flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => receive(i.id, 10)}>+10 received</Button>
                        <Button size="sm" variant="outline" onClick={() => receive(i.id, pendingOf(i))}>Receive all</Button>
                      </div>
                    ) : null}
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
