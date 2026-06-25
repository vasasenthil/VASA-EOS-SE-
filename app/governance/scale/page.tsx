import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Check, X } from "lucide-react"
import { TN_SCALE, ADMIN_TREE_CARDINALITY, capacityModel, validateScale } from "@/lib/scale"

export default function ScalePage() {
  const v = validateScale()
  const cap = capacityModel()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>State-Scale Validation</PageHeaderHeading>
        <PageHeaderDescription>
          Tamil Nadu scale: ~{(TN_SCALE.students / 1e7).toFixed(2)} crore students · ~{(TN_SCALE.teachers / 1e5).toFixed(0)}{" "}
          lakh teachers · {TN_SCALE.schools.toLocaleString("en-IN")} schools. Two honest things below: the full
          administrative tree is generated at <strong>true cardinality</strong> ({v.nodes.toLocaleString("en-IN")} nodes)
          and downward-governance scoping is verified correct at that size; and a transparent capacity model for the
          high-cardinality data tiers. A <strong>live load/performance test of deployed infrastructure is still
          pending</strong> — this validates the algorithm and the plan, not a running cluster.
        </PageHeaderDescription>
      </PageHeader>

      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Administrative tree — governance at scale</CardTitle>
            <Badge variant={v.ok ? "default" : "destructive"}>{v.ok ? "all checks pass" : "checks failing"}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {v.checks.map((c) => (
              <li key={c.name} className="flex items-center gap-2 text-sm">
                {c.ok ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-red-600" />}
                <span className="font-medium">{c.name}</span>
                <span className="text-xs text-muted-foreground">{c.detail}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 text-xs text-muted-foreground">
            Tiers: {Object.entries(ADMIN_TREE_CARDINALITY).map(([t, n]) => `${t} ${n.toLocaleString("en-IN")}`).join(" · ")}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Data-tier capacity model (indicative)</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tier</TableHead>
                <TableHead className="text-right">Records</TableHead>
                <TableHead className="text-right">Raw (GB)</TableHead>
                <TableHead className="text-right">Index (GB)</TableHead>
                <TableHead className="text-right">Total (GB)</TableHead>
                <TableHead className="text-right">Shards</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cap.map((e) => (
                <TableRow key={e.label}>
                  <TableCell className="font-medium">{e.label}</TableCell>
                  <TableCell className="text-right tabular-nums">{e.records.toLocaleString("en-IN")}</TableCell>
                  <TableCell className="text-right tabular-nums">{e.rawGB.toLocaleString("en-IN")}</TableCell>
                  <TableCell className="text-right tabular-nums">{e.indexGB.toLocaleString("en-IN")}</TableCell>
                  <TableCell className="text-right tabular-nums">{e.totalGB.toLocaleString("en-IN")}</TableCell>
                  <TableCell className="text-right tabular-nums">{e.shards}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-2 text-xs text-muted-foreground">
            Model only — partition/index sizing for planning. Validate against a provisioned cluster before go-live.
          </p>
        </CardContent>
      </Card>
    </Shell>
  )
}
