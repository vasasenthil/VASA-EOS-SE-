"use client"

import { useState, useTransition } from "react"
import { consumptionPct, leakageFlag, mdmSummary, type MdmEntry } from "@/lib/mdm"
import { recordEntryAction } from "./actions"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const TODAY = new Date().toISOString().slice(0, 10)

export function MdmRegister({ initial = [] }: { initial?: MdmEntry[] }) {
  const [entries, setEntries] = useState<MdmEntry[]>(initial)
  const [date, setDate] = useState(TODAY)
  const [enrolment, setEnrolment] = useState(60)
  const [present, setPresent] = useState(54)
  const [mealsServed, setMealsServed] = useState(54)
  const [menu, setMenu] = useState("Sambar rice, egg, banana")
  const [, startTransition] = useTransition()

  const s = mdmSummary(entries)

  function record() {
    const optimistic: MdmEntry = { id: `m-${Date.now()}`, date, enrolment, present, mealsServed, menu: menu.trim(), tenantId: DEFAULT_SCHOOL_NODE }
    setEntries((prev) => [optimistic, ...prev])
    startTransition(async () => {
      const saved = await recordEntryAction({ date, enrolment, present, mealsServed, menu: optimistic.menu })
      if (saved) setEntries((prev) => prev.map((e) => (e.id === optimistic.id ? saved : e)))
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Days logged</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.days}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total meals</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.totalMeals}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Avg consumption</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.avgConsumptionPct}%</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Leakage days</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.leakageDays}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader><CardTitle>Daily register</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="d">Date</Label><Input id="d" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5"><Label htmlFor="en">Enrolled</Label><Input id="en" type="number" min={0} value={enrolment} onChange={(e) => setEnrolment(Number(e.target.value))} /></div>
              <div className="space-y-1.5"><Label htmlFor="pr">Present</Label><Input id="pr" type="number" min={0} value={present} onChange={(e) => setPresent(Number(e.target.value))} /></div>
              <div className="space-y-1.5"><Label htmlFor="ms">Served</Label><Input id="ms" type="number" min={0} value={mealsServed} onChange={(e) => setMealsServed(Number(e.target.value))} /></div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="mn">Menu</Label><Input id="mn" value={menu} onChange={(e) => setMenu(e.target.value)} /></div>
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              Consumption: <span className="font-medium">{consumptionPct(present, mealsServed)}%</span>
              {leakageFlag(present, mealsServed) ? <span className="ml-2 text-destructive">⚠ leakage (served &gt; present)</span> : null}
            </div>
            <Button onClick={record} className="w-full">Record day</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Register ({entries.length})</CardTitle></CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No days recorded yet.</p>
            ) : (
              <ul className="space-y-2">
                {entries.map((e) => (
                  <li key={e.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{e.date}</span>
                      <span className="flex items-center gap-2">
                        <Badge variant="outline">{consumptionPct(e.present, e.mealsServed)}%</Badge>
                        {leakageFlag(e.present, e.mealsServed) ? <Badge variant="destructive">leakage</Badge> : <Badge>ok</Badge>}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                      <span>present {e.present}/{e.enrolment}</span>
                      <span>served {e.mealsServed}</span>
                      {e.menu ? <span>· {e.menu}</span> : null}
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
