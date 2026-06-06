"use client"

import { useState, useTransition } from "react"
import { ASSEMBLY_THEMES, assemblySummary, type Assembly } from "@/lib/assembly"
import { createAssemblyAction } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function AssemblyBoard({ initial = [] }: { initial?: Assembly[] }) {
  const [items, setItems] = useState<Assembly[]>(initial)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [cls, setCls] = useState("")
  const [theme, setTheme] = useState(ASSEMBLY_THEMES[0])
  const [conductedBy, setConductedBy] = useState("")
  const [thought, setThought] = useState("")
  const [, startTransition] = useTransition()

  const s = assemblySummary(items)

  function add() {
    if (!cls.trim()) return
    const optimistic: Assembly = { id: `as-${Date.now()}`, date, cls: cls.trim(), theme, conductedBy: conductedBy.trim() || "—", thought: thought.trim() }
    setItems((prev) => [optimistic, ...prev])
    startTransition(async () => {
      const saved = await createAssemblyAction({ date: optimistic.date, cls: optimistic.cls, theme: optimistic.theme, conductedBy: optimistic.conductedBy, thought: optimistic.thought })
      if (saved) setItems((prev) => prev.map((a) => (a.id === optimistic.id ? saved : a)))
    })
    setCls("")
    setConductedBy("")
    setThought("")
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Assemblies logged</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Classes led</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.classes}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Themes covered</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.themes}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Days</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.days}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader><CardTitle>Log today&apos;s assembly</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="d">Date</Label><Input id="d" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="c">Class leading</Label><Input id="c" value={cls} onChange={(e) => setCls(e.target.value)} placeholder="e.g. 8B" /></div>
            <div className="space-y-1.5">
              <Label>Theme</Label>
              <select value={theme} onChange={(e) => setTheme(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {ASSEMBLY_THEMES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1.5"><Label htmlFor="cb">Conducted by</Label><Input id="cb" value={conductedBy} onChange={(e) => setConductedBy(e.target.value)} placeholder="Teacher / student in charge" /></div>
            <div className="space-y-1.5"><Label htmlFor="th">Thought for the day</Label><Input id="th" value={thought} onChange={(e) => setThought(e.target.value)} placeholder="e.g. Service before self" /></div>
            <Button onClick={add} disabled={!cls.trim()} className="w-full">Log assembly</Button>
            <p className="text-xs text-muted-foreground">A rotating class-led assembly (Bal Sabha) builds student voice and value education.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Assembly log ({items.length})</CardTitle></CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No assemblies logged yet.</p>
            ) : (
              <ul className="space-y-2">
                {items.map((a) => (
                  <li key={a.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Class {a.cls}</span>
                      <Badge variant="outline">{a.theme}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{a.date} · led by {a.conductedBy}{a.thought ? ` · “${a.thought}”` : ""}</p>
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
