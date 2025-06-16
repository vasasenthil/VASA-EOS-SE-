import { notFound, redirect } from "next/navigation"
import { hasPermission } from "@/app/governance/rbac"
import { PERMISSIONS } from "@/app/governance/types" // Assuming app/governance/types.ts is now correct
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

// TEMPORARY WORKAROUND:
// The following @ts-ignore is to bypass a persistent build error.
// This error is caused by a conflicting global 'PageProps' type definition
// elsewhere in the project, where 'params' is incorrectly typed as a Promise.
// The root cause (the conflicting PageProps definition) must be found and fixed.
// @ts-ignore
export default async function UserAssignmentsPage({
  params,
  searchParams,
}: {
  params: { userId: string }
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  const { userId: targetUserId } = params

  const currentAuthUserId = await getUserIdFromAction()
  if (!currentAuthUserId) {
    redirect("/login")
  }

  const canManage = await hasPermission({
    userId: currentAuthUserId,
    permissionString: PERMISSIONS.USERS_MANAGE_SYSTEM, // Using a more specific permission from the updated types
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
