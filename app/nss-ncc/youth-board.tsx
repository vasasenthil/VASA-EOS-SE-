"use client"

import { useState } from "react"
import { YOUTH_WINGS, youthSummary, type Cadet } from "@/lib/youth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function YouthBoard() {
  const [cadets, setCadets] = useState<Cadet[]>([])
  const [name, setName] = useState("")
  const [cls, setCls] = useState("")
  const [wing, setWing] = useState(YOUTH_WINGS[0])

  const s = youthSummary(cadets)

  function add() {
    if (!name.trim()) return
    setCadets((prev) => [{ id: `cd-${Date.now()}`, name: name.trim(), cls: cls.trim() || "—", wing, serviceHours: 0 }, ...prev])
    setName("")
    setCls("")
  }

  function logHours(id: string, hrs: number) {
    setCadets((prev) => prev.map((c) => (c.id === id ? { ...c, serviceHours: c.serviceHours + hrs } : c)))
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Cadets / volunteers</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.cadets}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Wings active</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.wings}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Service hours</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.totalHours}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Avg hours / cadet</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.avgHours}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader><CardTitle>Enrol a cadet</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="n">Name</Label><Input id="n" value={name} onChange={(e) => setName(e.target.value)} placeholder="Cadet / volunteer name" /></div>
            <div className="space-y-1.5"><Label htmlFor="c">Class / section</Label><Input id="c" value={cls} onChange={(e) => setCls(e.target.value)} placeholder="e.g. 9A" /></div>
            <div className="space-y-1.5">
              <Label>Wing</Label>
              <select value={wing} onChange={(e) => setWing(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {YOUTH_WINGS.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <Button onClick={add} disabled={!name.trim()} className="w-full">Enrol cadet</Button>
            <p className="text-xs text-muted-foreground">Service hours build the cadet&apos;s record for NSS/NCC certificates and counsel-of-merit credits.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Cadet register ({cadets.length})</CardTitle></CardHeader>
          <CardContent>
            {cadets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No cadets enrolled yet.</p>
            ) : (
              <ul className="space-y-2">
                {cadets.map((c) => (
                  <li key={c.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <span>
                      <span className="font-medium">{c.name} <span className="text-xs text-muted-foreground">· {c.cls}</span></span>
                      <span className="block text-xs text-muted-foreground">{c.wing} · {c.serviceHours} hrs</span>
                    </span>
                    <span className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => logHours(c.id, 2)}>+2 hrs</Button>
                      <Badge variant="outline">{c.serviceHours}h</Badge>
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
