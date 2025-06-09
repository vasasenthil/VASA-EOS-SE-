import { Suspense } from "react"
import { Shell } from "@/components/shell"
import { getUserIdFromAction } from "@/lib/auth/server"
import { hasPermission } from "@/app/governance/rbac"
import { PERMISSIONS } from "@/app/governance/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { getAuthUsers } from "@/actions/get-auth-users"
import { UserTable } from "@/components/user-table"
// TODO: Add search and pagination controls if needed

export const metadata = {
  title: "User Management - VASA-EOS",
  description: "Manage users and their role assignments within the governance structure.",
}

export default function UserManagementPage({
  searchParams,
}: {
  searchParams?: { query?: string; page?: string }
}) {
  const currentPage = Number(searchParams?.page) || 1
  const searchQuery = searchParams?.query || ""

  return (
    <Shell>
      <Suspense fallback={<UsersLoaderSkeleton />}>
        <UsersLoader currentPage={currentPage} searchQuery={searchQuery} />
      </Suspense>
    </Shell>
  )
}

async function UsersLoader({ currentPage, searchQuery }: { currentPage: number; searchQuery: string }) {
  const userId = await getUserIdFromAction()
  if (!userId) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Authentication Required</AlertTitle>
        <AlertDescription>You must be logged in to view this page.</AlertDescription>
      </Alert>
    )
  }

  // Check for a general governance view permission or a specific user management view permission
  const canViewPage = await hasPermission({
    userId,
    permissionString: PERMISSIONS.GOVERNANCE_VIEW, // Or a more specific PERMISSIONS.USERS_VIEW
  })

  if (!canViewPage) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>You do not have permission to view this page.</AlertDescription>
      </Alert>
    )
  }

  const canManageUsers = await hasPermission({
    userId,
    permissionString: PERMISSIONS.USERS_MANAGE,
  })

  // TODO: Define pageSize, perhaps from a constant or config
  const pageSize = 10
  const usersResult = await getAuthUsers({ searchTerm: searchQuery, page: currentPage, pageSize })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">View users and manage their OU and Role assignments.</p>
        </div>
        {/* Add Invite User button if functionality exists */}
        {/* {canManageUsers && (
          <Button asChild>
            <Link href="/admin/governance/users/invite">Invite User</Link>
          </Button>
        )} */}
      </div>
      {/* TODO: Add SearchInput component */}
      {/* <SearchInput placeholder="Search users by email..." /> */}

      <UserTable usersResult={usersResult} canManageUsers={canManageUsers} basePath="/admin/governance/users" />

      {/* TODO: Add PaginationControls component */}
      {/* {usersResult.total && usersResult.total > pageSize && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={Math.ceil(usersResult.total / pageSize)}
          baseUrl="/admin/governance/users"
          searchQuery={searchQuery}
        />
      )} */}
    </div>
  )
}

function UsersLoaderSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-64" />
          <Skeleton className="mt-2 h-4 w-96" />
        </div>
        {/* <Skeleton className="h-10 w-32" /> */}
      </div>
      {/* <Skeleton className="h-10 w-full" /> Search Skeleton */}
      <div className="rounded-md border">
        {/* Table Header Skeleton */}
        <div className="flex border-b p-4">
          <Skeleton className="h-5 w-[80px]" />
          <Skeleton className="h-5 flex-1" />
          <Skeleton className="h-5 flex-1" />
          <Skeleton className="h-5 w-48" /> {/* Actions column */}
        </div>
        {/* Table Body Skeleton Rows */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex border-b p-4 items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="h-8 w-48" />
          </div>
        ))}
      </div>
      {/* <Skeleton className="h-10 w-64 self-center" /> Pagination Skeleton */}
    </div>
  )
}
