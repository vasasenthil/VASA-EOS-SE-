"use client"

import { useState } from "react"
import { SAMPLE_CPD, cpdSummary, newCpdId, type CpdMode, type CpdRecord } from "@/lib/cpd"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

export function CpdTracker() {
  const [records, setRecords] = useState<CpdRecord[]>(SAMPLE_CPD)
  const [title, setTitle] = useState("")
  const [provider, setProvider] = useState("")
  const [hours, setHours] = useState(1)
  const [date, setDate] = useState("")
  const [mode, setMode] = useState<CpdMode>("online")

  const summary = cpdSummary(records)

  function add() {
    if (!title.trim()) return
    setRecords((r) => [{ id: newCpdId(), title: title.trim(), provider: provider.trim(), hours, date, mode }, ...r])
    setTitle("")
    setProvider("")
    setHours(1)
    setDate("")
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
      <Card>
        <CardHeader>
          <CardTitle>Log CPD activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="t">Title</Label>
            <Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. NISHTHA module" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p">Provider</Label>
            <Input id="p" value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="DIKSHA / SCERT / DIET" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="h">Hours</Label>
              <Input id="h" type="number" min={0} value={hours} onChange={(e) => setHours(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d">Date</Label>
              <Input id="d" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Mode</Label>
            <select value={mode} onChange={(e) => setMode(e.target.value as CpdMode)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="blended">Blended</option>
            </select>
          </div>
          <Button onClick={add} disabled={!title.trim()} className="w-full">Add CPD</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Annual progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold">{summary.totalHours}h</span>
              <span className="text-sm text-muted-foreground">of {summary.required}h required</span>
            </div>
            <Progress value={summary.pct} className="mt-2 h-2" />
            <p className="mt-1 text-xs text-muted-foreground">
              {summary.met ? "NEP annual CPD requirement met ✓" : `${summary.required - summary.totalHours}h to go`}
            </p>
          </div>
          <ul className="space-y-2">
            {records.map((r) => (
              <li key={r.id} className="rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{r.title}</span>
                  <Badge variant="outline">{r.hours}h</Badge>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                  {r.provider ? <span>{r.provider}</span> : null}
                  {r.date ? <span>{r.date}</span> : null}
                  <span className="capitalize">{r.mode}</span>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
