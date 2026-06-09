import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { ID_STANDARDS, standardsSummary } from "@/lib/data/standards"

export default function DataStandardsPage() {
  const s = standardsSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Master-Data &amp; Identifier Standards</PageHeaderHeading>
        <PageHeaderDescription>
          The canonical identifier and code-system formats the platform speaks — APAAR/PEN, UDISE+, Aadhaar (verify-only),
          ABHA, TN Teacher ID, IFSC, mobile and the class code — each with its issuing authority and a validation pattern
          enforced at the boundary. Interoperability and a single source of truth start here; every example is verified to
          validate against its own pattern.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/data-standards/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.standards}</div><div className="text-sm text-muted-foreground">Identifier standards</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.authorities}</div><div className="text-sm text-muted-foreground">Issuing authorities</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Standard</TableHead>
                <TableHead>Authority</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Example</TableHead>
                <TableHead>Used for</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ID_STANDARDS.map((std) => (
                <TableRow key={std.id}>
                  <TableCell className="font-medium">{std.name}</TableCell>
                  <TableCell className="text-muted-foreground">{std.authority}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{std.pattern}</TableCell>
                  <TableCell className="font-mono text-xs">{std.example}</TableCell>
                  <TableCell className="text-muted-foreground">{std.usedFor}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  )
}
