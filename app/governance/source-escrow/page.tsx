import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderDescription, PageHeaderHeading } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { generateSourceEscrowManifest } from "@/lib/sovereignty/escrow"

export default function SourceEscrowPage() {
  const manifest = generateSourceEscrowManifest({ release: "2026.07.21", generatedAt: "2026-07-21T00:00:00.000Z" })

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Source-Code Escrow Manifest — L1</PageHeaderHeading>
        <PageHeaderDescription>
          Technical custody manifest for the State-operated build and recovery package. It hashes build-critical source,
          deployment and migration artifacts without exposing secrets or child records.
        </PageHeaderDescription>
      </PageHeader>

      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Manifest</CardTitle></CardHeader><CardContent className="font-mono text-sm">{manifest.manifestId}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Artifacts</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{manifest.artifacts.length}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Legal status</CardTitle></CardHeader><CardContent><Badge variant="secondary">{manifest.legalStatus}</Badge></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Build commands</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{manifest.buildCommands.length}</CardContent></Card>
      </div>

      <div className="mb-4"><Button asChild variant="outline" size="sm"><a href="/api/governance/source-escrow/csv" download>Download manifest CSV</a></Button></div>

      <Card className="mb-4">
        <CardHeader><CardTitle>Custody assurance</CardTitle></CardHeader>
        <CardContent><ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">{manifest.publicAssurance.map((line) => <li key={line}>{line}</li>)}</ul></CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {manifest.artifacts.map((artifact) => (
          <Card key={artifact.path}>
            <CardHeader className="pb-2"><CardTitle className="text-base">{artifact.path}</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>{artifact.purpose}</p>
              <p className="break-all font-mono text-xs text-muted-foreground">sha256:{artifact.sha256}</p>
              <Badge variant="outline">{artifact.bytes} bytes</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </Shell>
  )
}
