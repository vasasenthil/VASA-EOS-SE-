"use client"

import { useState } from "react"
import { newHwId, nextHwStatus, homeworkSummary, isHwOverdue, type Homework, type HomeworkStatus } from "@/lib/homework"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const STATUS_VARIANT: Record<HomeworkStatus, "default" | "secondary" | "outline"> = {
  assigned: "outline",
  submitted: "secondary",
  graded: "default",
}
const TODAY = new Date().toISOString().slice(0, 10)

export function HomeworkBoard() {
  const [items, setItems] = useState<Homework[]>([])
  const [subject, setSubject] = useState("")
  const [title, setTitle] = useState("")
  const [dueDate, setDueDate] = useState("")

  const s = homeworkSummary(items, TODAY)

  function assign() {
    if (!subject.trim() || !title.trim()) return
    setItems((prev) => [{ id: newHwId(), subject: subject.trim(), title: title.trim(), dueDate, status: "assigned" }, ...prev])
    setSubject("")
    setTitle("")
    setDueDate("")
  }
  function advance(id: string) {
    setItems((prev) => prev.map((h) => (h.id === id ? { ...h, status: nextHwStatus(h.status) } : h)))
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Assigned</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.assigned}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Submitted</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.submitted}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Graded</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.graded}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.overdue}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader><CardTitle>Assign homework</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="s">Subject</Label><Input id="s" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Science" /></div>
            <div className="space-y-1.5"><Label htmlFor="t">Title</Label><Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Ch. 4 questions" /></div>
            <div className="space-y-1.5"><Label htmlFor="d">Due date</Label><Input id="d" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
            <Button onClick={assign} disabled={!subject.trim() || !title.trim()} className="w-full">Assign</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Homework ({items.length})</CardTitle></CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No homework assigned yet.</p>
            ) : (
              <ul className="space-y-2">
                {items.map((h) => (
                  <li key={h.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{h.title}</span>
                      <span className="flex items-center gap-2">
                        {isHwOverdue(h, TODAY) ? <Badge variant="destructive">overdue</Badge> : null}
                        <Badge variant={STATUS_VARIANT[h.status]}>{h.status}</Badge>
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                      <span>{h.subject}</span>
                      {h.dueDate ? <span>due {h.dueDate}</span> : null}
                    </div>
                    {h.status !== "graded" ? (
                      <Button size="sm" variant="outline" className="mt-2" onClick={() => advance(h.id)}>
                        Mark {nextHwStatus(h.status)}
                      </Button>
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
