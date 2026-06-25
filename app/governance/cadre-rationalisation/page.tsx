import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import {
  SCHOOL_CADRE,
  RTE_PTR,
  requiredTeachers,
  balance,
  vacancy,
  classify,
  redeploymentPlan,
  cadreSummary,
  type CadreClass,
} from "@/lib/postings/cadre"

const CLASS_VARIANT: Record<CadreClass, "default" | "secondary" | "outline"> = {
  surplus: "secondary",
  deficit: "outline",
  balanced: "default",
}

export default function CadreRationalisationPage() {
  const s = cadreSummary()
  const plan = redeploymentPlan()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Teacher-Cadre / PTR Rationalisation</PageHeaderHeading>
        <PageHeaderDescription>
          RTE §25 fixes a pupil-teacher ratio ({RTE_PTR}:1); meeting it statewide is a redeployment problem before it is
          a hiring one. Each school&apos;s working strength is measured against the teachers its enrolment requires,
          classifying it surplus, deficit or balanced — then a counselling-based plan moves excess teachers from surplus
          to deficit schools. {s.redeployable} posts can be met by redeployment before any fresh recruitment
          (state PTR {s.statePtr}:1).
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/cadre-rationalisation/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.schools}</div><div className="text-sm text-muted-foreground">Schools</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.surplus}<span className="text-base text-muted-foreground"> / {s.deficit}</span></div><div className="text-sm text-muted-foreground">Surplus / deficit</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-green-600 dark:text-green-500">{s.redeployable}</div><div className="text-sm text-muted-foreground">Redeployable posts</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.vacancies}</div><div className="text-sm text-muted-foreground">Unfilled sanctioned posts</div></CardContent></Card>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="mb-3 text-sm font-semibold">Schools — working strength vs RTE requirement</div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>School</TableHead>
                <TableHead>District</TableHead>
                <TableHead className="text-right">Enrolment</TableHead>
                <TableHead className="text-right">Required</TableHead>
                <TableHead className="text-right">Working</TableHead>
                <TableHead className="text-right">Vacancy</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Class</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SCHOOL_CADRE.map((c) => (
                <TableRow key={c.school}>
                  <TableCell className="font-medium">{c.school}</TableCell>
                  <TableCell className="text-muted-foreground">{c.district}</TableCell>
                  <TableCell className="text-right">{c.enrolment}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{requiredTeachers(c)}</TableCell>
                  <TableCell className="text-right">{c.working}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{vacancy(c)}</TableCell>
                  <TableCell className="text-right">{balance(c) > 0 ? `+${balance(c)}` : balance(c)}</TableCell>
                  <TableCell><Badge variant={CLASS_VARIANT[classify(c)]}>{classify(c)}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-3 text-sm font-semibold">Counselling-based redeployment plan</div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>From (surplus)</TableHead>
                <TableHead>To (deficit)</TableHead>
                <TableHead className="text-right">Teachers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plan.map((m, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{m.from}</TableCell>
                  <TableCell>{m.to}</TableCell>
                  <TableCell className="text-right">{m.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  )
}
