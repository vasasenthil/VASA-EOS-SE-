import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EXAM_PIPELINE } from "@/lib/exams"
import { ResultForm } from "./result-form"

export default function ExamsPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Examination Security &amp; Evaluation</PageHeaderHeading>
        <PageHeaderDescription>
          End-to-end secure conduct of TN State Board (DGE) examinations for ~10 lakh candidates — AI paper generation,
          encrypted time-locked distribution, smartphone OMR, AI-augmented evaluation with human review, and
          blockchain-anchored results auto-pushed to DigiLocker.
        </PageHeaderDescription>
      </PageHeader>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Secure Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {EXAM_PIPELINE.map((step, i) => (
              <li key={step.key} className="flex items-start gap-3">
                <Badge variant="outline" className="mt-0.5">
                  {i + 1}
                </Badge>
                <div>
                  <div className="font-medium">{step.label}</div>
                  <div className="text-sm text-muted-foreground">{step.detail}</div>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <ResultForm />
    </Shell>
  )
}
