import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { GOVERNANCE_TIERS, RACI, FORUMS } from "@/lib/governance-framework"

export default function GovernanceFrameworkPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Governance Framework</PageHeaderHeading>
        <PageHeaderDescription>
          7-tier governance hierarchy from national policy to school community, the RACI decision-rights matrix, and the
          recurring coordination forums — policy flows down, accountability flows up, every action auditable.
        </PageHeaderDescription>
      </PageHeader>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>7-Tier Governance Hierarchy</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tier</TableHead>
                <TableHead>Bodies</TableHead>
                <TableHead>Primary Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {GOVERNANCE_TIERS.map((t) => (
                <TableRow key={t.tier}>
                  <TableCell className="font-medium">{t.tier}</TableCell>
                  <TableCell className="text-muted-foreground">{t.bodies}</TableCell>
                  <TableCell>{t.role}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>RACI — Decision Rights</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Decision</TableHead>
                  <TableHead>R</TableHead>
                  <TableHead>A</TableHead>
                  <TableHead>C</TableHead>
                  <TableHead>I</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {RACI.map((r) => (
                  <TableRow key={r.decision}>
                    <TableCell className="font-medium">{r.decision}</TableCell>
                    <TableCell className="text-xs">{r.r}</TableCell>
                    <TableCell className="text-xs">{r.a}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.c}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.i}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Coordination Forums</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {FORUMS.map((f) => (
                <li key={f.name} className="flex items-center justify-between gap-2">
                  <span>{f.name}</span>
                  <Badge variant="outline">{f.frequency}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}
