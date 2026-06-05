"use client"

import { useState } from "react"
import { READING_LEVELS, nextReadingLevel, readingSummary, type Reader, type ReadingLevel } from "@/lib/reading"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

const LEVEL_VARIANT: Record<ReadingLevel, "destructive" | "secondary" | "outline" | "default"> = {
  Beginner: "destructive",
  Letter: "secondary",
  Word: "secondary",
  Paragraph: "outline",
  Story: "default",
}

export function ReadingBoard() {
  const [readers, setReaders] = useState<Reader[]>([])
  const [student, setStudent] = useState("")
  const [cls, setCls] = useState("")
  const [level, setLevel] = useState<ReadingLevel>(READING_LEVELS[0])

  const s = readingSummary(readers)

  function add() {
    if (!student.trim()) return
    setReaders((prev) => [
      { id: `rd-${Date.now()}`, student: student.trim(), cls: cls.trim() || "—", level, booksRead: 0 },
      ...prev,
    ])
    setStudent("")
    setCls("")
  }

  function promote(id: string) {
    setReaders((prev) => prev.map((r) => (r.id === id ? { ...r, level: nextReadingLevel(r.level) } : r)))
  }

  function readBook(id: string) {
    setReaders((prev) => prev.map((r) => (r.id === id ? { ...r, booksRead: r.booksRead + 1 } : r)))
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Readers tracked</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.students}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Fluent (Story)</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.fluent}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Books read</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.booksRead}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Fluency rate</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.fluentPct}%</div><Progress value={s.fluentPct} className="mt-2 h-1.5" /></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader><CardTitle>Add a reader</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="st">Student</Label><Input id="st" value={student} onChange={(e) => setStudent(e.target.value)} placeholder="Student name" /></div>
            <div className="space-y-1.5"><Label htmlFor="c">Class / section</Label><Input id="c" value={cls} onChange={(e) => setCls(e.target.value)} placeholder="e.g. 3A" /></div>
            <div className="space-y-1.5">
              <Label>Current reading band</Label>
              <select value={level} onChange={(e) => setLevel(e.target.value as ReadingLevel)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {READING_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <Button onClick={add} disabled={!student.trim()} className="w-full">Add reader</Button>
            <p className="text-xs text-muted-foreground">NIPUN Bharat goal: every child reads a grade-level story with comprehension by Grade 3.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Reading register ({readers.length})</CardTitle></CardHeader>
          <CardContent>
            {readers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No readers added yet.</p>
            ) : (
              <ul className="space-y-2">
                {readers.map((r) => (
                  <li key={r.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{r.student} <span className="text-xs text-muted-foreground">· {r.cls}</span></span>
                      <Badge variant={LEVEL_VARIANT[r.level]}>{r.level}</Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{r.booksRead} book{r.booksRead === 1 ? "" : "s"} read</span>
                      <span className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => readBook(r.id)}>+1 book</Button>
                        {r.level !== "Story" ? <Button size="sm" variant="outline" onClick={() => promote(r.id)}>Promote band</Button> : null}
                      </span>
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
