"use client"

import { useState, useTransition } from "react"
import { COOK_ROLES, cookSummary, inr, type Cook, type CookRole } from "@/lib/cooks"
import { createCookAction, setCookPresenceAction } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function CooksBoard({ initial = [] }: { initial?: Cook[] }) {
  const [cooks, setCooks] = useState<Cook[]>(initial)
  const [name, setName] = useState("")
  const [role, setRole] = useState<CookRole>(COOK_ROLES[0])
  const [honorarium, setHonorarium] = useState(1000)
  const [, startTransition] = useTransition()

  const s = cookSummary(cooks)

  function add() {
    if (!name.trim() || honorarium < 0) return
    const optimistic: Cook = { id: `ck-${Date.now()}`, name: name.trim(), role, honorarium, present: true }
    setCooks((prev) => [optimistic, ...prev])
    startTransition(async () => {
      const saved = await createCookAction({ name: optimistic.name, role: optimistic.role, honorarium: optimistic.honorarium })
      if (saved) setCooks((prev) => prev.map((c) => (c.id === optimistic.id ? saved : c)))
    })
    setName("")
  }

  function toggle(id: string) {
    let nextPresent = true
    setCooks((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c
        nextPresent = !c.present
        return { ...c, present: nextPresent }
      }),
    )
    startTransition(async () => {
      const saved = await setCookPresenceAction(id, nextPresent)
      if (saved) setCooks((prev) => prev.map((c) => (c.id === id ? saved : c)))
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Staff</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Present today</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.present}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Absent</CardTitle></CardHeader><CardContent><div className={`text-2xl font-bold ${s.absent > 0 ? "text-destructive" : ""}`}>{s.absent}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Honoraria / month</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{inr(s.honorariumTotal)}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader><CardTitle>Add kitchen staff</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="n">Name</Label><Input id="n" value={name} onChange={(e) => setName(e.target.value)} placeholder="Staff member name" /></div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <select value={role} onChange={(e) => setRole(e.target.value as CookRole)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {COOK_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="space-y-1.5"><Label htmlFor="h">Honorarium (₹/month)</Label><Input id="h" type="number" min={0} value={honorarium} onChange={(e) => setHonorarium(Number(e.target.value))} /></div>
            <Button onClick={add} disabled={!name.trim()} className="w-full">Add staff</Button>
            <p className="text-xs text-muted-foreground">PM POSHAN honoraria are cost-shared (Centre/State); production links to DBT payout.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Kitchen roster ({cooks.length})</CardTitle></CardHeader>
          <CardContent>
            {cooks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No staff added yet.</p>
            ) : (
              <ul className="space-y-2">
                {cooks.map((c) => (
                  <li key={c.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <span>
                      <span className="font-medium">{c.name}</span>
                      <span className="block text-xs text-muted-foreground">{c.role} · {inr(c.honorarium)}/mo</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Badge variant={c.present ? "default" : "destructive"}>{c.present ? "Present" : "Absent"}</Badge>
                      <Button size="sm" variant="outline" onClick={() => toggle(c.id)}>Toggle</Button>
                    </span>
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
