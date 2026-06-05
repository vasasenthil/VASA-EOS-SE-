"use client"

import { useState } from "react"
import { CCTV_ZONES, cctvSummary, uncoveredZones, type Camera } from "@/lib/cctv"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

export function CctvBoard() {
  const [cameras, setCameras] = useState<Camera[]>([])
  const [location, setLocation] = useState("")
  const [zone, setZone] = useState(CCTV_ZONES[0])

  const s = cctvSummary(cameras)
  const gaps = uncoveredZones(cameras)

  function add() {
    if (!location.trim()) return
    setCameras((prev) => [
      { id: `cam-${Date.now()}`, location: location.trim(), zone, working: true },
      ...prev,
    ])
    setLocation("")
  }

  function toggle(id: string) {
    setCameras((prev) => prev.map((c) => (c.id === id ? { ...c, working: !c.working } : c)))
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Cameras</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Working</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.working}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Down</CardTitle></CardHeader><CardContent><div className={`text-2xl font-bold ${s.down > 0 ? "text-destructive" : ""}`}>{s.down}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Uptime</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.uptimePct}%</div><Progress value={s.uptimePct} className="mt-2 h-1.5" /></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader><CardTitle>Register a camera</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="l">Location / label</Label><Input id="l" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Gate-1 dome cam" /></div>
            <div className="space-y-1.5">
              <Label>Zone</Label>
              <select value={zone} onChange={(e) => setZone(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {CCTV_ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
            <Button onClick={add} disabled={!location.trim()} className="w-full">Add camera</Button>
            <div className="rounded-md border p-3 text-xs">
              <p className="font-medium">Coverage gaps ({gaps.length})</p>
              {gaps.length === 0 ? (
                <p className="mt-1 text-emerald-600">All zones have a working camera.</p>
              ) : (
                <p className="mt-1 text-muted-foreground">{gaps.join(", ")}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Camera register ({cameras.length})</CardTitle></CardHeader>
          <CardContent>
            {cameras.length === 0 ? (
              <p className="text-sm text-muted-foreground">No cameras registered yet.</p>
            ) : (
              <ul className="space-y-2">
                {cameras.map((c) => (
                  <li key={c.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <span>
                      <span className="font-medium">{c.location}</span>
                      <span className="block text-xs text-muted-foreground">{c.zone}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Badge variant={c.working ? "default" : "destructive"}>{c.working ? "Online" : "Down"}</Badge>
                      <Button size="sm" variant="outline" onClick={() => toggle(c.id)}>Toggle</Button>
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
