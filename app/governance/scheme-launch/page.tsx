import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { SCHEME_LAUNCHES, LAUNCH_GATES, validateLaunch, readinessPct, schemeLaunchSummary, type SchemeStatus } from "@/lib/governance/scheme-launch"

const STATUS_VARIANT: Record<SchemeStatus, "default" | "secondary" | "outline"> = {
  launched: "default",
  approved: "secondary",
  design: "outline",
}

export default function SchemeLaunchPage() {
  const s = schemeLaunchSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Welfare-Scheme Launch</PageHeaderHeading>
        <PageHeaderDescription>
          A new scheme is the executive&apos;s signature act — but one launched without eligibility, funding, a delivery
          rail or a grievance channel becomes the next leakage scandal. Each scheme is designed against a fixed set of
          readiness gates, its funding head is cross-checked against the real budget, and a scheme is not launch-ready
          until every mandatory gate is met. {s.launchReady} of {s.schemes} schemes pass all gates; total target
          beneficiaries {s.totalTargetBeneficiaries.toLocaleString("en-IN")}.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/scheme-launch/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.schemes}</div><div className="text-sm text-muted-foreground">Schemes</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-green-600 dark:text-green-500">{s.launched}</div><div className="text-sm text-muted-foreground">Launched</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.launchReady}</div><div className="text-sm text-muted-foreground">Launch-ready</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.mandatoryGates}</div><div className="text-sm text-muted-foreground">Mandatory gates</div></CardContent></Card>
      </div>

      <div className="space-y-4">
        {SCHEME_LAUNCHES.map((sc) => {
          const v = validateLaunch(sc)
          return (
            <Card key={sc.id}>
              <CardContent className="pt-6">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-semibold">{sc.id}</span>
                  <Badge variant={STATUS_VARIANT[sc.status]}>{sc.status}</Badge>
                  <Badge variant={v.ok ? "default" : "outline"}>{v.ok ? "launch-ready" : `${v.unmet.length} gate(s) unmet`}</Badge>
                  <span className="text-sm text-muted-foreground">{sc.deliveryMode} · {sc.targetBeneficiaries.toLocaleString("en-IN")} beneficiaries · {readinessPct(sc)}% ready</span>
                </div>
                <p className="font-medium">{sc.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{sc.objective}</p>
                <p className="mt-2 text-xs text-muted-foreground">Funding: <span className="font-mono">{sc.fundingHead}</span> · Eligibility: {sc.eligibility.join(" · ")}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {LAUNCH_GATES.map((g) => {
                    const met = sc.gatesMet.includes(g.key)
                    return (
                      <Badge key={g.key} variant={met ? "secondary" : "outline"} className={met ? "" : "border-red-400 text-red-600 dark:text-red-500"}>
                        {met ? "✓" : "✕"} {g.label}{g.mandatory ? "" : " (opt)"}
                      </Badge>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </Shell>
  )
}
