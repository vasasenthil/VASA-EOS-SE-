import { Suspense } from "react"
import { getOUs } from "@/actions/get-ous"
import { getTiers } from "@/actions/get-tiers"
import { Shell } from "@/components/shell"
import { OrganizationalUnitTable } from "@/components/organizational-unit-table"
import { TierTable } from "@/components/tier-table"
import { getUserIdFromAction } from "@/lib/auth/server"
import { isSupabaseAdminConfigured } from "@/lib/supabase/server"
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
  // Walkthrough (no database): browseable; mutations stay guarded by server-action canDo
  // checks. Production requires a real authenticated session.
  const demoMode = !isSupabaseAdminConfigured()
  const userId = await getUserIdFromAction()
  if (!userId && !demoMode) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Authentication Required</AlertTitle>
        <AlertDescription>You must be logged in to view this page.</AlertDescription>
      </Alert>
    )
  }

  const canViewPage = demoMode || (await hasPermission({ userId: userId as string, permissionString: PERMISSIONS.OUS_MANAGE_SYSTEM }))

  if (!canViewPage) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>You do not have permission to view this page.</AlertDescription>
      </Alert>
    )
  }

  const canManageOUs = demoMode || (await hasPermission({ userId: userId as string, permissionString: PERMISSIONS.OUS_MANAGE_SYSTEM }))

  const ous = await getOUs() // Fetches { includeTier: true, includeUserCount: true } by default from actions/get-ous.ts
  const tiers = await getTiers()

  return (
    <div className="space-y-8">
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
