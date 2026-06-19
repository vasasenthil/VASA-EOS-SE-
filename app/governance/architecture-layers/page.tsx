import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Download, CheckCircle2, CircleDashed, Circle } from "lucide-react"
import {
  ARCHITECTURE_LAYERS,
  layersSummary,
  type LayerStatus,
} from "@/lib/governance/architecture-layers"

const STATUS_VARIANT: Record<LayerStatus, "default" | "secondary" | "outline"> = {
  built: "default",
  partial: "secondary",
  pending: "outline",
}

function StatusIcon({ status }: { status: LayerStatus }) {
  if (status === "built") return <CheckCircle2 className="h-5 w-5 text-green-600" />
  if (status === "partial") return <CircleDashed className="h-5 w-5 text-amber-600" />
  return <Circle className="h-5 w-5 text-muted-foreground" />
}

export default function ArchitectureLayersPage() {
  const s = layersSummary()
  // Render top-down (L12 → L1) so the citizen-facing layer sits at the top of the stack visual.
  const topDown = [...ARCHITECTURE_LAYERS].reverse()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Twelve-Layer Architecture — L1 Sovereign Foundation → L12 Citizen &amp; Civic</PageHeaderHeading>
        <PageHeaderDescription>
          The brochure&apos;s twelve-layer architecture, made concrete and honest. Each layer names its responsibility
          boundary, cites the in-repo modules that deliver it, and carries an unbiased built / partial / pending status.
          Of {s.total} layers: {s.built} built · {s.partial} partial · {s.pending} pending —{" "}
          <strong>{s.coveragePct}% weighted structural coverage</strong> (built = 1, partial = ½). The sovereign-compute
          substrate (HSM/key custody, escrow, off-switch, multi-cloud topology) is out of scope for this application
          repository and is disclosed plainly as the un-built portion of L1/L2 — never silently claimed.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/architecture-layers/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4">
            <div className="text-sm font-medium">Weighted coverage</div>
            <div className="mt-1 text-2xl font-bold">{s.coveragePct}%</div>
            <Progress value={s.coveragePct} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-sm font-medium">Status</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {s.built} built · {s.partial} partial · {s.pending} pending of {s.total}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-sm font-medium">Honesty</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Built/partial layers cite real files (asserted on disk by tests); out-of-scope substrate disclosed as pending aspects.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {topDown.map((l) => (
          <Card key={l.id}>
            <CardContent className="py-4">
              <div className="flex items-start gap-4">
                <div className="flex w-16 shrink-0 flex-col items-center gap-1 pt-0.5">
                  <span className="text-lg font-bold">{l.id}</span>
                  <StatusIcon status={l.status} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{l.name}</span>
                    <Badge variant={STATUS_VARIANT[l.status]}>{l.status}</Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{l.tagline}</p>
                  <p className="mt-2 text-sm">{l.responsibility}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{l.note}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {l.components.map((c) => (
                      <Badge key={c} variant="outline" className="font-normal">{c}</Badge>
                    ))}
                  </div>
                  {l.pendingAspects.length > 0 ? (
                    <p className="mt-2 text-xs text-amber-700 dark:text-amber-500">
                      <span className="font-medium">Out of scope / pending:</span> {l.pendingAspects.join(" · ")}
                    </p>
                  ) : null}
                  <p className="mt-2 font-mono text-[11px] text-muted-foreground">{l.repoRefs.join("  ·  ")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Twelve layers mapped. See also the Module Catalogue, the Condensed Brochure coverage map and the Launch-Readiness register.
      </p>
    </Shell>
  )
}
