"use client"

import { useState, useTransition } from "react"
import { OOSC_REASONS, nextOoscStatus, ooscSummary, type OoscChild } from "@/lib/oosc"
import { createChildAction, advanceChildAction } from "./actions"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

const STATUS_VARIANT: Record<OoscChild["status"], "destructive" | "secondary" | "outline" | "default"> = {
  identified: "destructive",
  enrolled: "secondary",
  bridging: "outline",
  mainstreamed: "default",
}

const NEXT_LABEL: Record<OoscChild["status"], string> = {
  identified: "Enrol",
  enrolled: "Start bridge course",
  bridging: "Mainstream",
  mainstreamed: "Mainstreamed",
}

export function OoscBoard({ initial = [] }: { initial?: OoscChild[] }) {
  const [children, setChildren] = useState<OoscChild[]>(initial)
  const [name, setName] = useState("")
  const [age, setAge] = useState(9)
  const [reason, setReason] = useState(OOSC_REASONS[0])
  const [targetClass, setTargetClass] = useState("")
  const [, startTransition] = useTransition()

  const s = ooscSummary(children)

  function add() {
    if (!name.trim()) return
    const optimistic: OoscChild = {
      id: `oo-${Date.now()}`,
      name: name.trim(),
      age,
      reason,
      status: "identified",
      targetClass: targetClass.trim() || "—",
      tenantId: DEFAULT_SCHOOL_NODE,
    }
    setChildren((prev) => [optimistic, ...prev])
    startTransition(async () => {
      const saved = await createChildAction({ name: optimistic.name, age: optimistic.age, reason: optimistic.reason, targetClass: optimistic.targetClass })
      if (saved) setChildren((prev) => prev.map((c) => (c.id === optimistic.id ? saved : c)))
    })
    setName("")
    setTargetClass("")
  }

  function advance(id: string) {
    setChildren((prev) => prev.map((c) => (c.id === id ? { ...c, status: nextOoscStatus(c.status) } : c)))
    startTransition(async () => {
      const saved = await advanceChildAction(id)
      if (saved) setChildren((prev) => prev.map((c) => (c.id === id ? saved : c)))
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Children tracked</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Newly identified</CardTitle></CardHeader><CardContent><div className={`text-2xl font-bold ${s.identified > 0 ? "text-destructive" : ""}`}>{s.identified}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">In bridge course</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.bridging}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Mainstreamed</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.mainstreamPct}%</div><Progress value={Math.min(100, s.mainstreamPct)} className="mt-2 h-1.5" /></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader><CardTitle>Identify out-of-school child</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="n">Child name</Label><Input id="n" value={name} onChange={(e) => setName(e.target.value)} placeholder="Child name" /></div>
            <div className="space-y-1.5"><Label htmlFor="a">Age</Label><Input id="a" type="number" min={3} max={18} value={age} onChange={(e) => setAge(Number(e.target.value))} /></div>
            <div className="space-y-1.5">
              <Label>Reason out of school</Label>
              <select value={reason} onChange={(e) => setReason(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {OOSC_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="space-y-1.5"><Label htmlFor="t">Age-appropriate target class</Label><Input id="t" value={targetClass} onChange={(e) => setTargetClass(e.target.value)} placeholder="e.g. 4" /></div>
            <Button onClick={add} disabled={!name.trim()} className="w-full">Add child</Button>
            <p className="text-xs text-muted-foreground">Samagra Shiksha: identify, enrol in a special-training bridge course, then mainstream into the age-appropriate class.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Mainstreaming tracker ({children.length})</CardTitle></CardHeader>
          <CardContent>
            {children.length === 0 ? (
              <p className="text-sm text-muted-foreground">No children tracked yet.</p>
            ) : (
              <ul className="space-y-2">
                {children.map((c) => (
                  <li key={c.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{c.name} <span className="text-xs text-muted-foreground">· age {c.age}</span></span>
                      <Badge variant={STATUS_VARIANT[c.status]}>{c.status}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{c.reason} · target class {c.targetClass}</p>
                    {c.status !== "mainstreamed" ? (
                      <div className="mt-2 flex justify-end">
                        <Button size="sm" variant="outline" onClick={() => advance(c.id)}>{NEXT_LABEL[c.status]}</Button>
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
