import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Download, ShieldCheck, Landmark } from "lucide-react"
import {
  GOVERNANCE_BODIES,
  byKind,
  controlTowerSummary,
  type GovernanceBody,
  type GovBodyStatus,
} from "@/lib/governance/control-tower"

const STATUS_VARIANT: Record<GovBodyStatus, "default" | "secondary" | "outline"> = {
  built: "default",
  partial: "secondary",
  pending: "outline",
}

function BodyCard({ b }: { b: GovernanceBody }) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 w-8 shrink-0 text-sm font-bold text-muted-foreground">{b.id}</span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{b.name}</span>
              <Badge variant={STATUS_VARIANT[b.status]}>{b.status}</Badge>
            </div>
            <p className="mt-1 text-sm">{b.mandate}</p>
            <p className="mt-1 text-xs text-muted-foreground"><span className="font-medium">Authority:</span> {b.authority}</p>
            <p className="mt-2 text-xs text-muted-foreground">{b.note}</p>
            {b.pendingAspects.length > 0 ? (
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-500"><span className="font-medium">Out of scope / pending:</span> {b.pendingAspects.join(" · ")}</p>
            ) : null}
            <p className="mt-2 font-mono text-[11px] text-muted-foreground">{b.repoRefs.join("  ·  ")}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ControlTowerPage() {
  const s = controlTowerSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>AI Control Tower &amp; Seven Governance Tiers</PageHeaderHeading>
        <PageHeaderDescription>
          The State&apos;s instruments of authority above the twelve-layer architecture, made concrete and honest. Three
          permanent Control-Tower bodies and seven governance tiers (G1→G7) — each mapped to the in-repo instrument that
          serves it, with an unbiased built / partial / pending status. This is distinct from the seven multi-tenancy tiers
          (T0→T6) that make every <em>action</em> traceable; these make every <em>decision</em> auditable and reversible. Of{" "}
          {s.total} bodies: {s.built} built · {s.partial} partial · {s.pending} pending —{" "}
          <strong>{s.coveragePct}% weighted coverage</strong>. Out-of-scope sovereign-substrate controls are disclosed as
          pending aspects, never silently claimed.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/control-tower/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="py-4"><div className="text-sm font-medium">Weighted coverage</div><div className="mt-1 text-2xl font-bold">{s.coveragePct}%</div><Progress value={s.coveragePct} className="mt-2" /></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-sm font-medium">Bodies</div><div className="mt-1 text-xs text-muted-foreground">{s.controlTower} Control-Tower · {s.governanceTiers} governance tiers</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-sm font-medium">Status</div><div className="mt-1 text-xs text-muted-foreground">{s.built} built · {s.partial} partial · {s.pending} pending</div></CardContent></Card>
      </div>

      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold"><ShieldCheck className="h-5 w-5 text-indigo-600" />AI Control Tower — permanent bodies</h2>
      <div className="mb-8 space-y-3">
        {byKind("control-tower").map((b) => <BodyCard key={b.id} b={b} />)}
      </div>

      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold"><Landmark className="h-5 w-5 text-indigo-600" />Seven Governance Tiers (G1 → G7)</h2>
      <div className="space-y-3">
        {byKind("governance-tier").map((b) => <BodyCard key={b.id} b={b} />)}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        {GOVERNANCE_BODIES.length} authority instruments mapped. See also the Twelve-Layer Architecture register and the seven
        multi-tenancy tiers (T0→T6) under Tenancy.
      </p>
    </Shell>
  )
}
