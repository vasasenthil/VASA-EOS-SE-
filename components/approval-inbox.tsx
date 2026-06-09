"use client"

import { useState } from "react"
import { currentStep, progress, type Decision, type WorkflowDef, type WorkflowInstance } from "@/lib/workflow"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export interface InboxItem {
  id: string
  instance: WorkflowInstance
  title: string
  subtitle?: string
}

export interface InboxAction {
  decision: Decision
  label: string
  variant?: "default" | "outline" | "secondary" | "destructive"
}

const DEFAULT_ACTIONS: InboxAction[] = [
  { decision: "approve", label: "Approve", variant: "default" },
  { decision: "reject", label: "Reject", variant: "outline" },
]

const STATUS_VARIANT: Record<string, "secondary" | "default" | "destructive"> = {
  in_progress: "secondary",
  approved: "default",
  rejected: "destructive",
}

// Reusable approver console: an "Acting as" role switcher, the role's pending inbox
// (role-gated Approve/Reject), and the full audit trail for every request. Driven
// entirely by the workflow engine + the supplied definition.
export function ApprovalInbox({
  def,
  items,
  roles,
  onDecide,
  pending,
  sessionRole,
  actions = DEFAULT_ACTIONS,
}: {
  def: WorkflowDef
  items: InboxItem[]
  roles: { role: string; label: string }[]
  onDecide: (id: string, role: string, decision: Decision) => void
  pending: boolean
  /** When provided (and not ADMIN), the inbox locks to the signed-in role. */
  sessionRole?: string | null
  /** Custom action buttons (e.g. Resolve / Escalate). Defaults to Approve / Reject. */
  actions?: InboxAction[]
}) {
  // Lock to the signed-in role unless they're an admin (admins may act as any tier).
  const locked = !!sessionRole && sessionRole !== "ADMIN"
  const [asRole, setAsRole] = useState(locked ? (sessionRole as string) : roles[0]?.role ?? "")

  const sessionLabel = roles.find((r) => r.role === sessionRole)?.label ?? sessionRole
  const inbox = items.filter(
    (i) => i.instance.status === "in_progress" && currentStep(def, i.instance)?.approverRole === asRole,
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Approver inbox</CardTitle>
          {locked ? (
            <span className="rounded-md border bg-muted px-2 py-1 text-xs text-muted-foreground">
              Signed in as: <span className="font-medium text-foreground">{sessionLabel}</span>
            </span>
          ) : (
            <select
              value={asRole}
              onChange={(e) => setAsRole(e.target.value)}
              className="h-8 rounded-md border bg-background px-2 text-xs"
            >
              {roles.map((r) => (
                <option key={r.role} value={r.role}>
                  Acting as: {r.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Awaiting your action ({inbox.length})</p>
          {inbox.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing in this inbox. Switch role or create a request.</p>
          ) : (
            <ul className="space-y-2">
              {inbox.map((i) => (
                <li key={i.id} className="rounded-md border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{i.title}</span>
                    <Badge variant="secondary">{currentStep(def, i.instance)?.name}</Badge>
                  </div>
                  {i.subtitle ? <p className="mt-1 text-xs text-muted-foreground">{i.subtitle}</p> : null}
                  <div className="mt-2 flex justify-end gap-2">
                    {actions.map((a) => (
                      <Button
                        key={a.decision}
                        size="sm"
                        variant={a.variant ?? "default"}
                        onClick={() => onDecide(i.id, asRole, a.decision)}
                        disabled={pending}
                      >
                        {a.label}
                      </Button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">All requests ({items.length})</p>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No requests yet.</p>
          ) : (
            <ul className="space-y-2">
              {items.map((i) => {
                const p = progress(def, i.instance)
                return (
                  <li key={i.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{i.title}</span>
                      <Badge variant={STATUS_VARIANT[i.instance.status]}>{i.instance.status.replace("_", " ")}</Badge>
                    </div>
                    {i.subtitle ? <p className="mt-1 text-xs text-muted-foreground">{i.subtitle}</p> : null}
                    <div className="mt-2">
                      <Progress value={p.pct} className="h-1.5" />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Step {p.step}/{p.total}
                      {p.currentStepName ? ` · awaiting ${p.currentStepName}` : " · complete"}
                    </p>
                    {i.instance.history.length > 0 ? (
                      <ul className="mt-2 space-y-0.5 border-t pt-2 text-xs text-muted-foreground">
                        {i.instance.history.map((h, idx) => (
                          <li key={idx}>
                            {h.decision === "reject" ? "✗" : "✓"} {h.actorRole} {h.decision}d
                            {h.note ? ` — ${h.note}` : ""}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
