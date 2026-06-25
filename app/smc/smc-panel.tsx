"use client"

import { useActionState } from "react"
import { smcAction, type SmcState } from "./actions"
import { proposalStatus, tally, decisionFingerprint, validateComposition, SMC_ROSTER, SMC_QUORUM, SMC_MEMBERS } from "@/lib/smc"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ThumbsUp, ThumbsDown, Users, ShieldCheck } from "lucide-react"

const composition = validateComposition(SMC_ROSTER)

const initial: SmcState = { proposals: [] }

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  open: "secondary",
  passed: "default",
  rejected: "destructive",
}

export function SmcPanel() {
  const [state, formAction] = useActionState(smcAction, initial)

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
      <Card>
        <CardHeader>
          <CardTitle>New Proposal</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-3">
            <input type="hidden" name="op" value="create" />
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required placeholder="e.g., Approve library books grant" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Details</Label>
              <Textarea id="description" name="description" rows={3} placeholder="Budget, rationale..." />
            </div>
            <Button type="submit">Submit proposal</Button>
          </form>
          {state.error ? <p className="mt-3 text-sm text-destructive">{state.error}</p> : null}
          <p className="mt-4 text-xs text-muted-foreground">
            {SMC_MEMBERS} members · quorum {SMC_QUORUM}. One member, one vote (a re-cast replaces the prior ballot); a
            distinct-voter majority decides once quorum is met. Every ballot is attributable and audit-anchored.
          </p>
          <div className="mt-3 flex items-center gap-2 rounded-md border bg-muted/40 p-2 text-xs">
            <Users className="h-4 w-4 text-indigo-600" />
            <span>RTE composition: <strong>{composition.parentPct}% parents</strong></span>
            {composition.ok ? <Badge className="bg-green-100 text-green-700 border-0">compliant</Badge> : <Badge variant="destructive">{composition.reasons[0]}</Badge>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Proposals</CardTitle>
        </CardHeader>
        <CardContent>
          {state.proposals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No proposals yet — create one to start voting.</p>
          ) : (
            <ul className="space-y-2">
              {state.proposals.map((p) => {
                const status = proposalStatus(p)
                return (
                  <li key={p.id} className="rounded-md border p-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{p.title}</span>
                      <Badge variant={statusVariant[status]}>{status}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {p.votesFor} for · {p.votesAgainst} against · {tally(p.ballots ?? []).voters} voters
                      </span>
                    </div>
                    {p.description ? <p className="mt-1 text-muted-foreground">{p.description}</p> : null}
                    <p className="mt-1 flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                      <ShieldCheck className="h-3 w-3" />decision {decisionFingerprint(p.id, p.ballots ?? [])}
                    </p>
                    {status === "open" ? (
                      <form action={formAction} className="mt-2 flex flex-wrap items-center gap-2">
                        <input type="hidden" name="op" value="ballot" />
                        <input type="hidden" name="id" value={p.id} />
                        <select name="memberId" defaultValue={SMC_ROSTER[0].id} className="h-8 rounded-md border bg-background px-2 text-xs" aria-label="SMC member">
                          {SMC_ROSTER.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                        <Button type="submit" name="support" value="true" size="sm" variant="outline">
                          <ThumbsUp className="mr-1 h-3.5 w-3.5" /> For
                        </Button>
                        <Button type="submit" name="support" value="false" size="sm" variant="outline">
                          <ThumbsDown className="mr-1 h-3.5 w-3.5" /> Against
                        </Button>
                      </form>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
