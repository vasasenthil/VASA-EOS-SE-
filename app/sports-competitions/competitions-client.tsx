"use client"

import { useActionState } from "react"
import {
  createCompetitionAction,
  enterCompetitionAction,
  recordResultAction,
  advanceWinnerAction,
  closeCompetitionAction,
  type ActionResult,
} from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const EMPTY: ActionResult = { ok: false, message: "" }

const DISCIPLINES = ["athletics", "kabaddi", "kho_kho", "chess", "football", "volleyball", "debate", "quiz", "science_exhibition", "cultural"]
const LEVELS = ["school", "block", "district", "state", "national"]

function Notice({ state }: { state: ActionResult }) {
  if (!state.message) return null
  return (
    <p className={`mt-2 text-sm ${state.ok ? "text-green-600" : "text-destructive"}`} role="status">
      {state.ok ? "✓ " : "✕ "}
      {state.message}
    </p>
  )
}

/** Open a competition. */
export function CreateCompetitionForm({ org }: { org: string }) {
  const [state, action, pending] = useActionState(createCompetitionAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="org_unit" value={org} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="c-name">Name</Label>
          <Input id="c-name" name="name" placeholder="100m Sprint" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="c-disc">Discipline</Label>
          <select id="c-disc" name="discipline" defaultValue="athletics" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            {DISCIPLINES.map((d) => <option key={d} value={d}>{d.replace(/_/g, " ")}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="c-level">Level</Label>
          <select id="c-level" name="level" defaultValue="school" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="c-date">Event date</Label>
          <Input id="c-date" name="event_date" type="date" defaultValue="2026-07-10" />
        </div>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Opening…" : "Open competition"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Enter a student. */
export function EnterForm() {
  const [state, action, pending] = useActionState(enterCompetitionAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="e-id">Competition id</Label>
        <Input id="e-id" name="id" placeholder="COMP-CHN-ATH" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="e-stu">Student id</Label>
        <Input id="e-stu" name="student_id" placeholder="SYN-S-CHN-A06" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="e-cls">Class</Label>
        <Input id="e-cls" name="class" placeholder="Grade 9" className="w-28" />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Entering…" : "Enter"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Record a podium result. */
export function ResultForm() {
  const [state, action, pending] = useActionState(recordResultAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="r-id">Competition id</Label>
        <Input id="r-id" name="id" placeholder="COMP-CHN-ATH" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="r-stu">Student id</Label>
        <Input id="r-stu" name="student_id" placeholder="SYN-S-CHN-A04" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="r-pos">Position</Label>
        <select id="r-pos" name="position" defaultValue="1" className="h-9 w-24 rounded-md border bg-background px-3 text-sm">
          <option value="1">1st</option>
          <option value="2">2nd</option>
          <option value="3">3rd</option>
        </select>
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>{pending ? "Recording…" : "Record result"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Advance a podium finisher. */
export function AdvanceForm() {
  const [state, action, pending] = useActionState(advanceWinnerAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="a-id">Competition id</Label>
        <Input id="a-id" name="id" placeholder="COMP-CHN-ATH" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="a-stu">Student id</Label>
        <Input id="a-stu" name="student_id" placeholder="SYN-S-CHN-A02" required />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Advancing…" : "Advance winner"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Close a competition. */
export function CloseForm() {
  const [state, action, pending] = useActionState(closeCompetitionAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="cl-id">Competition id</Label>
        <Input id="cl-id" name="id" placeholder="COMP-CHN-DEB" required />
      </div>
      <Button type="submit" variant="destructive" disabled={pending}>{pending ? "Closing…" : "Close"}</Button>
      <Notice state={state} />
    </form>
  )
}
