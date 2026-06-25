"use client"

import { useActionState } from "react"
import { recordCpdAction, type ActionResult } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const EMPTY: ActionResult = { ok: false, message: "" }

const PROVIDERS = ["NISHTHA", "SCERT", "DIET", "DIKSHA"]
const STATUSES = ["enrolled", "completed", "certified"]

function Notice({ state }: { state: ActionResult }) {
  if (!state.message) return null
  return (
    <p className={`mt-2 text-sm ${state.ok ? "text-green-600" : "text-destructive"}`} role="status">
      {state.ok ? "✓ " : "✕ "}
      {state.message}
    </p>
  )
}

/** Record a CPD completion against the durable backbone. */
export function RecordCpdForm({ org, teachers }: { org: string; teachers: string[] }) {
  const [state, action, pending] = useActionState(recordCpdAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="org_unit" value={org} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="c-teacher">Teacher id</Label>
          {teachers.length ? (
            <input list="cpd-teachers" id="c-teacher" name="teacher_id" placeholder="SYN-T-02" required
              className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
          ) : (
            <Input id="c-teacher" name="teacher_id" placeholder="SYN-T-02" required />
          )}
          <datalist id="cpd-teachers">
            {teachers.map((t) => <option key={t} value={t} />)}
          </datalist>
        </div>
        <div className="space-y-1">
          <Label htmlFor="c-course">Course</Label>
          <Input id="c-course" name="course" placeholder="NISHTHA FLN module" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="c-provider">Provider</Label>
          <select id="c-provider" name="provider" defaultValue="NISHTHA" className="h-9 w-full rounded-md border bg-background px-3 text-sm" required>
            {PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="c-status">Status</Label>
          <select id="c-status" name="status" defaultValue="certified" className="h-9 w-full rounded-md border bg-background px-3 text-sm" required>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="c-hours">Hours</Label>
          <Input id="c-hours" name="hours" type="number" min={1} defaultValue={20} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="c-date">Completed on</Label>
          <Input id="c-date" name="completed_on" type="date" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Only <strong>completed</strong> or <strong>certified</strong> hours count toward the NEP-2020 50-hour
        annual target; an <strong>enrolled</strong> course is tracked but does not yet count.
      </p>
      <Button type="submit" disabled={pending}>{pending ? "Recording…" : "Record CPD"}</Button>
      <Notice state={state} />
    </form>
  )
}
