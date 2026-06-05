"use client"

import { useState } from "react"
import { WATER_SOURCES, isPhSafe, waterSummary, type WaterTest, type WaterResult } from "@/lib/water"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

export function WaterBoard() {
  const [tests, setTests] = useState<WaterTest[]>([])
  const [source, setSource] = useState(WATER_SOURCES[0])
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [ph, setPh] = useState(7)
  const [remarks, setRemarks] = useState("")

  const s = waterSummary(tests)
  const phSafe = isPhSafe(ph)

  function add() {
    const result: WaterResult = phSafe ? "safe" : "unsafe"
    setTests((prev) => [
      { id: `wt-${Date.now()}`, source, date, ph, result, remarks: remarks.trim() },
      ...prev,
    ])
    setRemarks("")
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Tests logged</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.tests}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Safe</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.safe}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Unsafe</CardTitle></CardHeader><CardContent><div className={`text-2xl font-bold ${s.unsafe > 0 ? "text-destructive" : ""}`}>{s.unsafe}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Safe rate</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.safePct}%</div><Progress value={s.safePct} className="mt-2 h-1.5" /></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader><CardTitle>Log a water-quality test</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Source</Label>
              <select value={source} onChange={(e) => setSource(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {WATER_SOURCES.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div className="space-y-1.5"><Label htmlFor="d">Test date</Label><Input id="d" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div className="space-y-1.5">
              <Label htmlFor="ph">pH value</Label>
              <Input id="ph" type="number" step="0.1" min={0} max={14} value={ph} onChange={(e) => setPh(Number(e.target.value))} />
              <p className={`text-xs ${phSafe ? "text-emerald-600" : "text-destructive"}`}>
                {phSafe ? "Within IS 10500 safe range (6.5–8.5)" : "Outside safe pH range (6.5–8.5)"}
              </p>
            </div>
            <div className="space-y-1.5"><Label htmlFor="r">Remarks</Label><Input id="r" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Turbidity, colour, action taken" /></div>
            <Button onClick={add} className="w-full">Record test</Button>
            <p className="text-xs text-muted-foreground">Swachh Vidyalaya: drinking water should be tested periodically; unsafe results trigger corrective action.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Test log ({tests.length})</CardTitle></CardHeader>
          <CardContent>
            {tests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tests logged yet.</p>
            ) : (
              <ul className="space-y-2">
                {tests.map((t) => (
                  <li key={t.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{t.source}</span>
                      <Badge variant={t.result === "safe" ? "default" : "destructive"}>{t.result}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">pH {t.ph} · {t.date}{t.remarks ? ` · ${t.remarks}` : ""}</p>
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
