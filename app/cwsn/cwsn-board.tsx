"use client"

import { useState, useTransition } from "react"
import { DISABILITY_TYPES, CWSN_SUPPORTS, cwsnSummary, type CwsnStudent } from "@/lib/cwsn"
import { createStudentAction, reviewStudentAction } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function CwsnBoard({ initial = [] }: { initial?: CwsnStudent[] }) {
  const [students, setStudents] = useState<CwsnStudent[]>(initial)
  const [name, setName] = useState("")
  const [cls, setCls] = useState("")
  const [disability, setDisability] = useState(DISABILITY_TYPES[0])
  const [supports, setSupports] = useState<string[]>([])
  const [iepGoal, setIepGoal] = useState("")
  const [, startTransition] = useTransition()

  const s = cwsnSummary(students)

  function toggleSupport(name: string) {
    setSupports((prev) => (prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]))
  }

  function add() {
    if (!name.trim()) return
    const optimistic: CwsnStudent = {
      id: `cw-${Date.now()}`,
      name: name.trim(),
      cls: cls.trim() || "—",
      disability,
      supports,
      iepGoal: iepGoal.trim(),
      reviewed: false,
    }
    setStudents((prev) => [optimistic, ...prev])
    startTransition(async () => {
      const saved = await createStudentAction({
        name: optimistic.name,
        cls: optimistic.cls,
        disability: optimistic.disability,
        supports: optimistic.supports,
        iepGoal: optimistic.iepGoal,
      })
      if (saved) setStudents((prev) => prev.map((x) => (x.id === optimistic.id ? saved : x)))
    })
    setName("")
    setCls("")
    setSupports([])
    setIepGoal("")
  }

  function review(id: string) {
    setStudents((prev) => prev.map((x) => (x.id === id ? { ...x, reviewed: true } : x)))
    startTransition(async () => {
      const saved = await reviewStudentAction(id)
      if (saved) setStudents((prev) => prev.map((x) => (x.id === id ? saved : x)))
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">CWSN students</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">IEP reviewed</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.reviewed}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Review pending</CardTitle></CardHeader><CardContent><div className={`text-2xl font-bold ${s.pending > 0 ? "text-destructive" : ""}`}>{s.pending}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Assistive device</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.withDevice}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader><CardTitle>Register CWSN student</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="n">Student name</Label><Input id="n" value={name} onChange={(e) => setName(e.target.value)} placeholder="Student name" /></div>
            <div className="space-y-1.5"><Label htmlFor="c">Class / section</Label><Input id="c" value={cls} onChange={(e) => setCls(e.target.value)} placeholder="e.g. 5A" /></div>
            <div className="space-y-1.5">
              <Label>Disability type</Label>
              <select value={disability} onChange={(e) => setDisability(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {DISABILITY_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Accommodations</Label>
              <div className="flex flex-wrap gap-1.5">
                {CWSN_SUPPORTS.map((sup) => (
                  <button key={sup} type="button" onClick={() => toggleSupport(sup)} className={`rounded-full border px-2.5 py-1 text-xs ${supports.includes(sup) ? "bg-primary text-primary-foreground" : "bg-background"}`}>{sup}</button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="g">IEP goal</Label><Input id="g" value={iepGoal} onChange={(e) => setIepGoal(e.target.value)} placeholder="e.g. Read 60 wpm by term 2" /></div>
            <Button onClick={add} disabled={!name.trim()} className="w-full">Register student</Button>
            <p className="text-xs text-muted-foreground">Disability data is sensitive; production masks it and limits access to the inclusion cell.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>CWSN register ({students.length})</CardTitle></CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <p className="text-sm text-muted-foreground">No students registered yet.</p>
            ) : (
              <ul className="space-y-2">
                {students.map((st) => (
                  <li key={st.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{st.name} <span className="text-xs text-muted-foreground">· {st.cls}</span></span>
                      <Badge variant={st.reviewed ? "default" : "secondary"}>{st.reviewed ? "IEP reviewed" : "Pending review"}</Badge>
                    </div>
                    <p className="mt-1 text-muted-foreground">{st.disability}</p>
                    {st.supports.length > 0 ? <p className="mt-1 text-xs text-muted-foreground">Supports: {st.supports.join(", ")}</p> : null}
                    {st.iepGoal ? <p className="mt-1 text-xs text-muted-foreground">IEP: {st.iepGoal}</p> : null}
                    {!st.reviewed ? (
                      <div className="mt-2 flex justify-end">
                        <Button size="sm" variant="outline" onClick={() => review(st.id)}>Mark IEP reviewed</Button>
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
