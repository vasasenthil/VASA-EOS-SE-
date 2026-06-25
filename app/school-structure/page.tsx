import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SCHOOL_STAGES, SCHOOL_CATEGORIES, structureSummary } from "@/lib/school-structure"

export const metadata = {
  title: "School Structure — VASA-EOS(SE)",
  description: "NEP 2020 5+3+3+4 stages and the Tamil Nadu school-category registry.",
}

function gradeLabel(g: number): string {
  return g === 0 ? "Pre-primary" : `Grade ${g}`
}

export default function SchoolStructurePage() {
  const s = structureSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>School Structure &amp; Categories</PageHeaderHeading>
        <PageHeaderDescription>
          The NEP 2020 <strong>5+3+3+4</strong> curricular stages and the Tamil Nadu school-category registry —
          the reference dimensions SIS, dashboards and reports classify against.
        </PageHeaderDescription>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.stages}</div><div className="text-sm text-muted-foreground">NEP stages</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.totalGrades}</div><div className="text-sm text-muted-foreground">Grades (incl. pre-primary)</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.categories}</div><div className="text-sm text-muted-foreground">School categories</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.managements}</div><div className="text-sm text-muted-foreground">Management types</div></CardContent></Card>
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle>NEP 2020 — 5+3+3+4 stages</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stage</TableHead>
                <TableHead>Span</TableHead>
                <TableHead>Grades</TableHead>
                <TableHead>Ages</TableHead>
                <TableHead>Focus</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SCHOOL_STAGES.map((st) => (
                <TableRow key={st.code}>
                  <TableCell className="font-medium">{st.name}</TableCell>
                  <TableCell className="text-muted-foreground">{st.span}</TableCell>
                  <TableCell>{st.grades.map(gradeLabel).join(", ")}</TableCell>
                  <TableCell>{st.ageRange[0]}–{st.ageRange[1] - 1}</TableCell>
                  <TableCell className="text-muted-foreground">{st.focus}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tamil Nadu school-category registry</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Management</TableHead>
                <TableHead>Funding</TableHead>
                <TableHead>Board</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SCHOOL_CATEGORIES.map((c) => (
                <TableRow key={c.code}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell><Badge variant="secondary">{c.management.replace("_", " ")}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{c.funding}</TableCell>
                  <TableCell className="text-muted-foreground">{c.board}</TableCell>
                  <TableCell className="text-muted-foreground">{c.note}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  )
}
