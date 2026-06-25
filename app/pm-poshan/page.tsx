import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { planWeeklyMenu, summarizeNutrition, procurementStatus, MOTHER_COMMITTEE_CHECKLIST } from "@/lib/meals"
import { ReconPanel } from "./recon-panel"

export default function PmPoshanPage() {
  const menu = planWeeklyMenu()
  const procurement = procurementStatus()

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>PM POSHAN / CMBS Operations</PageHeaderHeading>
        <PageHeaderDescription>
          Mid-day meal (PM POSHAN) + Chief Minister&apos;s Breakfast Scheme at ~1.27 Cr scale — AI menu planning (FSSAI
          norms), GeM procurement with IoT cold chain, daily reconciliation and mother-committee oversight.
        </PageHeaderDescription>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Daily Beneficiaries</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">1.27 Cr</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Breakfast (CMBS)</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">Classes 1-5</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Egg Days / Week</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{menu.filter((d) => d.egg).length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">FSSAI Compliance</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{menu.every((d) => summarizeNutrition(d).meetsFssai) ? "Pass" : "Review"}</div></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <Card>
          <CardHeader><CardTitle>Weekly Menu (AI-planned)</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Day</TableHead>
                  <TableHead>Breakfast</TableHead>
                  <TableHead>Lunch</TableHead>
                  <TableHead>Egg</TableHead>
                  <TableHead className="text-right">kcal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {menu.map((d) => {
                  const n = summarizeNutrition(d)
                  return (
                    <TableRow key={d.day}>
                      <TableCell className="font-medium">{d.day}</TableCell>
                      <TableCell>{d.breakfast.map((m) => m.name).join(", ")}</TableCell>
                      <TableCell>{d.lunch.map((m) => m.name).join(", ")}</TableCell>
                      <TableCell>{d.egg ? "Yes" : "—"}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={n.meetsFssai ? "default" : "destructive"}>{n.calories}</Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Procurement (GeM + PDS, cold chain)</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {procurement.map((p) => (
                  <li key={p.item} className="flex items-center justify-between gap-2">
                    <span>
                      {p.item} <span className="text-muted-foreground">· {p.source}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      {p.coldChain ? <Badge variant="outline">cold chain</Badge> : null}
                      <Badge variant={p.status === "delivered" ? "default" : "secondary"}>{p.status}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Mother-Committee Oversight</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm list-disc list-inside text-muted-foreground">
                {MOTHER_COMMITTEE_CHECKLIST.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <ReconPanel />
    </Shell>
  )
}
