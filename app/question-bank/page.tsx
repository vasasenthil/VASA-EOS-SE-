import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { QuestionBoard } from "./question-board"
import { listPapersAction } from "./actions"

export default async function QuestionBankPage() {
  const initial = await listPapersAction()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Question Bank &amp; Paper Blueprint</PageHeaderHeading>
        <PageHeaderDescription>
          Maintain a tagged question bank and assemble a paper toward a target (100 marks) with a balanced difficulty mix.
          Add your own questions and select them to build the paper live.
        </PageHeaderDescription>
      </PageHeader>
      <QuestionBoard initial={initial} />
    </Shell>
  )
}
