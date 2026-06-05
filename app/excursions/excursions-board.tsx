"use client"

import { useState } from "react"
import { excursionSummary, isTripReady, type Trip } from "@/lib/excursions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

export function ExcursionsBoard() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [destination, setDestination] = useState("")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [classGroup, setClassGroup] = useState("")
  const [strength, setStrength] = useState(30)

  const s = excursionSummary(trips)

  function add() {
    if (!destination.trim() || strength <= 0) return
    setTrips((prev) => [
      { id: `tr-${Date.now()}`, destination: destination.trim(), date, classGroup: classGroup.trim() || "All", strength, consentsReceived: 0 },
      ...prev,
    ])
    setDestination("")
    setClassGroup("")
  }

  function addConsent(id: string) {
    setTrips((prev) => prev.map((t) => (t.id === id ? { ...t, consentsReceived: Math.min(t.strength, t.consentsReceived + 1) } : t)))
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Trips planned</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.trips}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Students</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.students}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Consents in</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.consentsReceived}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Cleared trips</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.readyTrips}<span className="text-base text-muted-foreground"> / {s.trips}</span></div><Progress value={s.consentPct} className="mt-2 h-1.5" /></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader><CardTitle>Plan an excursion</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="d">Destination</Label><Input id="d" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. Science City museum" /></div>
            <div className="space-y-1.5"><Label htmlFor="dt">Date</Label><Input id="dt" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="cg">Class group</Label><Input id="cg" value={classGroup} onChange={(e) => setClassGroup(e.target.value)} placeholder="e.g. 6-8" /></div>
            <div className="space-y-1.5"><Label htmlFor="str">Students going</Label><Input id="str" type="number" min={1} value={strength} onChange={(e) => setStrength(Number(e.target.value))} /></div>
            <Button onClick={add} disabled={!destination.trim() || strength <= 0} className="w-full">Plan trip</Button>
            <p className="text-xs text-muted-foreground">A trip is cleared to run only when every student has a signed parental consent form.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Planned trips ({trips.length})</CardTitle></CardHeader>
          <CardContent>
            {trips.length === 0 ? (
              <p className="text-sm text-muted-foreground">No trips planned yet.</p>
            ) : (
              <ul className="space-y-2">
                {trips.map((t) => {
                  const ready = isTripReady(t)
                  return (
                    <li key={t.id} className="rounded-md border p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{t.destination}</span>
                        <Badge variant={ready ? "default" : "destructive"}>{ready ? "Cleared" : "Consent pending"}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{t.date} · {t.classGroup} · {t.consentsReceived}/{t.strength} consents</p>
                      <div className="mt-2">
                        <Progress value={Math.round((t.consentsReceived / t.strength) * 100)} className="h-1.5" />
                      </div>
                      {!ready ? (
                        <div className="mt-2 flex justify-end">
                          <Button size="sm" variant="outline" onClick={() => addConsent(t.id)}>+1 consent</Button>
                        </div>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
