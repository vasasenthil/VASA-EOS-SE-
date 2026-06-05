"use client"

import { useState } from "react"
import { SF_CATEGORIES, SF_SHORTLIST_CUTOFF, sfSummary, isShortlisted, type SfProject } from "@/lib/sciencefair"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ScienceFairBoard() {
  const [projects, setProjects] = useState<SfProject[]>([])
  const [title, setTitle] = useState("")
  const [student, setStudent] = useState("")
  const [cls, setCls] = useState("")
  const [category, setCategory] = useState(SF_CATEGORIES[0])

  const s = sfSummary(projects)

  function add() {
    if (!title.trim() || !student.trim()) return
    setProjects((prev) => [
      { id: `sf-${Date.now()}`, title: title.trim(), student: student.trim(), cls: cls.trim() || "—", category, score: 0, judged: false },
      ...prev,
    ])
    setTitle("")
    setStudent("")
    setCls("")
  }

  function judge(id: string, score: number) {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, score, judged: true } : p)))
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Projects</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Judged</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.judged}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Shortlisted</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.shortlisted}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Avg score</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.avgScore}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader><CardTitle>Register a project</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="t">Project title</Label><Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Low-cost water filter" /></div>
            <div className="space-y-1.5"><Label htmlFor="st">Student</Label><Input id="st" value={student} onChange={(e) => setStudent(e.target.value)} placeholder="Student name" /></div>
            <div className="space-y-1.5"><Label htmlFor="c">Class / section</Label><Input id="c" value={cls} onChange={(e) => setCls(e.target.value)} placeholder="e.g. 9A" /></div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {SF_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <Button onClick={add} disabled={!title.trim() || !student.trim()} className="w-full">Register project</Button>
            <p className="text-xs text-muted-foreground">Projects scoring {SF_SHORTLIST_CUTOFF}+ are auto-shortlisted for the next level (district / INSPIRE Awards).</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Projects ({projects.length})</CardTitle></CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No projects registered yet.</p>
            ) : (
              <ul className="space-y-2">
                {projects.map((p) => (
                  <li key={p.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{p.title}</span>
                      {isShortlisted(p) ? <Badge>Shortlisted</Badge> : p.judged ? <Badge variant="secondary">Scored {p.score}</Badge> : <Badge variant="outline">Pending</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{p.student} · {p.cls} · {p.category}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <input type="range" min={0} max={100} value={p.score} onChange={(e) => judge(p.id, Number(e.target.value))} className="flex-1" aria-label={`Score ${p.title}`} />
                      <span className="w-8 text-right text-xs tabular-nums">{p.score}</span>
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
