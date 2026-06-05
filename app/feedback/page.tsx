import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { FeedbackBoard } from "./feedback-board"

export default function FeedbackPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Parent Feedback &amp; Satisfaction</PageHeaderHeading>
        <PageHeaderDescription>
          Capture parent satisfaction across teaching, communication, safety, meals and overall experience on a 1-5
          scale. Per-question and overall averages update as responses come in.
        </PageHeaderDescription>
      </PageHeader>
      <FeedbackBoard />
    </Shell>
  )
}
