import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { listApplications, recognitionSummary } from "@/lib/recognition"
import { RecognitionBoard } from "./recognition-board"

export default function RecognitionPage() {
  const apps = listApplications()
  const s = recognitionSummary(apps)
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>School Recognition Workflow (TN 1973)</PageHeaderHeading>
        <PageHeaderDescription>
          A staged recognition and renewal pipeline under the Tamil Nadu Recognised Private Schools (Regulation) Act 1973
          — application, document verification, physical inspection, DEO review and recognition. Every transition is
          written to the tamper-evident audit ledger.
        </PageHeaderDescription>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Applications</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">In progress</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.inProgress}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Recognised</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.recognised}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.rejected}</div></CardContent></Card>
      </div>

      <RecognitionBoard initial={apps} />
    </Shell>
  )
}
