import { Suspense } from "react"
import { getOUs } from "@/actions/get-ous"
import { getTiers } from "@/actions/get-tiers"
import { Shell } from "@/components/shell"
import { OrganizationalUnitTable } from "@/components/organizational-unit-table"
import { TierTable } from "@/components/tier-table"
import { getUserIdFromAction } from "@/lib/auth/server"
import { isDemoModeEnabled } from "@/lib/supabase/server"
import { hasPermission } from "@/app/governance/rbac"
import { PERMISSIONS } from "@/app/governance/types"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

export default function OrganizationalUnitsPage() {
  return (
    <Shell>
      <Suspense fallback={<OULoaderSkeleton />}>
        <OULoader />
      </Suspense>
    </Shell>
  )
}

async function OULoader() {
  // Browseable everywhere: a signed-in admin sees and manages live units; an unauthenticated
  // visitor sees a read-only empty view with a sign-in note instead of a hard error. Real unit
  // data is only loaded for a signed-in session; mutations stay guarded by canDo checks.
  const demoMode = isDemoModeEnabled()
  const userId = await getUserIdFromAction()
  const authed = !!userId

  const canManageOUs =
    demoMode || (authed && (await hasPermission({ userId: userId as string, permissionString: PERMISSIONS.OUS_MANAGE_SYSTEM })))

  const empty = { success: true, message: "Sign in to view units.", data: [] as never[] }
  const ous = authed || demoMode ? await getOUs() : empty
  const tiers = authed || demoMode ? await getTiers() : empty

  return (
    <div className="space-y-8">
      {!authed && !demoMode ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Sign in to manage units</AlertTitle>
          <AlertDescription>You&apos;re viewing a read-only preview. Sign in with an administrator account to view and manage the organizational hierarchy.</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Organizational Units</h1>
          <p className="text-muted-foreground">Manage the hierarchical units within the governance structure.</p>
        </div>
        {canManageOUs && (
          <Button asChild>
            <Link href="/governance/organizational-units/create">Add OU</Link>
          </Button>
        )}
      </div>
      <OrganizationalUnitTable ous={ous} canManageOUs={canManageOUs} />

      <div className="mt-12">
        <h2 className="text-xl font-bold tracking-tight">Governance Tiers</h2>
        <p className="text-muted-foreground">The defined levels of the governance hierarchy.</p>
        <div className="mt-4">
          <TierTable tiers={tiers} />
        </div>
      </div>
    </div>
  )
}

function OULoaderSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="rounded-md border">
        {/* Table Header Skeleton */}
        <div className="flex border-b p-4">
          <Skeleton className="h-5 flex-1" />
          <Skeleton className="h-5 flex-1" />
          <Skeleton className="h-5 flex-1" />
          <Skeleton className="h-5 flex-1" />
          <Skeleton className="h-5 w-20" /> {/* Users column */}
          <Skeleton className="h-5 w-28" /> {/* Actions column */}
        </div>
        {/* Table Body Skeleton Rows */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex border-b p-4">
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-28" />
          </div>
        ))}
      </div>
      <div className="mt-12">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="mt-2 h-4 w-80" />
        <div className="mt-4 rounded-md border">
          <div className="flex border-b p-4">
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="h-5 flex-1" />
          </div>
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex border-b p-4">
              <Skeleton className="h-5 flex-1" />
              <Skeleton className="h-5 flex-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
