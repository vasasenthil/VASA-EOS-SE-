import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { VacancyBoard } from "./vacancy-board"

export default function VacancyPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Teacher Vacancy &amp; Rationalisation</PageHeaderHeading>
        <PageHeaderDescription>
          Map sanctioned versus working strength by cadre and subject to surface vacancies (for recruitment) and
          surplus (for redeployment). The backbone of teacher rationalisation and counselling transfers.
        </PageHeaderDescription>
      </PageHeader>
      <VacancyBoard />
    </Shell>
  )
}
