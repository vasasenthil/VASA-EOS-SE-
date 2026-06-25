"use client"

import { useActionState } from "react"
import { grievanceAction, type GrievanceState } from "./actions"
import { ESCALATION_TIERS, GRIEVANCE_CATEGORIES } from "@/lib/grievance"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

const initial: GrievanceState = { grievances: [] }

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  open: "secondary",
  in_progress: "outline",
  escalated: "destructive",
  resolved: "default",
}

export function GrievancePanel() {
  const [state, formAction] = useActionState(grievanceAction, initial)

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
      <Card>
        <CardHeader>
          <CardTitle>File a Grievance</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-3">
            <input type="hidden" name="op" value="file" />
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <select id="category" name="category" className="h-9 rounded-md border bg-background px-3 text-sm">
                {GRIEVANCE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" required rows={3} placeholder="Describe the issue..." />
            </div>
            <Button type="submit">Submit</Button>
          </form>
          {state.error ? <p className="mt-3 text-sm text-destructive">{state.error}</p> : null}
          <p className="mt-4 text-xs text-muted-foreground">
            Escalation path: {ESCALATION_TIERS.join(" → ")} · CPGRAMS-federated · SLA-tracked.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Grievances</CardTitle>
        </CardHeader>
        <CardContent>
          {state.grievances.length === 0 ? (
            <p className="text-sm text-muted-foreground">No grievances yet — file one to see the SLA workflow.</p>
          ) : (
            <ul className="space-y-2">
              {state.grievances.map((g) => (
                <li key={g.id} className="rounded-md border p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs">{g.id}</span>
                    <Badge variant="outline">{g.category}</Badge>
                    <Badge variant={statusVariant[g.status]}>{g.status}</Badge>
                    <Badge variant="secondary">@ {ESCALATION_TIERS[g.tier]}</Badge>
                    <span className="text-xs text-muted-foreground">SLA {g.slaHours}h</span>
                  </div>
                  <p className="mt-1 text-muted-foreground">{g.description}</p>
                  <div className="mt-2 flex gap-2">
                    {g.status !== "resolved" ? (
                      <>
                        <form action={formAction}>
                          <input type="hidden" name="op" value="escalate" />
                          <input type="hidden" name="id" value={g.id} />
                          <Button type="submit" size="sm" variant="outline">
                            Escalate
                          </Button>
                        </form>
                        <form action={formAction}>
                          <input type="hidden" name="op" value="resolve" />
                          <input type="hidden" name="id" value={g.id} />
                          <Button type="submit" size="sm">
                            Resolve
                          </Button>
                        </form>
                      </>
                    ) : null}
                    <form action={formAction}>
                      <input type="hidden" name="op" value="delete" />
                      <input type="hidden" name="id" value={g.id} />
                      <Button type="submit" size="sm" variant="ghost" className="text-destructive">
                        Delete
                      </Button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
