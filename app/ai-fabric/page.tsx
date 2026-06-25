import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ENGINES } from "@/lib/ai/engines"
import { AI_PILLARS, pillarSummary, type AiPillar } from "@/lib/ai/pillars"
import {
  AGENTS,
  runPolicyAgent,
  runTeacherAgent,
  runStudentAgent,
  runGovernanceAgent,
  runGrievanceAgent,
  runComplianceAgent,
  type AgentId,
  type AgentRecommendation,
} from "@/lib/ai/agents"
import type { CapabilityStatus } from "@/lib/governance/role-capabilities"

const STATUS_VARIANT: Record<CapabilityStatus, "default" | "secondary" | "outline"> = {
  built: "default",
  partial: "secondary",
  pending: "outline",
}

// Deterministic, server-computed agent runs — proof each agent does real work.
const runs: Record<AgentId, AgentRecommendation> = {
  policy: runPolicyAgent({ baseline: { population: 100000, baselineCoverage: 0.6, unitCost: 200 }, lever: { label: "Breakfast scheme", targetCoverage: 0.85, equityWeighted: true } }),
  teacher: runTeacherAgent({
    rubric: [ { id: "q1", marks: 10, objective: "Algebra" }, { id: "q2", marks: 10, objective: "Geometry" } ],
    responses: [ { itemId: "q1", awarded: 9 }, { itemId: "q2", awarded: 2 } ],
    syllabus: [ { id: "add", label: "Addition", prereqs: [] }, { id: "mul", label: "Multiplication", prereqs: ["add"] } ],
    mastery: { add: 0.9 },
  }),
  student: runStudentAgent({ mastery: { add: 0.9 }, syllabus: [ { id: "add", label: "Addition", prereqs: [] }, { id: "mul", label: "Multiplication", prereqs: ["add"] } ], question: "What is the PTR norm?", corpus: [ { id: "d1", text: "The pupil-teacher ratio norm under RTE 2009 is 30 to 1.", source: "RTE-2009" } ] }),
  governance: runGovernanceAgent({ indicator: [90, 91, 89, 92, 50] }),
  grievance: runGrievanceAgent({ facts: { tier: "block" }, rules: [ { id: "b", when: [{ key: "tier", op: "eq", value: "block" }], then: "Block (BEO)", because: "Block-tier grievance" } ], query: "fee refund policy", corpus: [ { id: "d", text: "Fee refunds are processed within 30 days of a valid request.", source: "Fee-GO" } ] }),
  compliance: runComplianceAgent({ facts: { ptr: 45, toiletsGenderSegregated: false }, rules: [ { id: "ptr", when: [{ key: "ptr", op: "gte", value: 31 }], then: "PTR breach (norm 30:1)", because: "PTR 45 exceeds 30:1" }, { id: "toilet", when: [{ key: "toiletsGenderSegregated", op: "eq", value: false }], then: "No gender-segregated toilets", because: "RTE/RPwD norm" } ] }),
}

function PillarRow({ p }: { p: AiPillar }) {
  return (
    <div className="flex items-start justify-between gap-2 rounded-md border p-2.5 text-sm">
      <div>
        <div className="font-medium">{p.name}</div>
        <div className="text-xs text-muted-foreground">{p.capability}</div>
      </div>
      <Badge variant={STATUS_VARIANT[p.status]} className="shrink-0">{p.status}</Badge>
    </div>
  )
}

export default function AiFabricPage() {
  const ps = pillarSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>The Native-AI Fabric</PageHeaderHeading>
        <PageHeaderDescription>
          Eight capability pillars, six engines and six agents — every layer <strong>under human authority</strong>.
          Agents compose the engines into role-facing recommendations; nothing acts autonomously. Pillar coverage is{" "}
          {ps.coveragePct}% ({ps.built} built · {ps.partial} partial · {ps.pending} pending) — vision/document AI is
          honestly pending.
        </PageHeaderDescription>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Eight Native-AI pillars</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {AI_PILLARS.map((p) => <PillarRow key={p.id} p={p} />)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Six engines</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {ENGINES.map((e) => (
              <div key={e.id} className="rounded-md border p-2.5 text-sm">
                <div className="font-medium">{e.label}</div>
                <div className="text-xs text-muted-foreground">{e.purpose}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4">
        <h2 className="mb-2 text-sm font-semibold">Six agents — live worked examples (each requires human authority)</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {AGENTS.map((a) => {
            const r = runs[a.id]
            return (
              <Card key={a.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{a.label}</CardTitle>
                    <Badge variant={r.requiresHumanApproval ? "secondary" : "outline"}>
                      {r.requiresHumanApproval ? "needs approval" : "advisory"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1.5 text-sm">
                  <p className="text-xs text-muted-foreground">{a.goal}</p>
                  <p><span className="font-medium">Recommends:</span> {r.summary}</p>
                  <p className="text-xs text-muted-foreground">{r.detail}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Engines: {r.enginesUsed.join(" + ")} · confidence {(r.confidence * 100).toFixed(0)}% · oversight: {a.oversight}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </Shell>
  )
}
