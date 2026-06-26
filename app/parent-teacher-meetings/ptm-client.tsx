"use client"

import { useActionState } from "react"
import {
  scheduleSessionAction,
  bookSlotAction,
  markAttendanceAction,
  type ActionResult,
} from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const EMPTY: ActionResult = { ok: false, message: "" }

function Notice({ state }: { state: ActionResult }) {
  if (!state.message) return null
  return (
    <p className={`mt-2 text-sm ${state.ok ? "text-green-600" : "text-destructive"}`} role="status">
      {state.ok ? "✓ " : "✕ "}
      {state.message}
    </p>
  )
}

/** Schedule a new parent-teacher meeting session. */
export function ScheduleForm({ org }: { org: string }) {
  const [state, action, pending] = useActionState(scheduleSessionAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="org_unit" value={org} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="s-title">Title</Label>
          <Input id="s-title" name="title" placeholder="Term 2 Parent-Teacher Meeting" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="s-date">Date</Label>
          <Input id="s-date" name="date" type="date" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="s-slots">Slots</Label>
          <Input id="s-slots" name="slots" type="number" min={1} defaultValue={8} required />
        </div>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Scheduling…" : "Schedule session"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Book a guardian into a session slot. */
export function BookForm({ org, sessions }: { org: string; sessions: { id: string; title: string }[] }) {
  const [state, action, pending] = useActionState(bookSlotAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="org_unit" value={org} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="b-session">Session</Label>
          {sessions.length ? (
            <select id="b-session" name="session_id" className="h-9 w-full rounded-md border bg-background px-3 text-sm" required>
              {sessions.map((s) => <option key={s.id} value={s.id}>{s.title} ({s.id})</option>)}
            </select>
          ) : (
            <Input id="b-session" name="session_id" placeholder="PTM-CHN-T1" required />
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="b-student">Student id</Label>
          <Input id="b-student" name="student_id" placeholder="SYN-S-050" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="b-guardian">Guardian</Label>
          <Input id="b-guardian" name="guardian" placeholder="Guardian of SYN-S-050" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="b-slot">Slot (optional)</Label>
          <Input id="b-slot" name="slot" placeholder="10:30" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Booking the same student twice in a session, or booking a full session, is rejected by the backbone.
      </p>
      <Button type="submit" disabled={pending}>{pending ? "Booking…" : "Book slot"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Attendance controls for a booked slot: attend / no-show / cancel. */
export function AttendanceActions({ bookingId, status }: { bookingId: string; status: string }) {
  const [state, action, pending] = useActionState(markAttendanceAction, EMPTY)
  if (status !== "booked") {
    return <span className="text-xs text-muted-foreground capitalize">{status.replace("_", " ")}</span>
  }
  return (
    <div className="flex flex-col items-end gap-1">
      <form action={action} className="flex gap-2">
        <input type="hidden" name="id" value={bookingId} />
        <Button type="submit" name="action" value="attend" size="sm" disabled={pending}>Attended</Button>
        <Button type="submit" name="action" value="noshow" size="sm" variant="secondary" disabled={pending}>No-show</Button>
        <Button type="submit" name="action" value="cancel" size="sm" variant="destructive" disabled={pending}>Cancel</Button>
      </form>
      <Notice state={state} />
    </div>
  )
}
