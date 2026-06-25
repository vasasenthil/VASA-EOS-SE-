import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { CABINET_NOTES, CABINET_NOTE_SECTIONS, validateNote, cabinetNoteSummary, type NoteStatus } from "@/lib/governance/cabinet-note"

const STATUS_VARIANT: Record<NoteStatus, "default" | "secondary" | "outline"> = {
  approved: "default",
  vetted: "secondary",
  draft: "outline",
}

export default function CabinetNotePage() {
  const s = cabinetNoteSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Cabinet Note Drafting</PageHeaderHeading>
        <PageHeaderDescription>
          Major school-education decisions reach the Council of Ministers as a Cabinet note. The Secretariat Business
          Rules fix its anatomy — Subject, Background, Proposal, Financial Implications, Legal &amp; Statutory position,
          Inter-departmental Consultation and Recommendation — and each section draws on a platform module (Financial
          Implications on the budget-sanction engine, Consultation on the coordination desk, Legal on the regulatory
          register). A note is not called complete until every mandatory section is filled, so an incomplete draft is
          flagged rather than waved through. {s.complete} of {s.notes} notes are complete.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/cabinet-note/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.notes}</div><div className="text-sm text-muted-foreground">Cabinet notes</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-green-600 dark:text-green-500">{s.approved}</div><div className="text-sm text-muted-foreground">Approved</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.mandatorySections}</div><div className="text-sm text-muted-foreground">Mandatory sections</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.complete}<span className="text-base text-muted-foreground"> / {s.notes}</span></div><div className="text-sm text-muted-foreground">Complete</div></CardContent></Card>
      </div>

      <div className="space-y-4">
        {CABINET_NOTES.map((n) => {
          const v = validateNote(n)
          return (
            <Card key={n.id}>
              <CardContent className="pt-6">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-semibold">{n.id}</span>
                  <Badge variant={STATUS_VARIANT[n.status]}>{n.status}</Badge>
                  <Badge variant={v.ok ? "default" : "outline"}>{v.ok ? "complete" : `${v.missing.length} missing`}</Badge>
                </div>
                <p className="mb-3 font-medium">{n.subject}</p>
                <dl className="space-y-2">
                  {CABINET_NOTE_SECTIONS.map((sec) => {
                    const filled = n.content[sec.key]?.trim()
                    return (
                      <div key={sec.key}>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{sec.heading}</dt>
                        <dd className="text-sm">
                          {filled ? filled : <span className="text-red-600 dark:text-red-500">— not yet drafted —</span>}
                        </dd>
                      </div>
                    )
                  })}
                </dl>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </Shell>
  )
}
