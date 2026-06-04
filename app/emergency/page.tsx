import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  INCIDENTS,
  SCHOOL_SAFETY,
  emergencySummary,
  safetyScore,
  MANDATED_DRILLS,
  type AlertLevel,
} from "@/lib/emergency"

const levelVariant: Record<AlertLevel, "default" | "secondary" | "destructive" | "outline"> = {
  advisory: "outline",
  watch: "secondary",
  warning: "destructive",
  emergency: "destructive",
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "destructive",
  monitoring: "secondary",
  closed: "outline",
}

export default function EmergencyPage() {
  const s = emergencySummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Emergency &amp; Disaster Management</PageHeaderHeading>
        <PageHeaderDescription>
          School-safety readiness, mandated quarterly drill compliance, and a live incident registry with alert levels
          federated to the Tamil Nadu State Disaster Management Authority (TNSDMA).
        </PageHeaderDescription>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active incidents</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.activeIncidents}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Schools affected</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.schoolsAffected}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Highest alert</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold capitalize">{s.highestLevel}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Drill-compliant</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.drillCompliant}/{SCHOOL_SAFETY.length}</div></CardContent></Card>
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle>Incident Registry (TNSDMA)</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Hazard</TableHead>
                <TableHead>District</TableHead>
                <TableHead>Alert</TableHead>
                <TableHead className="text-right">Schools</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reported</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {INCIDENTS.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-mono text-xs">{i.id}</TableCell>
                  <TableCell className="capitalize">{i.hazard}</TableCell>
                  <TableCell>{i.district}</TableCell>
                  <TableCell><Badge variant={levelVariant[i.level]}>{i.level}</Badge></TableCell>
                  <TableCell className="text-right">{i.schoolsAffected}</TableCell>
                  <TableCell><Badge variant={statusVariant[i.status]}>{i.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{i.reportedAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>School Safety Readiness</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {SCHOOL_SAFETY.map((school) => (
            <div key={school.udise}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{school.name}</span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>drills {school.drillsCompleted}/{MANDATED_DRILLS}</span>
                  {school.hasEvacuationPlan ? <Badge variant="outline">evac plan</Badge> : null}
                  {school.hasFireSafety ? <Badge variant="outline">fire safety</Badge> : null}
                  <span>{safetyScore(school)}%</span>
                </span>
              </div>
              <Progress value={safetyScore(school)} className="h-2 mt-1" />
            </div>
          ))}
        </CardContent>
      </Card>
    </Shell>
  )
}
