import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { briefingPack, briefingSummary, type ClearanceStatus } from "@/lib/governance/assembly-briefing"

const STATUS_VARIANT: Record<ClearanceStatus, "default" | "secondary" | "outline"> = {
  cleared: "default",
  reviewed: "secondary",
  draft: "outline",
}

export default function AssemblyBriefingPage() {
  const s = briefingSummary()
  const pack = briefingPack()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Assembly Q&amp;A Briefing Pack</PageHeaderHeading>
        <PageHeaderDescription>
          The Secretary&apos;s floor-readiness pack for the Legislative Assembly. Each starred and unstarred question is
          answered <strong>from live platform data</strong> — no figure is hand-typed, so the pack always agrees with the
          State rollup — with the source module cited, anticipated supplementary questions listed, and a clearance status
          tracking readiness for the floor. {s.cleared} of {s.questions} questions are cleared ({s.readinessPct}% ready).
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/assembly-briefing/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download pack (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.questions}</div><div className="text-sm text-muted-foreground">Questions</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.starred}<span className="text-base text-muted-foreground"> / {s.unstarred}</span></div><div className="text-sm text-muted-foreground">Starred / unstarred</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-green-600 dark:text-green-500">{s.readinessPct}%</div><div className="text-sm text-muted-foreground">Cleared for floor</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.sourcesCited}</div><div className="text-sm text-muted-foreground">Data sources cited</div></CardContent></Card>
      </div>

      <div className="space-y-4">
        {pack.map((q) => (
          <Card key={q.id}>
            <CardContent className="pt-6">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-semibold">{q.number}</span>
                <Badge variant={q.type === "starred" ? "default" : "outline"}>{q.type}</Badge>
                <Badge variant={STATUS_VARIANT[q.status]}>{q.status}</Badge>
                <span className="text-sm text-muted-foreground">{q.subject}</span>
              </div>
              <div className="mb-1 text-xs text-muted-foreground">{q.member} — {q.constituency}</div>
              <p className="font-medium">{q.questionText}</p>
              <p className="mt-2 text-sm"><span className="font-semibold">Draft answer: </span>{q.answer}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Source: <span className="font-mono">{q.sourceRef}</span>
              </p>
              <div className="mt-2 text-xs text-muted-foreground">
                <span className="font-semibold">Be ready for: </span>{q.supplementaries.join(" · ")}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Shell>
  )
}
