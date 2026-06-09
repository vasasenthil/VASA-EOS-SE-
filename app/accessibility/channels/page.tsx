import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { CHANNELS, IVR_FLOWS, channelSummary, type Modality } from "@/lib/accessibility/channels"
import { languageByCode } from "@/lib/i18n/languages"

const MODALITY_VARIANT: Record<Modality, "default" | "secondary" | "outline"> = {
  voice: "default",
  visual: "secondary",
  text: "outline",
}

export default function ChannelsPage() {
  const s = channelSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Multi-Channel &amp; IVR Access</PageHeaderHeading>
        <PageHeaderDescription>
          Reaching every guardian — including low-literacy and rural — means more than a web portal. These are the access
          channels and the core voice IVR journeys (attendance, scheme status, results, grievance). Each IVR flow is
          offered in multiple languages and backed by a real platform module; both are verified by tests.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/accessibility/channels/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.channels}</div><div className="text-sm text-muted-foreground">Access channels</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.noLiteracyChannels}</div><div className="text-sm text-muted-foreground">No-literacy channels</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.ivrFlows}</div><div className="text-sm text-muted-foreground">IVR voice flows</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.ivrLanguages}</div><div className="text-sm text-muted-foreground">IVR languages</div></CardContent></Card>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <h2 className="mb-3 text-lg font-semibold">Access channels</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Channel</TableHead>
                <TableHead>Modality</TableHead>
                <TableHead>Literacy</TableHead>
                <TableHead>Offline</TableHead>
                <TableHead>Audience</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CHANNELS.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell><Badge variant={MODALITY_VARIANT[c.modality]}>{c.modality}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{c.literacyRequired ? "required" : "not required"}</TableCell>
                  <TableCell className="text-muted-foreground">{c.offlineCapable ? "yes" : "no"}</TableCell>
                  <TableCell className="text-muted-foreground">{c.audience}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-3 text-lg font-semibold">IVR voice journeys</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {IVR_FLOWS.map((f) => (
              <div key={f.id} className="rounded-lg border p-4">
                <div className="font-medium">{f.title}</div>
                <p className="mb-2 text-sm text-muted-foreground">{f.journey}</p>
                <div className="mb-2 flex flex-wrap gap-1">
                  {f.languages.map((code) => (
                    <Badge key={code} variant="secondary" lang={code}>{languageByCode(code)?.nativeName ?? code}</Badge>
                  ))}
                </div>
                <ul className="text-xs text-muted-foreground">
                  {f.keypad.map((k) => <li key={k}>📞 {k}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </Shell>
  )
}
