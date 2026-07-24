import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderActions, PageHeaderDescription, PageHeaderHeading } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { buildProductionAcceptancePack } from "@/lib/governance/production-acceptance"

export default function AcceptancePackPage() {
  const pack = buildProductionAcceptancePack()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Production Acceptance Pack</PageHeaderHeading>
        <PageHeaderDescription>
          CISO-ready release evidence: inventory ledger, cutover blockers, scheme-regression evidence and governance hierarchy evidence.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/acceptance-pack/markdown">
              <Download className="mr-2 h-4 w-4" />
              Download pack
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="/api/governance/inventory-ledger/csv">
              <Download className="mr-2 h-4 w-4" />
              Inventory CSV
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-6"><div className="text-2xl font-semibold">{pack.inventory.readiness.total}</div><p className="text-sm text-muted-foreground">Inventory artefacts</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-semibold">{pack.cutover.blockers}</div><p className="text-sm text-muted-foreground">Cutover blockers</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-semibold">{pack.cutover.warnings}</div><p className="text-sm text-muted-foreground">Cutover warnings</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-semibold">{pack.sections.length}</div><p className="text-sm text-muted-foreground">Acceptance sections</p></CardContent></Card>
      </div>
      <Card className="mb-6">
        <CardHeader><CardTitle>Acceptance sections</CardTitle><CardDescription>Pass/warn/fail evidence by accountable owner.</CardDescription></CardHeader>
        <CardContent>
          <Table><TableHeader><TableRow><TableHead>Section</TableHead><TableHead>Status</TableHead><TableHead>Owner</TableHead><TableHead>Evidence</TableHead></TableRow></TableHeader><TableBody>
            {pack.sections.map((section) => <TableRow key={section.id}><TableCell className="font-medium">{section.title}</TableCell><TableCell><Badge variant={section.status === "pass" ? "default" : section.status === "warn" ? "secondary" : "destructive"}>{section.status}</Badge></TableCell><TableCell>{section.owner}</TableCell><TableCell>{section.evidence.join("; ")}</TableCell></TableRow>)}
          </TableBody></Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Cutover gate sample</CardTitle><CardDescription>First 20 gates from the fail-closed production cutover report.</CardDescription></CardHeader>
        <CardContent>
          <Table><TableHeader><TableRow><TableHead>Gate</TableHead><TableHead>Status</TableHead><TableHead>Severity</TableHead><TableHead>Detail</TableHead></TableRow></TableHeader><TableBody>
            {pack.cutover.gates.slice(0, 20).map((gate) => <TableRow key={gate.id}><TableCell className="font-mono text-xs">{gate.id}</TableCell><TableCell>{gate.status}</TableCell><TableCell>{gate.severity}</TableCell><TableCell>{gate.detail}</TableCell></TableRow>)}
          </TableBody></Table>
        </CardContent>
      </Card>
    </Shell>
  )
}
