import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { pressKit, commsSummary, type CommsStatus } from "@/lib/governance/public-communication"

const STATUS_VARIANT: Record<CommsStatus, "default" | "secondary" | "outline"> = {
  published: "default",
  cleared: "secondary",
  draft: "outline",
}

export default function PublicCommunicationPage() {
  const s = commsSummary()
  const kit = pressKit()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Public Communication Desk</PageHeaderHeading>
        <PageHeaderDescription>
          The executive&apos;s citizen-facing voice — press notes, web bulletins, SMS and social posts. Every
          announcement is composed <strong>from live platform data</strong>, so a figure quoted to the press can never
          disagree with the State&apos;s own dashboard, with the source cited and a clearance status before publication.
          {s.published} of {s.announcements} are published across {s.channels} channels.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/public-communication/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download press kit (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.announcements}</div><div className="text-sm text-muted-foreground">Announcements</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-green-600 dark:text-green-500">{s.published}</div><div className="text-sm text-muted-foreground">Published</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.cleared}</div><div className="text-sm text-muted-foreground">Cleared</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-muted-foreground">{s.draft}</div><div className="text-sm text-muted-foreground">Draft</div></CardContent></Card>
      </div>

      <div className="space-y-4">
        {kit.map((a) => (
          <Card key={a.id}>
            <CardContent className="pt-6">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{a.channel}</Badge>
                <Badge variant={STATUS_VARIANT[a.status]}>{a.status}</Badge>
                <span className="text-sm text-muted-foreground">{a.audience}</span>
              </div>
              <p className="font-medium">{a.title}</p>
              <p className="mt-1 text-sm">{a.body}</p>
              <p className="mt-2 text-xs text-muted-foreground">Source: <span className="font-mono">{a.sourceRef}</span></p>
            </CardContent>
          </Card>
        ))}
      </div>
    </Shell>
  )
}
