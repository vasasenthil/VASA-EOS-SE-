import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ENGINES, ENGINE_COUNT } from "@/lib/ai/engines"
import { AnalyticsPlayground, ConversePlayground, AssessPlayground, ReasonPlayground, PersonalisePlayground, PolicyPlayground } from "./ai-engine-lab-client"

export const dynamic = "force-dynamic"

export default function AiEngineLabPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>AI Engine Lab</PageHeaderHeading>
        <PageHeaderDescription>
          All {ENGINE_COUNT} native AI engines are pure, deterministic, explainable functions under human
          authority — no black box, every output carries its working. This lab runs <strong>all six live</strong>{" "}
          on your own input — <strong>Analytics</strong> (stats · trend · anomalies), <strong>Conversational</strong>{" "}
          (grounded, citation-backed answers that never invent), <strong>Assessment</strong> (marks → grade band +
          per-objective mastery), <strong>Reasoning</strong> (rule-based RTE-eligibility with full provenance),{" "}
          <strong>Personalisation</strong> (prereq-aware next-objective recommendations) and <strong>Policy</strong>{" "}
          (coverage-lever impact + indicative cost projection). They run entirely in the app, so they work here
          even without the durable backbone connected.
        </PageHeaderDescription>
      </PageHeader>

      <div className="space-y-6">
        <section className="flex flex-wrap gap-2">
          {ENGINES.map((e) => (
            <Badge key={e.id} variant="outline" className="text-xs" title={e.purpose}>{e.label}</Badge>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Analytics engine</CardTitle>
              <CardDescription>Mean · median · spread · trend · z-score anomaly detection on any series.</CardDescription>
            </CardHeader>
            <CardContent>
              <AnalyticsPlayground />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conversational engine</CardTitle>
              <CardDescription>Grounded Q&amp;A over a fixed TN school-policy corpus, with citations.</CardDescription>
            </CardHeader>
            <CardContent>
              <ConversePlayground />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assessment engine</CardTitle>
              <CardDescription>Marks → grade band, per-objective mastery, and weak-objective flags.</CardDescription>
            </CardHeader>
            <CardContent>
              <AssessPlayground />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reasoning engine</CardTitle>
              <CardDescription>Rule-based RTE-eligibility inference — every conclusion cites its rule + clause.</CardDescription>
            </CardHeader>
            <CardContent>
              <ReasonPlayground />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personalisation engine</CardTitle>
              <CardDescription>Prereq-aware learning path — recommends only objectives the learner is ready for.</CardDescription>
            </CardHeader>
            <CardContent>
              <PersonalisePlayground />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Policy engine</CardTitle>
              <CardDescription>Coverage-lever impact — newly-covered beneficiaries + indicative cost + equity note.</CardDescription>
            </CardHeader>
            <CardContent>
              <PolicyPlayground />
            </CardContent>
          </Card>
        </section>

        <p className="text-xs text-muted-foreground">
          Both engines are deterministic and side-effect-free: identical input yields identical output, every
          answer is explainable, and final authority remains human (the engines recommend, people decide).
        </p>
      </div>
    </Shell>
  )
}
