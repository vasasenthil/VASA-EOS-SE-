import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DIRECTORY, grantsForUser, directorySummary, DEMO_PASSWORD } from "@/lib/directory"
import { getOrg } from "@/lib/org"

function attrs(a?: Record<string, string | number | boolean>): string {
  if (!a) return "—"
  return Object.entries(a)
    .map(([k, v]) => `${k}=${v}`)
    .join(" · ")
}

function relations(r?: Record<string, string[]>): string {
  if (!r) return "—"
  return Object.entries(r)
    .map(([k, v]) => `${k}: ${v.join(", ")}`)
    .join(" · ")
}

export default function DirectoryPage() {
  const s = directorySummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>User Directory &amp; IAM</PageHeaderHeading>
        <PageHeaderDescription>
          Every category of user across the governance hierarchy, each bound to an org unit and to the five access models
          — RBAC role grants, ABAC attributes, ReBAC relations (PBAC/CABAC applied by the PDP). Verify any decision in the
          Access Explorer.
        </PageHeaderDescription>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Users</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Roles</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.roles}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Tiers</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.tiers}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role · Tier</TableHead>
                <TableHead>Org unit</TableHead>
                <TableHead>RBAC grants</TableHead>
                <TableHead>ABAC attributes</TableHead>
                <TableHead>ReBAC relations</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DIRECTORY.map((d) => {
                const grants = grantsForUser(d)
                return (
                  <TableRow key={d.id}>
                    <TableCell>
                      <div className="font-medium">{d.name}</div>
                      <div className="text-xs text-muted-foreground">{d.designation} · <span className="font-mono">{d.email}</span></div>
                    </TableCell>
                    <TableCell>
                      <Badge>{d.role}</Badge> <span className="text-xs text-muted-foreground">{d.tier}</span>
                    </TableCell>
                    <TableCell className="text-sm">{getOrg(d.orgId)?.name ?? d.orgId}</TableCell>
                    <TableCell className="font-mono text-xs">{grants.includes("*") ? "* (all)" : grants.join(", ")}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{attrs(d.attributes)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{relations(d.relations)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <p className="mt-4 text-xs text-muted-foreground">
            Demo sign-in: username as shown (or its email) with the shared demo password{" "}
            <span className="font-mono">{DEMO_PASSWORD}</span>. Demo only — production uses SSO/Supabase Auth + MFA and
            never ships passwords. See <span className="font-mono">docs/CREDENTIALS.md</span>.
          </p>
        </CardContent>
      </Card>
    </Shell>
  )
}
