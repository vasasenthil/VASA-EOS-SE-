import { redirect } from "next/navigation"
import { hasPermission } from "@/app/governance/rbac"
import { PERMISSIONS } from "@/app/governance/types"
import { getUserIdFromAction } from "@/lib/auth/server"
import { getAuthUsers } from "@/actions/get-auth-users"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderText } from "@/components/page-header"
import { UserTable } from "@/components/user-table"
import { SearchInput } from "@/components/search-input"
import { PaginationControls } from "@/components/pagination-controls"

export const metadata = {
  title: "User Management",
  description: "View and manage users and their assignments.",
}

const PAGE_SIZE = 10

interface UsersPageProps {
  searchParams?: Promise<{
    search?: string
    page?: string
  }>
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const currentAuthUserId = await getUserIdFromAction()
  if (!currentAuthUserId) {
    redirect("/login")
  }

  const canView = await hasPermission({
    userId: currentAuthUserId,
    permissionString: PERMISSIONS.USERS_MANAGE_SYSTEM,
  })
  const canManage = await hasPermission({
    userId: currentAuthUserId,
    permissionString: PERMISSIONS.USERS_MANAGE_SYSTEM,
  })

  if (!canView) {
    redirect("/") // Or to an access denied page
  }

  const sp = await searchParams
  const searchTerm = sp?.search || ""
  const currentPage = Number(sp?.page) || 1

  const {
    data: users,
    total,
    success,
    message,
  } = await getAuthUsers({
    searchTerm,
    page: currentPage,
    pageSize: PAGE_SIZE,
  })

  const totalUsers = total || 0
  const totalPages = Math.ceil(totalUsers / PAGE_SIZE)

  return (
    <Shell variant="sidebar">
      <PageHeader>
        <PageHeaderHeading>User Management</PageHeaderHeading>
        <PageHeaderText>A list of all the users in your account.</PageHeaderText>
      </PageHeader>
      <div className="space-y-4">
        <SearchInput placeholder="Search by email..." />
        {success ? (
          <UserTable users={users} canManageUsers={canManage} />
        ) : (
          <div className="flex h-24 items-center justify-center rounded-md border border-dashed">
            <p className="text-sm text-destructive">{message || "Failed to load users."}</p>
          </div>
        )}
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          hasNextPage={currentPage < totalPages}
          hasPrevPage={currentPage > 1}
        />
      </div>
    </Shell>
  )
}
