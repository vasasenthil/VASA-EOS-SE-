import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { HOSTELS, vacancy, occupancyPct, allocate, hostelSummary } from "@/lib/hostel/allocation"

export default function HostelAllocationPage() {
  const s = hostelSummary()
  const alloc = allocate()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Hostel Allocation (Adi Dravidar / Tribal Welfare)</PageHeaderHeading>
        <PageHeaderDescription>
          Residential hostels let children from remote, disadvantaged homes stay in school. Seats are scarce, so
          allocation is need-first, not first-come: each applicant is scored by social-category need and travel
          distance, then vacancies are filled highest-need-first and the rest waitlisted. {s.totalVacancy} seats free,
          {" "}{s.allotted} allotted, {s.waitlisted} waitlisted ({s.avgOccupancyPct}% average occupancy).
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/hostel-allocation/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.totalCapacity}</div><div className="text-sm text-muted-foreground">Total capacity</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.avgOccupancyPct}%</div><div className="text-sm text-muted-foreground">Avg occupancy</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-green-600 dark:text-green-500">{s.allotted}</div><div className="text-sm text-muted-foreground">Allotted</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-amber-600 dark:text-amber-500">{s.waitlisted}</div><div className="text-sm text-muted-foreground">Waitlisted</div></CardContent></Card>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="mb-3 text-sm font-semibold">Hostels</div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hostel</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="w-40">Occupancy</TableHead>
                <TableHead className="text-right">Vacancy</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {HOSTELS.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="font-medium">{h.name}</TableCell>
                  <TableCell className="text-muted-foreground">{h.type}</TableCell>
                  <TableCell><Progress value={occupancyPct(h)} /></TableCell>
                  <TableCell className="text-right">{vacancy(h)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-3 text-sm font-semibold">Allocation (need-first)</div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Distance</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead>Outcome</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alloc.map((r) => (
                <TableRow key={r.applicant.studentId}>
                  <TableCell className="font-mono text-xs">{r.applicant.studentId}</TableCell>
                  <TableCell className="text-muted-foreground">{r.applicant.type}</TableCell>
                  <TableCell>{r.applicant.category}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{r.applicant.distanceKm} km</TableCell>
                  <TableCell className="text-right">{r.score}</TableCell>
                  <TableCell>
                    <Badge variant={r.outcome === "allotted" ? "default" : "outline"} className={r.outcome === "waitlisted" ? "border-amber-500 text-amber-600 dark:text-amber-500" : ""}>
                      {r.outcome}{r.hostelId ? ` · ${r.hostelId}` : ""}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  )
}
