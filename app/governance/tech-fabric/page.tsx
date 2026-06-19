import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Download } from "lucide-react"
import { FABRIC_ELEMENTS, fabricSummary, type FabricStatus } from "@/lib/governance/tech-fabric"

const STATUS_VARIANT: Record<FabricStatus, "default" | "secondary" | "outline"> = {
  built: "default",
  partial: "secondary",
  pending: "outline",
}

export default function TechFabricPage() {
  const s = fabricSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Advanced Technology Fabric — Honest Coverage</PageHeaderHeading>
        <PageHeaderDescription>
          The Synthesis Brief&apos;s advanced technology fabric — Machine Learning · Deep Learning · IoT · Blockchain · NFT ·
          Education DAOs · Edge · RAG/MCP — mapped to what is actually delivered in-repo. Of {s.total} elements: {s.built} built ·{" "}
          {s.partial} partial · {s.pending} pending — <strong>{s.coveragePct}% weighted coverage</strong> (built = 1, partial = ½).
          The pillars are delivered as tested in-app analogues; the heavy substrate (trained models, a distributed chain,
          on-chain mints, edge inference) is disclosed plainly as pending, never silently claimed.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/tech-fabric/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="py-4"><div className="text-sm font-medium">Weighted coverage</div><div className="mt-1 text-2xl font-bold">{s.coveragePct}%</div><Progress value={s.coveragePct} className="mt-2" /></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-sm font-medium">Status</div><div className="mt-1 text-xs text-muted-foreground">{s.built} built · {s.partial} partial · {s.pending} pending of {s.total}</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-sm font-medium">Honesty</div><div className="mt-1 text-xs text-muted-foreground">Built/partial cite real files (asserted on disk by tests); pending cite nothing.</div></CardContent></Card>
      </div>

      <div className="space-y-3">
        {FABRIC_ELEMENTS.map((e) => (
          <Card key={e.id}>
            <CardContent className="py-4">
              <div className="flex items-start gap-4">
                <span className="mt-0.5 w-16 shrink-0 font-mono text-xs font-semibold text-muted-foreground">{e.id}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{e.name}</span>
                    <Badge variant={STATUS_VARIANT[e.status]}>{e.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm"><span className="text-muted-foreground">Brief: </span>{e.briefClaim}</p>
                  <p className="mt-1 text-sm"><span className="text-muted-foreground">Delivered: </span>{e.delivered}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{e.note}</p>
                  {e.pendingAspects.length > 0 ? (
                    <p className="mt-2 text-xs text-amber-700 dark:text-amber-500"><span className="font-medium">Out of scope / pending:</span> {e.pendingAspects.join(" · ")}</p>
                  ) : null}
                  {e.repoRefs.length > 0 ? <p className="mt-2 font-mono text-[11px] text-muted-foreground">{e.repoRefs.join("  ·  ")}</p> : null}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Eight fabric elements mapped. See also the Twelve-Layer Architecture register, the AI Control Tower and the Condensed
        Brochure coverage map.
      </p>
    </Shell>
  )
}
