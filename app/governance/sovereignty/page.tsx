import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { SOVEREIGNTY_GUARANTEES, sovereigntySummary, type GuaranteeStatus } from "@/lib/compliance/sovereignty"

const STATUS_VARIANT: Record<GuaranteeStatus, "default" | "secondary"> = {
  enforced: "default",
  partial: "secondary",
}

export default function SovereigntyPage() {
  const s = sovereigntySummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>The Five Sovereignty Guarantees</PageHeaderHeading>
        <PageHeaderDescription>
          The trust architecture between the State and its people — data sovereignty, an off-switch at every phase
          boundary, source-code escrow, audit-by-construction and evidence-gated rollout. These are not contractual prose:
          each is bound to the in-repo mechanism that makes it real, and every control reference is verified to exist.
          Guarantees that finish at deploy (data residency, the legal escrow, independent evaluation) are shown honestly
          as <strong>partial</strong>.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/sovereignty/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.guarantees}</div><div className="text-sm text-muted-foreground">Sovereignty guarantees</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-green-600 dark:text-green-500">{s.enforced}</div><div className="text-sm text-muted-foreground">Enforced in code</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.partial}</div><div className="text-sm text-muted-foreground">Partial (complete at deploy)</div></CardContent></Card>
      </div>

      <div className="grid gap-4">
        {SOVEREIGNTY_GUARANTEES.map((g, i) => (
          <Card key={g.id}>
            <CardContent className="pt-6">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-sm font-mono text-muted-foreground">{i + 1}</span>
                <h2 className="text-lg font-semibold">{g.name}</h2>
                <Badge variant={STATUS_VARIANT[g.status]}>{g.status}</Badge>
              </div>
              <p className="mb-2 text-sm font-medium">{g.promise}</p>
              <p className="mb-2 text-sm text-muted-foreground">{g.mechanism}</p>
              <p className="text-xs font-mono text-muted-foreground">control: {g.controlRef}</p>
              {g.remaining && <p className="mt-1 text-xs text-muted-foreground">Remaining at deploy: {g.remaining}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </Shell>
  )
}
