import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  NEP_IMPL_SEED,
  analyticsSummary,
  statusDistribution,
  ragDistribution,
  byThrustArea,
  byRegionType,
  atRisk,
  ragBand,
  type RagBand,
} from "@/lib/tracking/analytics"

const RAG_VARIANT: Record<RagBand, "default" | "secondary" | "destructive"> = {
  Green: "default",
  Amber: "secondary",
  Red: "destructive",
}

function Bar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-muted">
      <div className="h-2 rounded-full bg-primary" style={{ width: `${value}%` }} />
    </div>
  )
}

export default function NepAnalyticsPage() {
  const rows = NEP_IMPL_SEED
  const s = analyticsSummary(rows)
  const status = statusDistribution(rows)
  const rag = ragDistribution(rows)
  const thrust = byThrustArea(rows)
  const region = byRegionType(rows)
  const risks = atRisk(rows)

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>NEP / SEP Implementation Analytics</PageHeaderHeading>
        <PageHeaderDescription>
          Cross-cutting analytics over NEP-2020 thrust areas and tiers — status mix, RAG health, where momentum is
          strong, and the at-risk shortlist for escalation. Demo figures are seeded; the production tracker reads the
          same shapes from the live database.
        </PageHeaderDescription>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-semibold">{s.avgProgress}%</div>
            <div className="text-sm text-muted-foreground">Average progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-semibold">{s.onTrackPct}%</div>
            <div className="text-sm text-muted-foreground">On track / completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-semibold text-destructive">{s.atRiskCount}</div>
            <div className="text-sm text-muted-foreground">At risk</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-semibold">{s.total}</div>
            <div className="text-sm text-muted-foreground">Rollouts tracked</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>By NEP thrust area</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {thrust.map((t) => (
              <div key={t.key} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{t.key}</span>
                  <span className="text-muted-foreground">{t.avgProgress}%</span>
                </div>
                <Bar value={t.avgProgress} />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status mix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {status.map((x) => (
                  <Badge key={x.status} variant="outline">
                    {x.status}: {x.count}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>RAG health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {rag.map((x) => (
                  <Badge key={x.band} variant={RAG_VARIANT[x.band]}>
                    {x.band}: {x.count}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>By tier</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {region.map((r) => (
                <div key={r.key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{r.key}</span>
                    <span className="text-muted-foreground">
                      {r.avgProgress}% · {r.count}
                    </span>
                  </div>
                  <Bar value={r.avgProgress} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>At-risk shortlist</CardTitle>
        </CardHeader>
        <CardContent>
          {risks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing currently at risk.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Policy</TableHead>
                  <TableHead>Thrust area</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Progress</TableHead>
                  <TableHead>RAG</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {risks.map((r, i) => (
                  <TableRow key={`${r.policyId}-${r.region}-${i}`}>
                    <TableCell className="font-medium">{r.policy}</TableCell>
                    <TableCell className="text-muted-foreground">{r.thrustArea}</TableCell>
                    <TableCell>
                      {r.region} <span className="text-xs text-muted-foreground">({r.regionType})</span>
                    </TableCell>
                    <TableCell>{r.status}</TableCell>
                    <TableCell className="text-right">{r.progress}%</TableCell>
                    <TableCell>
                      <Badge variant={RAG_VARIANT[ragBand(r.progress)]}>{ragBand(r.progress)}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Shell>
  )
}
