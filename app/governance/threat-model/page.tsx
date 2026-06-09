import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { STRIDE_CATEGORIES, byCategory, threatSummary, type ThreatSeverity, type MitigationStatus, type Stride } from "@/lib/security/threat-model"

const SEV_VARIANT: Record<ThreatSeverity, "secondary" | "default" | "destructive"> = {
  low: "secondary",
  medium: "secondary",
  high: "default",
  critical: "destructive",
}
const STATUS_VARIANT: Record<MitigationStatus, "default" | "secondary" | "destructive"> = {
  mitigated: "default",
  partial: "secondary",
  accepted: "destructive",
}
const STRIDE_LABEL: Record<Stride, string> = {
  spoofing: "Spoofing",
  tampering: "Tampering",
  repudiation: "Repudiation",
  "info-disclosure": "Information disclosure",
  "denial-of-service": "Denial of service",
  elevation: "Elevation of privilege",
}

export default function ThreatModelPage() {
  const s = threatSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>STRIDE Threat Model</PageHeaderHeading>
        <PageHeaderDescription>
          The platform's trust boundaries classified by STRIDE, each threat bound to the in-repo control that mitigates
          it. Every control reference points at a real file and is verified by tests, so the model stays honest.
          Infrastructure controls (WAF / SIEM / Vault-HSM / mTLS) are provisioned at deploy and shown as <strong>partial</strong>.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/threat-model/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.threats}</div><div className="text-sm text-muted-foreground">Threats ({s.categories}/6 STRIDE)</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-green-600 dark:text-green-500">{s.mitigated}</div><div className="text-sm text-muted-foreground">Mitigated</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.partial}</div><div className="text-sm text-muted-foreground">Partial (infra at deploy)</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-destructive">{s.critical}</div><div className="text-sm text-muted-foreground">Critical severity</div></CardContent></Card>
      </div>

      {STRIDE_CATEGORIES.map((cat) => (
        <Card key={cat} className="mb-6">
          <CardContent className="pt-6">
            <h2 className="mb-3 text-lg font-semibold">{STRIDE_LABEL[cat]}</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Boundary</TableHead>
                  <TableHead>Threat</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Mitigation → control</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byCategory(cat).map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.boundary}</TableCell>
                    <TableCell className="text-muted-foreground">{t.threat}</TableCell>
                    <TableCell><Badge variant={SEV_VARIANT[t.severity]}>{t.severity}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{t.mitigation}<div className="font-mono">{t.controlRef}</div></TableCell>
                    <TableCell><Badge variant={STATUS_VARIANT[t.status]}>{t.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </Shell>
  )
}
