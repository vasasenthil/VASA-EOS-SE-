import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { GlossaryBoard } from "./glossary-board"
import { glossarySummary } from "@/lib/glossary"

export const metadata = {
  title: "Abbreviations & Expansions — VASA-EOS(SE)",
  description: "Searchable glossary of every acronym used across the Tamil Nadu education platform.",
}

export default function GlossaryPage() {
  const s = glossarySummary()

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Abbreviations &amp; Expansions</PageHeaderHeading>
        <PageHeaderDescription>
          A plain-language glossary of every acronym used across the platform — policy,
          identity, schemes, roles, assessment, safety and technology. Search or filter by theme.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/glossary/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download CSV
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-semibold">{s.total}</div>
            <div className="text-sm text-muted-foreground">Terms defined</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-semibold">{s.categories}</div>
            <div className="text-sm text-muted-foreground">Categories</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-semibold">{s.withNotes}</div>
            <div className="text-sm text-muted-foreground">With context notes</div>
          </CardContent>
        </Card>
      </div>

      <GlossaryBoard />
    </Shell>
  )
}
