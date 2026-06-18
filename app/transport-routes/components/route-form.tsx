"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, X } from "lucide-react"
import {
  emptyRoute, validateRoute, freeSeats, occupancyPct, isOverloaded, inr,
  VEHICLE_TYPES, SHIFTS, ROUTE_STATUSES,
  type TransportInput, type TransportErrors, type RouteStop,
} from "@/lib/transportmgmt"
import { createRouteAction, updateRouteAction } from "../actions"

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-600 dark:text-red-500">{msg}</p> : null
}

export function RouteForm({ id, initial }: { id?: string; initial?: TransportInput }) {
  const router = useRouter()
  const [f, setF] = useState<TransportInput>(initial ?? emptyRoute())
  const [errors, setErrors] = useState<TransportErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [serverErr, setServerErr] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function set<K extends keyof TransportInput>(k: K, v: TransportInput[K]) { setF((p) => ({ ...p, [k]: v })) }
  function setStop(i: number, patch: Partial<RouteStop>) { setF((p) => ({ ...p, stops: p.stops.map((s, j) => (j === i ? { ...s, ...patch } : s)) })) }
  function addStop() { setF((p) => ({ ...p, stops: [...p.stops, { name: "", pickupTime: "07:30", dropTime: "16:30" }] })) }
  function removeStop(i: number) { setF((p) => ({ ...p, stops: p.stops.filter((_, j) => j !== i) })) }

  const shown = submitted ? validateRoute(f).errors : errors
  const over = isOverloaded(f)

  function submit() {
    setSubmitted(true); setServerErr(null)
    const v = validateRoute(f); setErrors(v.errors)
    if (!v.ok) return
    start(async () => {
      const res = id ? await updateRouteAction(id, f) : await createRouteAction(f)
      if (res.ok) router.push(id ? `/transport-routes/${id}` : "/transport-routes")
      else if (res.errors) setErrors(res.errors)
      else setServerErr(res.reason ?? "Could not save the route.")
    })
  }

  return (
    <Card>
      <CardHeader><CardTitle>{id ? "Edit route" : "New transport route"}</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Route & vehicle</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5 lg:col-span-2"><Label htmlFor="rn">Route name *</Label><Input id="rn" value={f.routeName} onChange={(e) => set("routeName", e.target.value)} placeholder="Anna Nagar – School" /><Err msg={shown.routeName} /></div>
            <div className="space-y-1.5"><Label htmlFor="rc">Route code *</Label><Input id="rc" value={f.routeCode} onChange={(e) => set("routeCode", e.target.value.toUpperCase())} placeholder="RT-01" /><Err msg={shown.routeCode} /></div>
            <div className="space-y-1.5"><Label htmlFor="shift">Shift *</Label><select id="shift" value={f.shift} onChange={(e) => set("shift", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{SHIFTS.map((s) => <option key={s} value={s}>{s}</option>)}</select><Err msg={shown.shift} /></div>
            <div className="space-y-1.5"><Label htmlFor="vno">Vehicle no *</Label><Input id="vno" value={f.vehicleNo} onChange={(e) => set("vehicleNo", e.target.value.toUpperCase())} placeholder="TN-01-AB-1234" /><Err msg={shown.vehicleNo} /></div>
            <div className="space-y-1.5"><Label htmlFor="vtype">Vehicle type *</Label><select id="vtype" value={f.vehicleType} onChange={(e) => set("vehicleType", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select><Err msg={shown.vehicleType} /></div>
            <div className="space-y-1.5"><Label htmlFor="status">Status *</Label><select id="status" value={f.status} onChange={(e) => set("status", e.target.value as TransportInput["status"])} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{ROUTE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select><Err msg={shown.status} /></div>
            <div className="space-y-1.5"><Label htmlFor="fare">Fare / term (₹) *</Label><Input id="fare" type="number" min={0} value={f.farePerTerm} onChange={(e) => set("farePerTerm", Number(e.target.value))} /><Err msg={shown.farePerTerm} /></div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Driver & capacity</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5"><Label htmlFor="dn">Driver name *</Label><Input id="dn" value={f.driverName} onChange={(e) => set("driverName", e.target.value)} placeholder="Murugan" /><Err msg={shown.driverName} /></div>
            <div className="space-y-1.5"><Label htmlFor="dp">Driver phone *</Label><Input id="dp" inputMode="numeric" value={f.driverPhone} onChange={(e) => set("driverPhone", e.target.value)} placeholder="9840011001" /><Err msg={shown.driverPhone} /></div>
            <div className="space-y-1.5"><Label htmlFor="cap">Capacity *</Label><Input id="cap" type="number" min={1} value={f.capacity} onChange={(e) => set("capacity", Number(e.target.value))} /><Err msg={shown.capacity} /></div>
            <div className="space-y-1.5"><Label htmlFor="asg">Students assigned *</Label><Input id="asg" type="number" min={0} value={f.assignedCount} onChange={(e) => set("assignedCount", Number(e.target.value))} /><Err msg={shown.assignedCount} /></div>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 p-3 text-sm">
            <span className="text-muted-foreground">Occupancy</span><Badge variant="secondary">{occupancyPct(f)}%</Badge>
            <span className="text-muted-foreground">· Free seats</span><Badge className={freeSeats(f) < 0 ? "bg-red-100 text-red-700 border-0" : "bg-green-100 text-green-700 border-0"}>{freeSeats(f)}</Badge>
            {over ? <Badge className="bg-red-100 text-red-700 border-0">Overloaded</Badge> : null}
            <span className="ml-auto text-muted-foreground">Fare {inr(f.farePerTerm)}/term</span>
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground">Stops (pickup → drop)</h3>
            <Button type="button" variant="outline" size="sm" onClick={addStop}><Plus className="mr-1 h-4 w-4" />Add stop</Button>
          </div>
          {f.stops.map((s, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <Input className="col-span-6" value={s.name} onChange={(e) => setStop(i, { name: e.target.value })} placeholder="Stop name" />
              <Input className="col-span-2" type="time" value={s.pickupTime} onChange={(e) => setStop(i, { pickupTime: e.target.value })} aria-label="Pickup" />
              <Input className="col-span-3" type="time" value={s.dropTime} onChange={(e) => setStop(i, { dropTime: e.target.value })} aria-label="Drop" />
              <Button type="button" variant="ghost" size="icon" className="col-span-1" onClick={() => removeStop(i)} aria-label="Remove stop" disabled={f.stops.length <= 1}><X className="h-4 w-4" /></Button>
            </div>
          ))}
          <Err msg={shown.stops} />
        </section>

        <div className="space-y-1.5"><Label htmlFor="notes">Notes</Label><Textarea id="notes" value={f.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="Optional notes." /></div>

        {serverErr ? <p className="text-sm text-red-600">{serverErr}</p> : null}
        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={pending}>{id ? "Save changes" : "Create route"}</Button>
          <Button variant="ghost" onClick={() => router.back()} disabled={pending}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  )
}
