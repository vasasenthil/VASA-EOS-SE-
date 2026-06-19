"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, ShieldX, ShieldAlert } from "lucide-react"
import { evaluate, POLICY_ACTIONS, type PolicyContext, type PolicyEffect } from "@/lib/policy-engine"

const DECISION_STYLE: Record<PolicyEffect, string> = {
  permit: "bg-green-100 text-green-700",
  deny: "bg-red-100 text-red-700",
  "require-approval": "bg-amber-100 text-amber-700",
}
function DecisionIcon({ d }: { d: PolicyEffect }) {
  if (d === "permit") return <ShieldCheck className="h-5 w-5 text-green-600" />
  if (d === "deny") return <ShieldX className="h-5 w-5 text-red-600" />
  return <ShieldAlert className="h-5 w-5 text-amber-600" />
}

// The attribute fields the rule set reads; shown contextually but all sent on every evaluate.
const NUM_FIELDS = ["age", "amount"] as const
const BOOL_FIELDS = ["consent", "guardianConsent", "pastRetention", "pwd", "accommodation", "sanctioned", "exceedsAllocation", "backgroundVerified", "quotaFull"] as const

export function PolicySimulator() {
  const [action, setAction] = useState(POLICY_ACTIONS[0])
  const [nums, setNums] = useState<Record<string, string>>({ age: "8", amount: "0" })
  const [bools, setBools] = useState<Record<string, boolean>>({})
  const [category, setCategory] = useState("General")

  const resource: Record<string, string | number | boolean> = { category }
  for (const k of NUM_FIELDS) if (nums[k] !== undefined && nums[k] !== "") resource[k] = Number(nums[k])
  for (const k of BOOL_FIELDS) resource[k] = bools[k] === true
  const ctx: PolicyContext = { action, resource }
  const result = evaluate(ctx)

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
      <Card>
        <CardHeader><CardTitle className="text-base">Simulate an action</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="action">Action</Label>
            <select id="action" value={action} onChange={(e) => setAction(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              {POLICY_ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {NUM_FIELDS.map((k) => (
              <div key={k} className="space-y-1.5"><Label htmlFor={k} className="text-xs">{k}</Label><Input id={k} type="number" value={nums[k] ?? ""} onChange={(e) => setNums((p) => ({ ...p, [k]: e.target.value }))} /></div>
            ))}
            <div className="space-y-1.5"><Label htmlFor="cat" className="text-xs">category</Label>
              <select id="cat" value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 w-full rounded-md border bg-background px-2 text-sm">
                {["General", "EWS", "DG", "OBC", "SC", "ST"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            {BOOL_FIELDS.map((k) => (
              <label key={k} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={bools[k] === true} onChange={(e) => setBools((p) => ({ ...p, [k]: e.target.checked }))} />{k}</label>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">Adjust the action and its attributes; the decision recomputes live against the statutory rule set.</p>
        </CardContent>
      </Card>

      <Card className={result.decision === "deny" ? "border-red-200" : result.decision === "require-approval" ? "border-amber-200" : "border-green-200"}>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><DecisionIcon d={result.decision} />Decision</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Badge className={`${DECISION_STYLE[result.decision]} border-0 text-sm`}>{result.decision.toUpperCase()}</Badge>
          <p className="text-sm">{result.rationale}</p>
          {result.governing.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Governing rule{result.governing.length > 1 ? "s" : ""} & citation:</p>
              {result.governing.map((r) => (
                <div key={r.id} className="rounded-md border bg-muted/40 p-2 text-xs">
                  <div className="flex flex-wrap items-center gap-2"><span className="font-medium">{r.title}</span><Badge variant="outline">{r.act} · {r.clause}</Badge></div>
                  <p className="mt-1 text-muted-foreground">{r.citation}</p>
                </div>
              ))}
            </div>
          ) : null}
          <p className="text-[11px] text-muted-foreground">In a wired flow, a <strong>deny</strong> hard-stops the action and a <strong>require-approval</strong> routes it to the matching approval tier — every decision audit-anchored with the rule id.</p>
        </CardContent>
      </Card>
    </div>
  )
}
