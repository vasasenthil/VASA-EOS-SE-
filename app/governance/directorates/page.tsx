import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { DIRECTORATES, directorateSummary, type DirectorateStatus } from "@/lib/governance/directorates"

const STATUS_VARIANT: Record<DirectorateStatus, "default" | "secondary"> = {
  supported: "default",
  partial: "secondary",
}

export default function DirectoratesPage() {
  const s = directorateSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>The Seven Directorates</PageHeaderHeading>
        <PageHeaderDescription>
          One Director portal stands in for all seven directorates of TN School Education. Each carries a distinct
          statutory mandate — School Education, Elementary Education, Government Examinations, SCERT, Non-Formal &amp;
          Adult Education, Public Libraries, and Matriculation/Private-school regulation — and each is mapped here to the
          in-repo module that supports its core function. {s.supported} of {s.directorates} are fully supported; every
          module reference is verified to exist.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/directorates/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.directorates}</div><div className="text-sm text-muted-foreground">Directorates</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-green-600 dark:text-green-500">{s.supported}</div><div className="text-sm text-muted-foreground">Fully supported</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.modulesLinked}</div><div className="text-sm text-muted-foreground">Modules linked</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Directorate</TableHead>
                <TableHead>Mandate</TableHead>
                <TableHead>Focus</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DIRECTORATES.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">
                    <a href={d.route} className="hover:underline">{d.abbr}</a>
                    <div className="text-xs text-muted-foreground">{d.name}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{d.mandate}</TableCell>
                  <TableCell className="text-sm">{d.focus}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{d.moduleRef}</TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[d.status]}>{d.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  )
}
