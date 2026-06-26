"use client"

import { useActionState } from "react"
import { createLessonPlanAction, advanceLessonPlanAction, type ActionResult } from "./actions"
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

/** Create a lesson plan. A plan can be published only once it has learning objectives. */
export function CreateLessonPlanForm({ org }: { org: string }) {
  const [state, action, pending] = useActionState(createLessonPlanAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="org_unit" value={org} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="lp-class">Class / Section</Label>
          <Input id="lp-class" name="class" placeholder="Grade 8-A" defaultValue="Grade 8-A" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="lp-subject">Subject</Label>
          <Input id="lp-subject" name="subject" placeholder="Mathematics" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="lp-teacher">Teacher id</Label>
          <Input id="lp-teacher" name="teacher_id" placeholder="SYN-T-03" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="lp-periods">Periods</Label>
          <Input id="lp-periods" name="periods" type="number" min={1} defaultValue={2} required />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="lp-topic">Topic</Label>
          <Input id="lp-topic" name="topic" placeholder="Fractions — parts of a whole" required />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="lp-obj">Learning objectives (required to publish)</Label>
          <Input id="lp-obj" name="objectives" placeholder="Identify numerator/denominator; add like fractions." />
        </div>
        <div className="space-y-1">
          <Label htmlFor="lp-tags">FLN/NEP tags</Label>
          <Input id="lp-tags" name="tags" placeholder="FLN, NEP-2.2" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="lp-res">Resources (URL)</Label>
          <Input id="lp-res" name="resources" placeholder="https://diksha.gov.in/…" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        A plan is created as a <strong>draft</strong>; it can be <strong>published</strong> only once it carries
        learning objectives (the quality gate). Published plans are the ones lesson-delivery records reference.
      </p>
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Create draft plan"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Lifecycle controls: publish a draft (needs objectives) or archive a published plan. */
export function LessonPlanActions({ id, status }: { id: string; status: string }) {
  const [state, action, pending] = useActionState(advanceLessonPlanAction, EMPTY)
  if (status === "archived") return <span className="text-xs text-muted-foreground">archived</span>
  return (
    <div className="flex flex-col items-end gap-1">
      <form action={action} className="flex gap-2">
        <input type="hidden" name="id" value={id} />
        {status === "draft" && <Button type="submit" name="action" value="publish" size="sm" disabled={pending}>Publish</Button>}
        {status === "published" && <Button type="submit" name="action" value="archive" size="sm" variant="secondary" disabled={pending}>Archive</Button>}
      </form>
      <Notice state={state} />
    </div>
  )
}
