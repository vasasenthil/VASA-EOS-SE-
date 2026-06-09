import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { byKind, ndearSummary, type NdearStatus, type NdearKind } from "@/lib/compliance/ndear"

const STATUS_VARIANT: Record<NdearStatus, "default" | "secondary" | "destructive"> = {
  implemented: "default",
  partial: "secondary",
  "infra-pending": "destructive",
}

const SECTIONS: { kind: NdearKind; title: string; note: string }[] = [
  { kind: "principle", title: "Design principles", note: "The NDEAR principles for a federated, interoperable, privacy-first education ecosystem" },
  { kind: "building-block", title: "Unbundled building blocks", note: "Independent, replaceable services (identity, registries, content, consent, payments…)" },
]

export default function NdearPage() {
  const s = ndearSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>NDEAR Compliance &amp; Standards</PageHeaderHeading>
        <PageHeaderDescription>
          How the platform maps to the National Digital Education Architecture (NDEAR, NEP 2020) — each design principle
          and unbundled building block bound to the component that satisfies it. Every component reference points at a
          real file and is verified by tests; provider building blocks are <strong>partial</strong> until credentials/MoUs
          flip the ports from mock to live.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/ndear/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.total}</div><div className="text-sm text-muted-foreground">NDEAR items</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-green-600 dark:text-green-500">{s.implemented}</div><div className="text-sm text-muted-foreground">Implemented</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.partial}</div><div className="text-sm text-muted-foreground">Partial (creds at deploy)</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.coveragePct}%</div><div className="text-sm text-muted-foreground">Coverage</div></CardContent></Card>
      </div>

      {SECTIONS.map((section) => (
        <Card key={section.kind} className="mb-6">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <p className="mb-3 text-sm text-muted-foreground">{section.note}</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>NDEAR requirement</TableHead>
                  <TableHead>Component</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byKind(section.kind).map((n) => (
                  <TableRow key={n.id}>
                    <TableCell className="font-medium">{n.name}</TableCell>
                    <TableCell className="text-muted-foreground">{n.requirement}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{n.componentRef}</TableCell>
                    <TableCell><Badge variant={STATUS_VARIANT[n.status]}>{n.status}</Badge></TableCell>
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
