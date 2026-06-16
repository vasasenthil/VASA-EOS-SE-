import { Suspense } from "react"
import { Shell } from "@/components/shell"
import { getUserIdFromAction } from "@/lib/auth/server"
import { isSupabaseAdminConfigured } from "@/lib/supabase/server"
import { hasPermission } from "@/app/governance/rbac"
import { PERMISSIONS } from "@/app/governance/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getRoles } from "@/actions/get-roles"
import { RoleTable } from "@/components/role-table"

export default function RolesPage() {
  return (
    <Shell>
      <Suspense fallback={<RolesLoaderSkeleton />}>
        <RolesLoader />
      </Suspense>
    </Shell>
  )
}

async function RolesLoader() {
  // In the credential-free walkthrough (no database configured) the admin pages are
  // browseable; mutations remain guarded by the server-action canDo checks. In production
  // a real authenticated session is required.
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

  const canManageRoles = demoMode || (await hasPermission({ userId: userId as string, permissionString: PERMISSIONS.ROLES_MANAGE_SYSTEM }))

  const rolesResult = await getRoles()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
          <p className="text-muted-foreground">Define roles and assign permissions to control user access.</p>
        </div>
        {canManageRoles && (
          <Button asChild>
            <Link href="/governance/roles/create">Add Role</Link>
          </Button>
        )}
      </div>
      <RoleTable rolesResult={rolesResult} canManageRoles={canManageRoles} />
    </div>
  )
}

function RolesLoaderSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-72" />
          <Skeleton className="mt-2 h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="rounded-md border">
        {/* Table Header Skeleton */}
        <div className="flex border-b p-4">
          <Skeleton className="h-5 flex-1" />
          <Skeleton className="h-5 flex-1" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-32" />
        </div>
        {/* Table Body Skeleton Rows */}
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex border-b p-4 items-center gap-4">
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-32" />
          </div>
        ))}
      </div>
    </div>
  )
}
