"use client"

import { useState } from "react"
import { SIS_ROSTER } from "@/lib/sis"
import { READING_LEVELS, nextReadingLevel, remedialSummary, type ReadingLevel, type RemedialStudent } from "@/lib/remedial"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

const LEVEL_VARIANT: Record<ReadingLevel, "destructive" | "secondary" | "default"> = {
  Beginner: "destructive",
  Letter: "destructive",
  Word: "secondary",
  Paragraph: "secondary",
  Story: "default",
}

export function RemedialBoard() {
  const [students, setStudents] = useState<RemedialStudent[]>([])
  const [pick, setPick] = useState(SIS_ROSTER[0]?.name ?? "")
  const [level, setLevel] = useState<ReadingLevel>("Beginner")

  const s = remedialSummary(students)

  function enrol() {
    setStudents((prev) => [{ id: `rm-${Date.now()}`, name: pick, level }, ...prev.filter((x) => x.name !== pick)])
  }
  function levelUp(id: string) {
    setStudents((prev) => prev.map((x) => (x.id === id ? { ...x, level: nextReadingLevel(x.level) } : x)))
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">In remedial</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Needs support</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.needsSupport}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">At Story level</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.atStory}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Avg level (0-4)</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.avgIndex}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader><CardTitle>Enrol into remedial</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Student</Label>
              <select value={pick} onChange={(e) => setPick(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {SIS_ROSTER.map((x) => <option key={x.apaarId} value={x.name}>{x.name} — {x.className}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Starting reading level</Label>
              <select value={level} onChange={(e) => setLevel(e.target.value as ReadingLevel)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {READING_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <Button onClick={enrol} className="w-full">Enrol</Button>
            <p className="text-xs text-muted-foreground">Ennum Ezhuthum ladder: Beginner → Letter → Word → Paragraph → Story.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Remedial group ({students.length})</CardTitle></CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <p className="text-sm text-muted-foreground">No students enrolled yet.</p>
            ) : (
              <ul className="space-y-2">
                {students.map((x) => (
                  <li key={x.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <span className="font-medium">{x.name}</span>
                    <span className="flex items-center gap-2">
                      <Badge variant={LEVEL_VARIANT[x.level]}>{x.level}</Badge>
                      {x.level !== "Story" ? <Button size="sm" variant="outline" onClick={() => levelUp(x.id)}>Level up</Button> : <Badge>proficient</Badge>}
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
