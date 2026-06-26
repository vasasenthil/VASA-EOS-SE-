import type { ReactNode } from "react"
import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCurrentRole, getHeaderUser } from "@/lib/auth/current-role"
import { PORTALS, DEFAULT_GRANTS, type PortalRole } from "@/config/portals"

export const dynamic = "force-dynamic"

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  )
}

export default async function ProfilePage() {
  const role = (await getCurrentRole()) ?? "PUBLIC"
  const user = await getHeaderUser()
  const portal = PORTALS[role as PortalRole]
  const grants = DEFAULT_GRANTS[role as PortalRole] ?? []
  const initials = (user?.name ?? "U").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>My Profile</PageHeaderHeading>
        <PageHeaderDescription>
          Your signed-in identity, role, jurisdiction tier and the access (RBAC) grants your role carries.
        </PageHeaderDescription>
      </PageHeader>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-lg font-semibold">{initials}</div>
              <div>
                <CardTitle className="text-lg">{user?.name ?? "Signed in"}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  {user?.email}
                  {user?.isDemo && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                      Demo session
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Role" value={portal?.label ?? role} />
            <Field label="Role code" value={<span className="font-mono">{role}</span>} />
            <Field label="Governance tier" value={<Badge variant="secondary">{portal?.tier ?? "—"}</Badge>} />
            <Field label="Portal home" value={portal ? <Link href={portal.home} className="text-primary underline underline-offset-2">{portal.home}</Link> : "—"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Access grants (RBAC)</CardTitle>
            <CardDescription>
              The actions this role is permitted by default. Final access is decided server-side by the unified PDP
              (RBAC + ABAC + ReBAC, deny-wins). {grants.includes("*") ? "This role holds the wildcard (full) grant." : `${grants.length} grant(s).`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {grants.length === 0 ? (
                <p className="text-sm text-muted-foreground">No default grants.</p>
              ) : (
                grants.map((g) => (
                  <Badge key={g} variant={g === "*" ? "default" : "outline"} className="font-mono text-xs">{g}</Badge>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Role description</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">{portal?.description ?? "—"}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button asChild variant="outline" size="sm"><Link href="/settings">Settings</Link></Button>
              <Button asChild variant="outline" size="sm"><Link href="/governance/access">Access Explorer</Link></Button>
              {user?.isDemo && (
                <Button asChild variant="outline" size="sm"><Link href="/login/stakeholders">Switch demo role</Link></Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}
