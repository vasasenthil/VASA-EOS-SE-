import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { EXAM_INTEGRITY_CONTROLS, examIntegritySummary, type ExamIntegrityStatus } from "@/lib/exams/integrity"

const STATUS_VARIANT: Record<ExamIntegrityStatus, "default" | "secondary"> = {
  enforced: "default",
  partial: "secondary",
}

export default function ExamIntegrityPage() {
  const s = examIntegritySummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Examination Integrity</PageHeaderHeading>
        <PageHeaderDescription>
          Board examinations decide a child&apos;s future; their credibility is a public trust. Each malpractice and
          fraud vector across the exam lifecycle — paper leaks, predictable papers, impersonation, mass copying, OMR
          tampering, result tampering, certificate forgery, anchor tampering and marksheet-privacy breaches — is mapped
          to the control that closes it and the stage it guards. Anchoring and certificate verification are enforced
          today; controls needing live infra (KMS-encrypted distribution, invigilation cameras) are honestly
          <strong> partial</strong> until provisioned. Every component reference is verified to exist.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/exam-integrity/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.controls}</div><div className="text-sm text-muted-foreground">Integrity controls</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-green-600 dark:text-green-500">{s.enforced}</div><div className="text-sm text-muted-foreground">Enforced in code</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.stagesCovered}</div><div className="text-sm text-muted-foreground">Lifecycle stages guarded</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Malpractice / fraud vector</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Control</TableHead>
                <TableHead>Component</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {EXAM_INTEGRITY_CONTROLS.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.vector}</TableCell>
                  <TableCell className="text-muted-foreground">{c.stage}</TableCell>
                  <TableCell className="text-muted-foreground">{c.control}</TableCell>
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
