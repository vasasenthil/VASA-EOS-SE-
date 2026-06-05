import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { USAGE_SERIES, adoptionSummary } from "@/lib/adoption"

export default function AdoptionPage() {
  const s = adoptionSummary()
  const peak = Math.max(...USAGE_SERIES.map((d) => d.activeUsers))
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Adoption &amp; Retention</PageHeaderHeading>
        <PageHeaderDescription>
          The usage curve — daily active users, stickiness, week-over-week growth and daily-loop completion. The signal a
          pilot puts in front of leadership: are teachers coming back and finishing the loop?
        </PageHeaderDescription>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">DAU</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.dau}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Stickiness (DAU/WAU)</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.stickiness}%</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">WoW growth</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">+{s.weekOverWeekGrowthPct}%</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Loop completion</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.loopCompletionPct}%</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily active users (14 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1.5 h-40">
            {USAGE_SERIES.map((d) => (
              <div key={d.date} className="flex flex-1 flex-col items-center justify-end gap-1" title={`${d.date}: ${d.activeUsers} DAU · ${d.loopCompletedPct}% loop`}>
                <div className="w-full rounded-t bg-primary/80" style={{ height: `${Math.round((d.activeUsers / peak) * 100)}%` }} />
                <span className="text-[9px] text-muted-foreground">{d.date.slice(8)}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Seeded demo series; production reads the event stream.</p>
        </CardContent>
      </Card>
    </Shell>
  )
}
