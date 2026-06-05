import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { MdmRegister } from "./mdm-register"

export default function MdmPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Mid-Day Meal Daily Register</PageHeaderHeading>
        <PageHeaderDescription>
          Log the daily CMBS / PM POSHAN register — enrolment, present, meals served and the menu. Consumption rate is
          computed and any leakage (more meals than children present) is flagged.
        </PageHeaderDescription>
      </PageHeader>
      <MdmRegister />
    </Shell>
  )
}
