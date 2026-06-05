import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { ProfileForm } from "./profile-form"

export default function TeacherProfilePage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Teacher Self-Service Profile</PageHeaderHeading>
        <PageHeaderDescription>
          Maintain your own profile — designation, subjects, qualifications, experience and contact — with a live
          completeness score. Feeds the directory and substitution matching.
        </PageHeaderDescription>
      </PageHeader>
      <ProfileForm />
    </Shell>
  )
}
