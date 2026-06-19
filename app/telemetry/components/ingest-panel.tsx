"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Database, Radio } from "lucide-react"
import { emptyReading, validateReading, classify, metricFor, SENSOR_METRICS, type IotReadingInput, type IotReadingErrors } from "@/lib/iot"
import { ingestReadingAction, seedReadingsAction } from "../actions"

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-600 dark:text-red-500">{msg}</p> : null
}
const SEV_STYLE: Record<string, string> = { Normal: "bg-green-100 text-green-700", Warning: "bg-amber-100 text-amber-700", Critical: "bg-red-100 text-red-700" }

export function IngestPanel() {
  const router = useRouter()
  const [f, setF] = useState<IotReadingInput>(emptyReading())
  const [errors, setErrors] = useState<IotReadingErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [serverErr, setServerErr] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function set<K extends keyof IotReadingInput>(k: K, v: IotReadingInput[K]) { setF((p) => ({ ...p, [k]: v })) }
  const shown = submitted ? validateReading(f).errors : errors
  const metric = metricFor(f.metricKey)
  const preview = metric ? classify(f.value, metric) : "Normal"

  function submit() {
    setSubmitted(true); setServerErr(null)
    const v = validateReading(f); setErrors(v.errors)
    if (!v.ok) return
    start(async () => {
      const res = await ingestReadingAction({ ...f, capturedAt: new Date(f.capturedAt).toISOString() })
      if (res.ok) { setF(emptyReading()); setSubmitted(false); router.refresh() }
      else if (res.errors) setErrors(res.errors)
      else setServerErr(res.reason ?? "Could not ingest the reading.")
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base flex items-center gap-2"><Radio className="h-4 w-4 text-indigo-600" />Ingest a device reading</CardTitle>
        <Button variant="outline" size="sm" disabled={pending} onClick={() => start(async () => { await seedReadingsAction(); router.refresh() })}><Database className="mr-1 h-4 w-4" />Seed</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="did">Device id *</Label><Input id="did" value={f.deviceId} onChange={(e) => set("deviceId", e.target.value)} placeholder="ENV-101" /><Err msg={shown.deviceId} /></div>
          <div className="space-y-1.5"><Label htmlFor="dl">Device label *</Label><Input id="dl" value={f.deviceLabel} onChange={(e) => set("deviceLabel", e.target.value)} placeholder="Class X-A sensor" /><Err msg={shown.deviceLabel} /></div>
          <div className="space-y-1.5"><Label htmlFor="mk">Metric *</Label><select id="mk" value={f.metricKey} onChange={(e) => set("metricKey", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{SENSOR_METRICS.map((m) => <option key={m.key} value={m.key}>{m.label} ({m.unit})</option>)}</select><Err msg={shown.metricKey} /></div>
          <div className="space-y-1.5"><Label htmlFor="val">Value * {metric ? <span className="text-muted-foreground">({metric.unit})</span> : null}</Label><Input id="val" type="number" value={f.value} onChange={(e) => set("value", Number(e.target.value))} /><Err msg={shown.value} /></div>
          <div className="space-y-1.5"><Label htmlFor="ud">School UDISE *</Label><Input id="ud" value={f.schoolUdise} onChange={(e) => set("schoolUdise", e.target.value)} /><Err msg={shown.schoolUdise} /></div>
          <div className="space-y-1.5"><Label htmlFor="ts">Captured at *</Label><Input id="ts" type="datetime-local" value={f.capturedAt} onChange={(e) => set("capturedAt", e.target.value)} /><Err msg={shown.capturedAt} /></div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Classification preview:</span>
          <Badge className={`${SEV_STYLE[preview]} border-0`}>{preview}</Badge>
        </div>
        {serverErr ? <p className="text-sm text-red-600">{serverErr}</p> : null}
        <Button onClick={submit} disabled={pending}>{pending ? "Ingesting…" : "Ingest reading"}</Button>
      </CardContent>
    </Card>
  )
}
