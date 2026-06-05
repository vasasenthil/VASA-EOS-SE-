import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { RegistrationBoard } from "./registration-board"

export default function CoCurricularRegistrationPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Co-curricular Registration</PageHeaderHeading>
        <PageHeaderDescription>
          Register students into clubs, competitions, innovation (ATL / Inspire), arts and sports (Khelo India).
          Participation counts update live as students sign up.
        </PageHeaderDescription>
      </PageHeader>
      <RegistrationBoard />
    </Shell>
  )
}
