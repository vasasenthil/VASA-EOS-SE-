"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, CircleCheckBig, Trash2 } from "lucide-react"
import type { EwsCase, CaseStatus } from "@/lib/earlywarning/case"
import { updateCaseAction, deleteCaseAction } from "../actions"

const STATUS_STYLE: Record<CaseStatus, string> = {
  Open: "bg-red-100 text-red-700",
  Acknowledged: "bg-amber-100 text-amber-700",
  Resolved: "bg-green-100 text-green-700",
}

export function CasesPanel({ cases }: { cases: EwsCase[] }) {
  const router = useRouter()
  const [pending, start] = useTransition()

  function toInput(c: EwsCase) {
    return { student: c.student, apaarId: c.apaarId, classLevel: c.classLevel, section: c.section, riskLevel: c.riskLevel, score: c.score, factors: c.factors, status: c.status, assignee: c.assignee, intervention: c.intervention, openedBy: c.openedBy }
  }

  function acknowledge(c: EwsCase) {
    const assignee = window.prompt("Acknowledge — who is handling this case?", c.assignee || "Counsellor")
    if (!assignee) return
    start(async () => {
      const res = await updateCaseAction(c.id, { ...toInput(c), status: "Acknowledged", assignee })
      if (res.ok) router.refresh(); else alert(res.errors?.assignee ?? res.reason ?? "Could not acknowledge.")
    })
  }
  function resolve(c: EwsCase) {
    const intervention = window.prompt("Resolve — record the intervention taken:", c.intervention || "")
    if (!intervention) return
    start(async () => {
      const res = await updateCaseAction(c.id, { ...toInput(c), status: "Resolved", assignee: c.assignee || "Counsellor", intervention })
      if (res.ok) router.refresh(); else alert(res.errors?.intervention ?? res.reason ?? "Could not resolve.")
    })
  }
  function remove(c: EwsCase) {
    if (!confirm(`Delete the case for ${c.student}?`)) return
    start(async () => { const res = await deleteCaseAction(c.id); if (res.ok) router.refresh(); else alert(res.reason ?? "Could not delete.") })
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Human-in-the-loop cases</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {cases.length === 0 ? (
          <p className="text-sm text-muted-foreground">No cases yet. Open a case from the at-risk list above — the AI flags, a human decides and acts.</p>
        ) : (
          cases.map((c) => (
            <div key={c.id} className="rounded-md border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{c.student}</span>
                <span className="text-xs text-muted-foreground">Class {c.classLevel}-{c.section}</span>
                <Badge className={`${STATUS_STYLE[c.status]} border-0`}>{c.status}</Badge>
                <Badge variant="outline">{c.riskLevel} · {c.score}</Badge>
                <div className="ml-auto flex gap-1">
                  {c.status === "Open" ? <Button variant="outline" size="sm" disabled={pending} onClick={() => acknowledge(c)}><CheckCircle2 className="mr-1 h-4 w-4" />Acknowledge</Button> : null}
                  {c.status !== "Resolved" ? <Button variant="outline" size="sm" disabled={pending} onClick={() => resolve(c)}><CircleCheckBig className="mr-1 h-4 w-4" />Resolve</Button> : null}
                  <Button variant="outline" size="icon" disabled={pending} onClick={() => remove(c)} aria-label="Delete"><Trash2 className="h-4 w-4 text-red-600" /></Button>
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{c.factors}</p>
              <p className="mt-1 text-xs">Opened by <strong>{c.openedBy}</strong>{c.assignee ? <> · assigned to <strong>{c.assignee}</strong></> : null}{c.intervention ? <> · intervention: {c.intervention}</> : null}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
