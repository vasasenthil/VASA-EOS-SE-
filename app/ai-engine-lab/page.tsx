import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ENGINES, ENGINE_COUNT } from "@/lib/ai/engines"
import { AnalyticsPlayground, ConversePlayground } from "./ai-engine-lab-client"

export const dynamic = "force-dynamic"

export default function AiEngineLabPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>AI Engine Lab</PageHeaderHeading>
        <PageHeaderDescription>
          The {ENGINE_COUNT} native AI engines are pure, deterministic, explainable functions under human
          authority — no black box, every output carries its working. This lab runs two of them <strong>live</strong>{" "}
          on your own input: the <strong>Analytics</strong> engine (summary stats · trend · anomaly detection) and
          the <strong>Conversational</strong> engine (grounded, citation-backed answers — it replies only from its
          corpus and never invents). These run entirely in the app, so they work here even without the durable
          backbone connected.
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
        </section>

        <p className="text-xs text-muted-foreground">
          Both engines are deterministic and side-effect-free: identical input yields identical output, every
          answer is explainable, and final authority remains human (the engines recommend, people decide).
        </p>
      </div>
    </Shell>
  )
}
