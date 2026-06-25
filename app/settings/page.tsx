import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/language-switcher"
import { AccessibilityQuickToggle } from "@/components/accessibility-quick-toggle"
import { getCurrentRole, getHeaderUser } from "@/lib/auth/current-role"
import { PORTALS, type PortalRole } from "@/config/portals"

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
          Your preferences and session. Production SSO/MFA is not wired on this deployment — sign-in uses the demo
          identity, so account-level changes are limited here.
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

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Preferences</CardTitle>
            <CardDescription>Language and accessibility apply across the whole console.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Language</p>
                <p className="text-xs text-muted-foreground">Tamil (TN-first) / English / Hindi complete; others partial.</p>
              </div>
              <LanguageSwitcher />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Accessibility</p>
                <p className="text-xs text-muted-foreground">Quick toggles (contrast, motion, text size). Full controls at /accessibility.</p>
              </div>
              <div className="flex items-center gap-2">
                <AccessibilityQuickToggle />
                <Button asChild variant="outline" size="sm"><Link href="/accessibility">Open</Link></Button>
              </div>
            </div>
          </CardContent>
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
