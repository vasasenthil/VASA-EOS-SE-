import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { LANGUAGE_CATALOGUE, languageSummary, scripts, type TnRole } from "@/lib/i18n/languages"

const ROLE_VARIANT: Record<TnRole, "default" | "secondary" | "outline"> = {
  primary: "default",
  neighbour: "secondary",
  link: "secondary",
  national: "outline",
  "tribal-minority": "default",
}

export default function LanguagesPage() {
  const s = languageSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Language Catalogue (22-language multilingual)</PageHeaderHeading>
        <PageHeaderDescription>
          The constitutional basis for the platform's multilingual commitment — the 22 languages of the Eighth Schedule —
          plus English (the link language) and Tamil Nadu's tribal / minority mother tongues. Tamil is primary for the TN
          deployment. Runtime translation, speech-to-text and text-to-speech flow through the Bhashini language port.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/accessibility/languages/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.scheduled}</div><div className="text-sm text-muted-foreground">Scheduled languages</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.total}</div><div className="text-sm text-muted-foreground">Total catalogued</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.tribalMinority}</div><div className="text-sm text-muted-foreground">Tribal / minority</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.scripts}</div><div className="text-sm text-muted-foreground">Distinct scripts</div></CardContent></Card>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Language</TableHead>
                <TableHead>Native name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Script</TableHead>
                <TableHead>Eighth Schedule</TableHead>
                <TableHead>TN role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {LANGUAGE_CATALOGUE.map((l) => (
                <TableRow key={l.code}>
                  <TableCell className="font-medium">{l.name}</TableCell>
                  <TableCell lang={l.code} className="text-lg">{l.nativeName}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{l.code}</TableCell>
                  <TableCell className="text-muted-foreground">{l.script}</TableCell>
                  <TableCell className="text-muted-foreground">{l.scheduled ? "Yes" : "—"}</TableCell>
                  <TableCell><Badge variant={ROLE_VARIANT[l.tnRole]}>{l.tnRole}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-2 text-lg font-semibold">Scripts to render ({s.scripts})</h2>
          <p className="text-sm text-muted-foreground">{scripts().join(" · ")}</p>
        </CardContent>
      </Card>
    </Shell>
  )
}
