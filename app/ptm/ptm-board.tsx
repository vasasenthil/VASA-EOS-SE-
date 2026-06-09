"use client"

import { useState } from "react"
import { generateSlots, ptmSummary, type Slot } from "@/lib/ptm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const TODAY = new Date().toISOString().slice(0, 10)

export function PtmBoard() {
  const [date, setDate] = useState(TODAY)
  const [start, setStart] = useState("10:00")
  const [count, setCount] = useState(8)
  const [step, setStep] = useState(15)
  const [slots, setSlots] = useState<Slot[]>(() => generateSlots("10:00", 8, 15))
  const [bookingName, setBookingName] = useState("")

  const summary = ptmSummary(slots)

  function regenerate() {
    setSlots(generateSlots(start, count, step))
  }
  function book(id: string) {
    if (!bookingName.trim()) return
    setSlots((prev) => prev.map((s) => (s.id === id && !s.parent ? { ...s, parent: bookingName.trim() } : s)))
    setBookingName("")
  }
  function cancel(id: string) {
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, parent: undefined } : s)))
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
      <Card>
        <CardHeader><CardTitle>Schedule</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5"><Label htmlFor="d">Date</Label><Input id="d" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5"><Label htmlFor="st">Start</Label><Input id="st" type="time" value={start} onChange={(e) => setStart(e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="ct">Slots</Label><Input id="ct" type="number" min={1} value={count} onChange={(e) => setCount(Number(e.target.value))} /></div>
            <div className="space-y-1.5"><Label htmlFor="sp">Mins</Label><Input id="sp" type="number" min={5} value={step} onChange={(e) => setStep(Number(e.target.value))} /></div>
          </div>
          <Button onClick={regenerate} className="w-full">Generate slots</Button>
          <div className="space-y-1.5">
            <Label htmlFor="bn">Parent name (to book)</Label>
            <Input id="bn" value={bookingName} onChange={(e) => setBookingName(e.target.value)} placeholder="Type a name, then Book a slot" />
          </div>
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            {summary.booked} booked · {summary.free} free of {summary.total}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{date} — slots</CardTitle></CardHeader>
        <CardContent>
          <ul className="grid gap-2 sm:grid-cols-2">
            {slots.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <span>
                  <span className="font-medium">{s.time}</span>
                  {s.parent ? <span className="block text-xs text-muted-foreground">{s.parent}</span> : null}
                </span>
                {s.parent ? (
                  <span className="flex items-center gap-2"><Badge>booked</Badge><Button size="sm" variant="ghost" onClick={() => cancel(s.id)}>✕</Button></span>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => book(s.id)} disabled={!bookingName.trim()}>Book</Button>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
