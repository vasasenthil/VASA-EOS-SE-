"use client"

import { useState, useTransition } from "react"
import { CADRES, vacancySummary, vacancyOf, type PostLine } from "@/lib/vacancy"
import { createLineAction } from "./actions"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

export function VacancyBoard({ initial = [] }: { initial?: PostLine[] }) {
  const [lines, setLines] = useState<PostLine[]>(initial)
  const [subject, setSubject] = useState(CADRES[0])
  const [sanctioned, setSanctioned] = useState(1)
  const [working, setWorking] = useState(1)
  const [, startTransition] = useTransition()

  const s = vacancySummary(lines)

  function add() {
    if (sanctioned < 0 || working < 0) return
    const optimistic: PostLine = { id: `pl-${Date.now()}`, subject, sanctioned, working, tenantId: DEFAULT_SCHOOL_NODE }
    setLines((prev) => [optimistic, ...prev])
    startTransition(async () => {
      const saved = await createLineAction({ subject: optimistic.subject, sanctioned: optimistic.sanctioned, working: optimistic.working })
      if (saved) setLines((prev) => prev.map((l) => (l.id === optimistic.id ? saved : l)))
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Sanctioned</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.sanctioned}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Working</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.working}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Vacancies</CardTitle></CardHeader><CardContent><div className={`text-2xl font-bold ${s.vacancies > 0 ? "text-destructive" : ""}`}>{s.vacancies}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Surplus</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.surplus}</div><Progress value={s.fillPct} className="mt-2 h-1.5" /></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader><CardTitle>Add a post line</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Cadre / subject</Label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {CADRES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5"><Label htmlFor="sa">Sanctioned</Label><Input id="sa" type="number" min={0} value={sanctioned} onChange={(e) => setSanctioned(Number(e.target.value))} /></div>
              <div className="space-y-1.5"><Label htmlFor="wo">Working</Label><Input id="wo" type="number" min={0} value={working} onChange={(e) => setWorking(Number(e.target.value))} /></div>
            </div>
            <Button onClick={add} className="w-full">Add line</Button>
            <p className="text-xs text-muted-foreground">Rationalisation maps sanctioned vs working strength; vacancies feed recruitment and surplus feeds redeployment.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Post-wise position ({lines.length})</CardTitle></CardHeader>
          <CardContent>
            {lines.length === 0 ? (
              <p className="text-sm text-muted-foreground">No post lines added yet.</p>
            ) : (
              <ul className="space-y-2">
                {lines.map((l) => {
                  const gap = vacancyOf(l)
                  return (
                    <li key={l.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                      <span>
                        <span className="font-medium">{l.subject}</span>
                        <span className="block text-xs text-muted-foreground">{l.working}/{l.sanctioned} posted</span>
                      </span>
                      {gap > 0 ? <Badge variant="destructive">{gap} vacant</Badge> : gap < 0 ? <Badge variant="secondary">{-gap} surplus</Badge> : <Badge>Full</Badge>}
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
