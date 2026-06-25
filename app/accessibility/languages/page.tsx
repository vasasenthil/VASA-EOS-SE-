import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Download } from "lucide-react"
import { LANGUAGE_CATALOGUE, languageSummary, scripts, type TnRole } from "@/lib/i18n/languages"
import { coverageReport } from "@/lib/i18n/translate"

const ROLE_VARIANT: Record<TnRole, "default" | "secondary" | "outline"> = {
  primary: "default",
  neighbour: "secondary",
  link: "secondary",
  national: "outline",
  "tribal-minority": "default",
}

export default function LanguagesPage() {
  const s = languageSummary()
  const cov = coverageReport()
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

      <Card className="mb-6">
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold">In-app UI string coverage</h2>
          <p className="mt-1 mb-4 text-sm text-muted-foreground">
            Honest, measured coverage of the {cov.coreKeys} committed core UI strings (navigation + common actions) across the
            switchable locales — not just a catalogue claim. Tamil is fully localised (TN-first); English and Hindi are
            complete; the neighbouring scheduled languages carry the core set and fall back to English for the rest.
            <strong> {cov.complete} complete · {cov.partial} partial</strong>, {cov.averagePct}% mean coverage. The remaining
            scheduled languages route through the Bhashini language port at runtime.
          </p>
          <div className="space-y-3">
            {cov.locales.map((l) => (
              <div key={l.locale} className="grid grid-cols-12 items-center gap-3">
                <div className="col-span-4 sm:col-span-3 text-sm"><span lang={l.locale} className="font-medium">{l.nativeLabel}</span> <span className="text-muted-foreground">({l.label})</span></div>
                <div className="col-span-5 sm:col-span-7"><Progress value={l.pct} /></div>
                <div className="col-span-3 sm:col-span-2 text-right text-sm">
                  <Badge variant={l.pct === 100 ? "default" : "secondary"}>{l.pct}%</Badge>
                  <span className="ml-2 text-xs text-muted-foreground">{l.covered}/{l.total}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t pt-4">
            <Button asChild variant="outline" size="sm">
              <a href="/api/i18n/messages" download>
                <Download className="mr-2 h-4 w-4" />
                Translator export (TMS-ready JSON)
              </a>
            </Button>
            <p className="text-xs text-muted-foreground">
              Git-native bridge: the committed catalogue as deterministic JSON for a self-hostable TMS (Weblate / Inlang) to
              round-trip through Git. Sovereign by construction — no string leaves the repo to a cloud service.
            </p>
          </div>
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
