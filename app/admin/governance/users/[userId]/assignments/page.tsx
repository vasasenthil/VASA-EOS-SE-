import { notFound, redirect } from "next/navigation"
import { hasPermission } from "@/app/governance/rbac"
import { PERMISSIONS } from "@/app/governance/types"
import { getAuthUsersForSelectionAction, getUserAssignmentsAction } from "@/app/governance/user-assignments/actions"
import { getOUs } from "@/actions/get-ous"
import { getRoles } from "@/actions/get-roles"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderText } from "@/components/page-header"
import UserAssignmentsClientPage from "./components/user-assignments-client-page"
import { getUserIdFromAction } from "@/lib/auth/server"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Manage User Assignments - VASA-EOS",
  description: "Assign users to organizational units with specific roles.",
}

// Define the props type explicitly to avoid ambiguity
type UserAssignmentsPageProps = {
  params: { userId: string }
  searchParams?: { [key: string]: string | string[] | undefined }
}

// The @ts-ignore is still necessary as a fallback
// @ts-ignore
export default async function UserAssignmentsPage(props: UserAssignmentsPageProps) {
  const { params } = props
  const { userId: targetUserId } = params

  const currentAuthUserId = await getUserIdFromAction()
  if (!currentAuthUserId) {
    redirect("/login")
  }

  const canManage = await hasPermission({
    userId: currentAuthUserId,
    permissionString: PERMISSIONS.USERS_MANAGE_SYSTEM,
  })

  if (!canManage) {
    redirect("/admin/governance/users")
  }

  const [userResult, assignmentsResult, ousResult, rolesResult] = await Promise.all([
    getAuthUsersForSelectionAction({ searchTerm: targetUserId }),
    getUserAssignmentsAction({ userId: targetUserId, includeOuDetails: true, includeRoleDetails: true }),
    getOUs(),
    getRoles(),
  ])

  const user = userResult.data.find((u) => u.id === targetUserId)

  if (!user) {
    notFound()
  }

  if (!ousResult.success || !rolesResult.success) {
    console.error("Failed to load Organizational Units or Roles for the assignment page.")
  }

  return (
    <Shell variant="sidebar">
      <PageHeader>
        <PageHeaderHeading>Manage Assignments</PageHeaderHeading>
        <PageHeaderText>
          Assign roles within organizational units for user:{" "}
          <span className="font-semibold text-foreground">{user.raw_user_meta_data?.name || user.email}</span>
        </PageHeaderText>
      </PageHeader>
      <UserAssignmentsClientPage
        user={user}
        initialAssignments={assignmentsResult.data || []}
        organizationalUnits={ousResult.data || []}
        roles={rolesResult.data || []}
        canManage={canManage}
      />
    </Shell>
  )
}
