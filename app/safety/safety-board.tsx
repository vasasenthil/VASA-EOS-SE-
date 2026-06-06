"use client"

import { useState, useTransition } from "react"
import {
  SAFETY_CATEGORIES,
  nextSafetyStatus,
  safetySummary,
  type SafetyConcern,
} from "@/lib/safety"
import { createConcernAction, advanceConcernAction } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const STATUS_VARIANT: Record<SafetyConcern["status"], "secondary" | "outline" | "default"> = {
  reported: "secondary",
  under_review: "outline",
  resolved: "default",
}

const STATUS_LABEL: Record<SafetyConcern["status"], string> = {
  reported: "Reported",
  under_review: "Under review",
  resolved: "Resolved",
}

export function SafetyBoard({ initial = [] }: { initial?: SafetyConcern[] }) {
  const [concerns, setConcerns] = useState<SafetyConcern[]>(initial)
  const [category, setCategory] = useState(SAFETY_CATEGORIES[0])
  const [description, setDescription] = useState("")
  const [action, setAction] = useState("")
  const [, startTransition] = useTransition()

  const s = safetySummary(concerns)

  function add() {
    if (!description.trim()) return
    const optimistic: SafetyConcern = {
      id: `sc-${Date.now()}`,
      category,
      description: description.trim(),
      action: action.trim(),
      status: "reported",
      date: new Date().toISOString().slice(0, 10),
    }
    // Optimistic insert; reconcile with the persisted record (real id) when it returns.
    setConcerns((prev) => [optimistic, ...prev])
    startTransition(async () => {
      const saved = await createConcernAction({
        category: optimistic.category,
        description: optimistic.description,
        action: optimistic.action,
      })
      if (saved) setConcerns((prev) => prev.map((c) => (c.id === optimistic.id ? saved : c)))
    })
    setDescription("")
    setAction("")
  }

  function advance(id: string) {
    // Optimistic advance; persist in the background.
    setConcerns((prev) => prev.map((c) => (c.id === id ? { ...c, status: nextSafetyStatus(c.status) } : c)))
    startTransition(async () => {
      const saved = await advanceConcernAction(id)
      if (saved) setConcerns((prev) => prev.map((c) => (c.id === id ? saved : c)))
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Concerns logged</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Open</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.open}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.resolved}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Anti-ragging</CardTitle></CardHeader><CardContent><div className={`text-2xl font-bold ${s.antiRagging > 0 ? "text-destructive" : ""}`}>{s.antiRagging}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader><CardTitle>Log a safety concern</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {SAFETY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5"><Label htmlFor="d">Description</Label><Textarea id="d" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What happened, who is involved, where" /></div>
            <div className="space-y-1.5"><Label htmlFor="a">Action taken / planned</Label><Input id="a" value={action} onChange={(e) => setAction(e.target.value)} placeholder="e.g. Committee notified, counselling arranged" /></div>
            <Button onClick={add} disabled={!description.trim()} className="w-full">Log concern</Button>
            <p className="text-xs text-muted-foreground">Confidential. POCSO/POSH concerns route to the statutory committee; production masks the reporter.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Committee log ({concerns.length})</CardTitle></CardHeader>
          <CardContent>
            {concerns.length === 0 ? (
              <p className="text-sm text-muted-foreground">No concerns logged yet.</p>
            ) : (
              <ul className="space-y-2">
                {concerns.map((c) => (
                  <li key={c.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{c.category}</span>
                      <Badge variant={STATUS_VARIANT[c.status]}>{STATUS_LABEL[c.status]}</Badge>
                    </div>
                    <p className="mt-1 text-muted-foreground">{c.description}</p>
                    {c.action ? <p className="mt-1 text-xs text-muted-foreground">Action: {c.action}</p> : null}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{c.date}</span>
                      {c.status !== "resolved" ? (
                        <Button size="sm" variant="outline" onClick={() => advance(c.id)}>
                          {c.status === "reported" ? "Start review" : "Mark resolved"}
                        </Button>
                      ) : null}
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
