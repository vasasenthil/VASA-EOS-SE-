import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { MdmRegister } from "./mdm-register"
import { listEntriesAction } from "./actions"

export default async function MdmPage() {
  const initial = await listEntriesAction()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Mid-Day Meal Daily Register</PageHeaderHeading>
        <PageHeaderDescription>
          Log the daily CMBS / PM POSHAN register — enrolment, present, meals served and the menu. Consumption rate is
          computed and any leakage (more meals than children present) is flagged.
        </PageHeaderDescription>
      </PageHeader>
      <MdmRegister initial={initial} />
    </Shell>
  )
}
