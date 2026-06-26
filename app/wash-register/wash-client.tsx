"use client"

import { useActionState } from "react"
import { registerWashAction, recordFacilityAction, certifySwachhAction, type ActionResult } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const EMPTY: ActionResult = { ok: false, message: "" }

const CATEGORIES = [
  { value: "girls_toilet", label: "Girls' toilet (critical)" },
  { value: "boys_toilet", label: "Boys' toilet" },
  { value: "cwsn_toilet", label: "CWSN toilet" },
  { value: "drinking_water", label: "Drinking water (critical)" },
  { value: "handwash_station", label: "Handwash station (critical)" },
]

function Notice({ state }: { state: ActionResult }) {
  if (!state.message) return null
  return (
    <p className={`mt-2 text-sm ${state.ok ? "text-green-600" : "text-destructive"}`} role="status">
      {state.ok ? "✓ " : "✕ "}
      {state.message}
    </p>
  )
}

/** Open a school's WASH register. */
export function RegisterWashForm({ org }: { org: string }) {
  const [state, action, pending] = useActionState(registerWashAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="org_unit" value={org} />
      <div className="space-y-1">
        <Label htmlFor="w-name">School name</Label>
        <Input id="w-name" name="school_name" placeholder="Govt Higher Secondary School" required />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Opening…" : "Open register"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Record an inspected facility line. */
export function RecordFacilityForm() {
  const [state, action, pending] = useActionState(recordFacilityAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="f-id">Register id</Label>
          <Input id="f-id" name="id" placeholder="WASH-CHN" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="f-cat">Category</Label>
          <select id="f-cat" name="category" defaultValue="drinking_water" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="f-sanc">Sanctioned units</Label>
          <Input id="f-sanc" name="sanctioned_units" type="number" min={1} defaultValue={3} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="f-func">Functional units</Label>
          <Input id="f-func" name="functional_units" type="number" min={0} defaultValue={3} required />
        </div>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Recording…" : "Record inspection"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Certify a school Swachh. */
export function CertifySwachhForm() {
  const [state, action, pending] = useActionState(certifySwachhAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="c-id">Register id</Label>
        <Input id="c-id" name="id" placeholder="WASH-CHN" required />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>{pending ? "Certifying…" : "Certify Swachh"}</Button>
      <Notice state={state} />
    </form>
  )
}
