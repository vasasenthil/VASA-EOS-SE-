import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { POLICY_RULES, enforcedActs, rulesForAct, policyEngineSummary, type PolicyEffect } from "@/lib/policy-engine"
import { PolicySimulator } from "./policy-simulator"

export const dynamic = "force-dynamic"

const EFFECT_STYLE: Record<PolicyEffect, string> = {
  permit: "bg-green-100 text-green-700",
  deny: "bg-red-100 text-red-700",
  "require-approval": "bg-amber-100 text-amber-700",
}

export default function PolicyEnginePage() {
  const s = policyEngineSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Policy-as-Code Engine</PageHeaderHeading>
        <PageHeaderDescription>
          The Education Acts as an ENFORCED runtime gate, not static text. Each statutory rule is executable code with a
          citation; at the point of action the engine returns <strong>permit · deny · require-approval</strong> (deny-wins),
          and the server gate audit-anchors the decision with the rule id — so every decision is traceable to the clause that
          justified it. {s.rules} rules across {s.acts} Acts ({s.blocking} blocking · {s.gating} approval-gating).
        </PageHeaderDescription>
      </PageHeader>

      <div className="mb-6"><PolicySimulator /></div>

      <h2 className="mb-3 text-lg font-semibold">Enforced statutory rules</h2>
      <div className="space-y-4">
        {enforcedActs().map((act) => (
          <Card key={act}>
            <CardContent className="pt-6">
              <div className="mb-3 text-sm font-semibold">{act}</div>
              <div className="space-y-2">
                {rulesForAct(act).map((r) => (
                  <div key={r.id} className="rounded-md border p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{r.title}</span>
                      <Badge className={`${EFFECT_STYLE[r.effect]} border-0`}>{r.effect}</Badge>
                      <Badge variant="outline">{r.clause}</Badge>
                      <span className="font-mono text-[11px] text-muted-foreground">{r.appliesTo.join(", ")}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{r.citation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        {POLICY_RULES.length} rules enforced. Honest scope: this is the executable enforcement core; wiring the gate into
        every server action across all flows is in progress — the rules here are real and tested, not placeholders.
      </p>
    </Shell>
  )
}
