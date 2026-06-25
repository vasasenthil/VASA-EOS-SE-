import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Network } from "lucide-react"
import { getLogAction } from "../actions"
import { ReconcileControls } from "../components/log-actions"
import { safeDate } from "@/lib/format-date"

export const dynamic = "force-dynamic"

export default async function FederationLogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const l = await getLogAction(id)

  if (!l) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Log not found</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>We couldn&apos;t find this federation log. It may have been removed.</p>
            <Button asChild variant="outline" size="sm"><Link href="/federation"><ArrowLeft className="mr-2 h-4 w-4" />Back to federation</Link></Button>
          </CardContent>
        </Card>
      </Shell>
    )
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading className="flex items-center gap-2"><Network className="h-5 w-5 text-indigo-600" />{l.sourceLabel}</PageHeaderHeading>
        <PageHeaderDescription>Lookup key: {l.key}</PageHeaderDescription>
        <PageHeaderActions>
          <ReconcileControls log={l} />
        </PageHeaderActions>
      </PageHeader>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm"><Link href="/federation"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button>
        <Badge className={l.status === "Reconciled" ? "bg-green-100 text-green-700 border-0" : l.status === "Flagged" ? "bg-red-100 text-red-700 border-0" : "bg-amber-100 text-amber-700 border-0"}>{l.status}</Badge>
        <Badge variant="outline">{l.mode === "live" ? "live gateway" : "mock"}</Badge>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Federated record (source of truth)</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="leading-relaxed">{l.summary}</p>
          <div className="flex justify-between border-t pt-3"><span className="text-muted-foreground">Source</span><span className="font-medium">{l.sourceLabel}</span></div>
          <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Looked up</span><span>{safeDate(l.createdAt, "dd MMM yyyy")}</span></div>
          <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Reconciled by</span><span className="font-medium">{l.reconciledBy || "— (pending)"}</span></div>
          {l.notes ? <div><p className="text-muted-foreground">Notes</p><p className="mt-1">{l.notes}</p></div> : null}
        </CardContent>
      </Card>
    </Shell>
  )
}
