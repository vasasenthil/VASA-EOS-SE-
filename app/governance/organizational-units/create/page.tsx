import { Suspense } from "react"
import { Shell } from "@/components/shell"
import { OUForm } from "../components/ou-form"
import { getGovernanceTiersAction, getOrganizationalUnitsAction } from "../actions"
import { getUserIdFromAction } from "@/lib/auth/server"
import { hasPermission } from "@/app/governance/rbac"
import { PERMISSIONS } from "@/app/governance/types"
import { redirect } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

async function CreateOUPageLoader() {
  const userId = await getUserIdFromAction()
  if (!userId) {
    // This should ideally be caught by middleware or a higher-level auth check
    redirect("/login") // Or your login page
  }

  const canManageOUs = await hasPermission({ userId, permissionString: PERMISSIONS.OUS_MANAGE })
  if (!canManageOUs) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Permission Denied</AlertTitle>
        <AlertDescription>You do not have permission to create organizational units.</AlertDescription>
      </Alert>
    )
  }

  const [tiersResult, ousResult] = await Promise.all([
    getGovernanceTiersAction(),
    getOrganizationalUnitsAction({ includeTier: true }), // Fetch all OUs for parent selection, include their tiers
  ])

  if (!tiersResult.success || !ousResult.success) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Data</AlertTitle>
        <AlertDescription>
          Failed to load necessary data for the form.
          {tiersResult.message && <p>Tiers: {tiersResult.message}</p>}
          {ousResult.message && <p>OUs: {ousResult.message}</p>}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <OUForm tiers={tiersResult.data || []} allOUs={ousResult.data || []} userId={userId} canManage={canManageOUs} />
  )
}

function CreateOUPageSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-3 w-2/4" />
        </div>
      ))}
      <Skeleton className="h-10 w-32" />
    </div>
  )
}

export default function CreateOrganizationalUnitPage() {
  return (
    <Shell>
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Create New Organizational Unit</CardTitle>
          <CardDescription>
            Define a new unit within your governance structure. Assign it to a tier and optionally link it to a parent
            unit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<CreateOUPageSkeleton />}>
            <CreateOUPageLoader />
          </Suspense>
        </CardContent>
      </Card>
    </Shell>
  )
}
