import { Suspense } from "react"
import { Shell } from "@/components/shell"
import { getUserIdFromAction } from "@/lib/auth/server"
import { isDemoModeEnabled } from "@/lib/supabase/server"
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
  // Browseable everywhere: a signed-in admin sees and manages live roles; an unauthenticated
  // visitor (walkthrough / public browse) sees a read-only empty view with a sign-in note instead
  // of a hard "Authentication Required" error. Real role data is only loaded for a signed-in
  // session (no disclosure); mutations stay guarded by the server-action canDo checks.
  const demoMode = isDemoModeEnabled()
  const userId = await getUserIdFromAction()
  const authed = !!userId

  const canManageRoles =
    demoMode || (authed && (await hasPermission({ userId: userId as string, permissionString: PERMISSIONS.ROLES_MANAGE_SYSTEM })))
  const rolesResult = authed || demoMode ? await getRoles() : { success: true, message: "Sign in to view roles.", data: [] }

  return (
    <div className="space-y-6">
      {!authed && !demoMode ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Sign in to manage roles</AlertTitle>
          <AlertDescription>You&apos;re viewing a read-only preview. Sign in with an administrator account to view and manage roles and permissions.</AlertDescription>
        </Alert>
      ) : null}
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
