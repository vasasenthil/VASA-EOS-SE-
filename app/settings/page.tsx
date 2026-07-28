import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCurrentRole, getHeaderUser } from "@/lib/auth/current-role"
import { PORTALS, type PortalRole } from "@/config/portals"
import { PersonalSettingsForm } from "./personal-settings-form"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const role = (await getCurrentRole()) ?? "PUBLIC"
  const user = await getHeaderUser()
  const portal = PORTALS[role as PortalRole]

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Settings</PageHeaderHeading>
        <PageHeaderDescription>
          Manage your language, accessibility, notification, and regional preferences without changing platform security or administrative configuration.
        </PageHeaderDescription>
      </PageHeader>

      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Session</CardTitle>
            <CardDescription>Who you are signed in as right now.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Identity</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-medium">
                {user?.email ?? "—"}
                {user?.isDemo && (
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">Demo</span>
                )}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Role</p>
              <p className="mt-1 text-sm font-medium">{portal?.label ?? role} <span className="font-mono text-xs text-muted-foreground">({role})</span></p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Tier</p>
              <p className="mt-1"><Badge variant="secondary">{portal?.tier ?? "—"}</Badge></p>
            </div>
          </CardContent>
        </Card>

        {["ADMIN", "SECRETARY"].includes(role) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Administrative configuration</CardTitle>
              <CardDescription>Governed, non-secret operational controls are separated from personal preferences.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <p className="max-w-2xl text-sm text-muted-foreground">Review immutable proposals, approvals, activation schedules, tenant rollout scope, and rollback history. Secrets and live-integration switches remain deployment controlled.</p>
              <Button asChild><Link href="/admin/platform-configuration">Open governed configuration</Link></Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Personal preferences</CardTitle>
            <CardDescription>Review changes before saving them to this device.</CardDescription>
          </CardHeader>
          <CardContent><PersonalSettingsForm /></CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm"><Link href="/profile">View profile</Link></Button>
            {user?.isDemo && (
              <Button asChild variant="outline" size="sm"><Link href="/login/stakeholders">Switch demo role</Link></Button>
            )}
            <form action="/auth/logout" method="POST">
              <Button type="submit" variant="destructive" size="sm">Logout</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}
