import { Suspense } from "react"
import { getOUs } from "@/actions/get-ous"
import { getTiers } from "@/actions/get-tiers"
import { Shell } from "@/components/shell"
import { OrganizationalUnitTable } from "@/components/organizational-unit-table"
import { TierTable } from "@/components/tier-table"
import { getUserIdFromAction } from "@/lib/auth/server"
import { hasPermission } from "@/app/governance/rbac"
import { PERMISSIONS } from "@/app/governance/types"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"

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
  const userId = await getUserIdFromAction()
  if (!userId) {
    return <div>You must be logged in to view this page.</div>
  }

  const canView = await hasPermission({
    userId,
    permissionString: PERMISSIONS.GOVERNANCE_VIEW, // A general view permission
  })

  if (!canView) {
    return <div>You do not have permission to view this page.</div>
  }

  const canManageOUs = await hasPermission({
    userId,
    permissionString: PERMISSIONS.OUS_MANAGE,
  })

  const ous = await getOUs()
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
      <OrganizationalUnitTable ous={ous} />

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
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
      <div className="mt-12">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="mt-2 h-4 w-80" />
        <div className="mt-4 rounded-md border">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  )
}
