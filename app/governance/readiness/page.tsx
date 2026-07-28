import Link from "next/link"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader, PageHeaderDescription, PageHeaderHeading } from "@/components/page-header"
import { Shell } from "@/components/shell"
import { getSession } from "@/lib/auth/session"
import { buildReadinessLedger, type ReadinessClassification } from "@/lib/governance/readiness-ledger"

export const dynamic = "force-dynamic"

const ORDER: ReadinessClassification[] = ["not-built", "placeholder", "mock-backed", "partially-built", "documented-only", "externally-gated"]

export default async function ReadinessPage() {
  const session = await getSession()
  if (!session) redirect("/login")
  if (!session.roles.some((role) => ["ADMIN", "SECRETARY", "DIRECTOR"].includes(role))) redirect("/governance/dashboard")

  const ledger = buildReadinessLedger()
  return <Shell>
    <PageHeader>
      <PageHeaderHeading>Sovereign Readiness Backlog</PageHeaderHeading>
      <PageHeaderDescription>Repository-scanned inventory of incomplete, placeholder, mock-backed, documented-only, and externally gated capability evidence, ranked by sovereign risk.</PageHeaderDescription>
    </PageHeader>

    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
      {ORDER.map((classification) => <Card key={classification}><CardHeader className="pb-2"><CardDescription>{classification}</CardDescription><CardTitle>{ledger.summary[classification]}</CardTitle></CardHeader></Card>)}
    </div>

    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Ranked remediation queue</CardTitle>
        <CardDescription>{ledger.scannedFiles} evidence files scanned. External prerequisites remain visible and are not falsely represented as software-complete.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {ledger.findings.slice(0, 100).map((finding) => <article key={finding.id} className="rounded-lg border p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">#{finding.rank}</span>
            <Badge variant={finding.score >= 90 ? "destructive" : "secondary"}>{finding.score}</Badge>
            <Badge variant="outline">{finding.classification}</Badge>
            <Badge variant="outline">{finding.domain}</Badge>
          </div>
          <p className="mt-2 break-all font-mono text-xs">{finding.path}</p>
          <p className="mt-1 text-sm text-muted-foreground">{finding.reason}</p>
        </article>)}
      </CardContent>
    </Card>

    <div className="mt-6 flex flex-wrap gap-2">
      <Button asChild><Link href="/api/governance/readiness-ledger/csv">Download complete CSV</Link></Button>
      <Button asChild variant="outline"><Link href="/governance/dashboard">Back to overview</Link></Button>
    </div>
  </Shell>
}
