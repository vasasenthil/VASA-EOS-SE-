import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  INFRASTRUCTURE,
  infraSummary,
  schoolReadiness,
  schoolGaps,
  type Condition,
} from "@/lib/infrastructure"

const conditionVariant: Record<Condition, "default" | "secondary" | "destructive" | "outline"> = {
  good: "default",
  fair: "secondary",
  poor: "destructive",
  absent: "destructive",
}

export default function InfrastructurePage() {
  const s = infraSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Infrastructure &amp; Asset Management</PageHeaderHeading>
        <PageHeaderDescription>
          Facility inventory, condition grading, and an RTE/RPwD-aligned gap analysis across classrooms, water,
          gender-segregated toilets, electricity, ramps and labs — turning Samagra Shiksha / PM SHRI asset data into a
          prioritised works pipeline.
        </PageHeaderDescription>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Schools</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.schools}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Avg readiness</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.avgReadiness}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Mandated gaps</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.mandatedGaps}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Accessibility gaps</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.accessibilityGaps}</div></CardContent></Card>
      </div>

      <div className="space-y-4">
        {INFRASTRUCTURE.map((school) => {
          const gaps = schoolGaps(school)
          return (
            <Card key={school.udise}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{school.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">readiness</span>
                    <Badge variant={schoolReadiness(school) >= 70 ? "default" : "destructive"}>
                      {schoolReadiness(school)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {school.facilities.map((fac) => (
                    <Badge key={fac.key} variant={conditionVariant[fac.condition]}>
                      {fac.label}
                      {fac.required ? " *" : ""}: {fac.condition}
                    </Badge>
                  ))}
                </div>
                {gaps.length ? (
                  <p className="mt-3 text-sm text-destructive">
                    {gaps.length} mandated gap{gaps.length > 1 ? "s" : ""}: {gaps.map((g) => g.label).join(", ")}
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">All mandated facilities meet standard.</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">* RTE / RPwD mandated facility.</p>
    </Shell>
  )
}
