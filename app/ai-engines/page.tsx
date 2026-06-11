import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ENGINES,
  reason,
  personalise,
  assess,
  projectPolicy,
  analyse,
  converse,
} from "@/lib/ai/engines"

// Deterministic worked examples — computed on the server from sample inputs, so the page
// demonstrates each engine doing real work (not a description of one).
const examples: Record<string, { input: string; output: string }> = {
  reasoning: (() => {
    const r = reason({
      facts: { category: "EWS", age: 7, distanceKm: 0.5 },
      rules: [
        { id: "rte25", when: [{ key: "category", op: "eq", value: "EWS" }, { key: "age", op: "gte", value: 6 }], then: "RTE 25% eligible", because: "EWS child aged ≥ 6 (RTE §12(1)(c))" },
        { id: "nbhd", when: [{ key: "distanceKm", op: "lte", value: 1 }], then: "Neighbourhood school", because: "Within the 1 km norm" },
      ],
    })
    return { input: "EWS child, age 7, 0.5 km from school", output: r.conclusions.map((c) => `${c.conclusion} — ${c.because}`).join(" · ") }
  })(),
  personalisation: (() => {
    const r = personalise({ mastery: { add: 0.9, mul: 0.2 }, syllabus: [
      { id: "add", label: "Addition", prereqs: [] },
      { id: "mul", label: "Multiplication", prereqs: ["add"] },
      { id: "div", label: "Division", prereqs: ["mul"] },
    ] })
    return { input: "Mastery: Addition 90%, Multiplication 20%", output: `Next: ${r.recommendations.map((x) => x.label).join(", ") || "—"} · ${r.explanation}` }
  })(),
  assessment: (() => {
    const r = assess(
      [ { id: "q1", marks: 10, objective: "Algebra" }, { id: "q2", marks: 10, objective: "Algebra" }, { id: "q3", marks: 10, objective: "Geometry" } ],
      [ { itemId: "q1", awarded: 9 }, { itemId: "q2", awarded: 8 }, { itemId: "q3", awarded: 3 } ],
    )
    return { input: "Algebra 17/20, Geometry 3/10", output: `${r.score}/${r.max} (${r.pct}%, band ${r.band}); weak: ${r.weakObjectives.join(", ") || "none"}` }
  })(),
  policy: (() => {
    const r = projectPolicy({ population: 100000, baselineCoverage: 0.6, unitCost: 200 }, { label: "Breakfast scheme", targetCoverage: 0.85 })
    return { input: "1,00,000 eligible · 60% → 85% · ₹200/head", output: r.explanation }
  })(),
  analytics: (() => {
    const r = analyse([90, 91, 89, 92, 50])
    return { input: "Weekly attendance %: 90, 91, 89, 92, 50", output: `mean ${r.mean}, trend ${r.trend}, anomaly at week ${r.anomalies.map((i) => i + 1).join(", ") || "—"}` }
  })(),
  conversational: (() => {
    const r = converse("What is the pupil teacher ratio norm?", [
      { id: "d1", text: "Under RTE 2009, the pupil-teacher ratio norm is 30 to 1 at the primary level.", source: "RTE-2009" },
      { id: "d2", text: "Mid-day meals are provided to all enrolled children.", source: "MDM-GO" },
    ])
    return { input: "“What is the PTR norm?”", output: `${r.answer} [${r.citations.map((c) => c.source).join(", ")}]` }
  })(),
}

export default function AiEnginesPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>The Six AI Engines</PageHeaderHeading>
        <PageHeaderDescription>
          The Native-AI Engine Layer. Six purpose-built, <strong>deterministic and explainable</strong> engines that
          power the agents and modules — each is pure, auditable, and <strong>advisory</strong> (engines assist, humans
          decide; none performs a side effect). Each card shows a live worked example computed on the server.
        </PageHeaderDescription>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2">
        {ENGINES.map((e) => (
          <Card key={e.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{e.label}</CardTitle>
                <Badge variant="secondary">advisory</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">{e.purpose}</p>
              <div className="rounded-md border bg-muted/40 p-2.5 text-xs">
                <p><span className="font-medium">Input:</span> {examples[e.id].input}</p>
                <p className="mt-1"><span className="font-medium">Output:</span> {examples[e.id].output}</p>
              </div>
              <p className="text-xs text-muted-foreground">Powers: {e.poweredModules}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </Shell>
  )
}
