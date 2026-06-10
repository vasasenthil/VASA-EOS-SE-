import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { GREEN_COMMITMENTS, greenSummary, type GreenStatus } from "@/lib/esg/green-school"

const STATUS_VARIANT: Record<GreenStatus, "default" | "secondary"> = {
  enforced: "default",
  partial: "secondary",
}

export default function GreenSchoolGovernancePage() {
  const s = greenSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Green-School Sustainability</PageHeaderHeading>
        <PageHeaderDescription>
          NEP 2020 §4.7 and the PM SHRI green-school vision make every campus a site of environmental stewardship, and
          SDG 4.7 makes climate literacy a learning outcome. Each sustainability commitment — clean energy, water
          stewardship, sanitation, waste circularity, green cover, nutrition gardens, environmental literacy, a healthy
          campus and climate accountability — is mapped to the in-repo mechanism that operationalises it and the SDG it
          advances. WASH and climate accountability are enforced today; commitments needing live sensor feeds (solar
          metering, water telemetry) are honestly <strong>partial</strong>. Every component reference is verified to exist.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/green-school/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.commitments}</div><div className="text-sm text-muted-foreground">Green commitments</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-green-600 dark:text-green-500">{s.enforced}</div><div className="text-sm text-muted-foreground">Enforced in code</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.sdgsCovered}</div><div className="text-sm text-muted-foreground">SDGs advanced</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Commitment</TableHead>
                <TableHead>SDG</TableHead>
                <TableHead>Mechanism</TableHead>
                <TableHead>Component</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {GREEN_COMMITMENTS.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.commitment}</TableCell>
                  <TableCell className="text-muted-foreground">{c.sdg}</TableCell>
                  <TableCell className="text-muted-foreground">{c.mechanism}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{c.controlRef}</TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[c.status]}>{c.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  )
}
