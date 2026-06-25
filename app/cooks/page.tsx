import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { CooksBoard } from "./cooks-board"
import { listCooksAction } from "./actions"

export default async function CooksPage() {
  const initial = await listCooksAction()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Cook-cum-Helper Management</PageHeaderHeading>
        <PageHeaderDescription>
          Register PM POSHAN kitchen staff, mark daily presence and total monthly honoraria. Production links the
          roster to DBT honorarium payouts and the mid-day-meal daily register.
        </PageHeaderDescription>
      </PageHeader>
      <CooksBoard initial={initial} />
    </Shell>
  )
}
