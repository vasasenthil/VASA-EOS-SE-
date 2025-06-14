import { redirect } from "next/navigation"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderText } from "@/components/page-header"
import { RegisterUserForm } from "@/app/admin/users/components/register-user-form"
import { getUserIdFromAction, getUserRoleAndSchool } from "@/lib/auth/server" // Assume getUserRoleAndSchool exists

export const metadata = {
  title: "Register New User",
  description: "Add a new student or teacher to the system.",
}

export default async function RegisterUserPage() {
  const userId = await getUserIdFromAction()
  if (!userId) {
    redirect("/login")
  }

  // This function would fetch the current user's role and their school_id
  // For MVP, we assume it returns an object like { role: 'SCHOOL_ADMIN', schoolId: 'some-uuid' }
  // Or null/error if not authorized or schoolId not found.
  const userContext = await getUserRoleAndSchool(userId)

  if (!userContext || userContext.role !== "SCHOOL_ADMIN" || !userContext.schoolId) {
    // Redirect if not a school admin or schoolId is missing
    // For simplicity, redirecting to a generic admin page or home
    console.warn("User does not have SCHOOL_ADMIN role or schoolId is missing for registration page.")
    redirect("/admin/dashboard") // Or an access denied page
  }

  return (
    <Shell variant="sidebar">
      <PageHeader>
        <PageHeaderHeading>Register New User</PageHeaderHeading>
        <PageHeaderText>Fill in the details below to add a new student or teacher to your school.</PageHeaderText>
      </PageHeader>
      <div className="grid gap-8">
        <RegisterUserForm schoolId={userContext.schoolId} />
      </div>
    </Shell>
  )
}
