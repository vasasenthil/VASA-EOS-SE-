import { notFound, redirect } from "next/navigation"
import { hasPermission } from "@/app/governance/rbac" // Correct RBAC import
import { PERMISSIONS } from "@/app/governance/types"
import { getAuthUsersForSelectionAction, getUserAssignmentsAction } from "@/app/governance/user-assignments/actions"
import { getOUs } from "@/actions/get-ous"
import { getRoles } from "@/actions/get-roles"
import { Shell } from "@/components/shell" // Correct UI component
import { PageHeader, PageHeaderHeading, PageHeaderText } from "@/components/page-header" // Correct UI component
import UserAssignmentsClientPage from "./components/user-assignments-client-page" // Correct client component
import { getUserIdFromAction } from "@/lib/auth/server" // Helper to get current admin's ID

export const metadata = {
  title: "Manage User Assignments - VASA-EOS",
  description: "Assign users to organizational units with specific roles.",
}

interface UserAssignmentsPageProps {
  params: {
    userId: string
  }
  searchParams?: { [key: string]: string | string[] | undefined }
}

export default async function UserAssignmentsPage({ params }: UserAssignmentsPageProps) {
  const { userId: targetUserId } = params // ID of the user being managed

  // Get the ID of the currently authenticated administrator
  const currentAuthUserId = await getUserIdFromAction()
  if (!currentAuthUserId) {
    // Redirect to login if the administrator is not authenticated
    // Adjust "/login" to your application's actual login path if different
    redirect("/login")
  }

  // Check if the authenticated administrator has permission to manage user assignments
  const canManage = await hasPermission({
    userId: currentAuthUserId, // Use the admin's ID for the permission check
    permissionString: PERMISSIONS.USERS_MANAGE,
  })

  if (!canManage) {
    // If the admin doesn't have permission, redirect them
    // Adjust "/admin/governance/users" to an appropriate page (e.g., access denied or back to user list)
    redirect("/admin/governance/users")
  }

  // Parallel data fetching for the target user's details, their assignments, and available OUs/Roles
  const [userResult, assignmentsResult, ousResult, rolesResult] = await Promise.all([
    getAuthUsersForSelectionAction({ searchTerm: targetUserId }), // Fetching the target user's details
    getUserAssignmentsAction({ userId: targetUserId, includeOuDetails: true, includeRoleDetails: true }),
    getOUs(),
    getRoles(),
  ])

  // Find the specific user from the result of getAuthUsersForSelectionAction
  const user = userResult.data.find((u) => u.id === targetUserId)

  if (!user) {
    notFound() // If the target user doesn't exist
  }

  // Check if OUs and Roles (essential for the assignment form) loaded successfully
  if (!ousResult.success || !rolesResult.success) {
    console.error(
      "Failed to load Organizational Units or Roles for the assignment page. The assignment form may not function correctly.",
    )
    // Consider passing an error state to UserAssignmentsClientPage or rendering an error message.
    // For now, the client page will receive empty arrays for OUs/Roles if fetching failed.
  }

  return (
    <Shell variant="sidebar">
      {" "}
      {/* Ensure Shell component and its variants are correctly implemented */}
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
        canManage={canManage} // Pass the permission status to the client component
      />
    </Shell>
  )
}
