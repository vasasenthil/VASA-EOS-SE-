import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { OoscBoard } from "./oosc-board"

export default function OoscPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Out-of-School Children &amp; Bridge Course</PageHeaderHeading>
        <PageHeaderDescription>
          Identify never-enrolled and dropout children, enrol them in a special-training bridge course and track them
          through to mainstreaming into the age-appropriate class, per Samagra Shiksha and RTE.
        </PageHeaderDescription>
      </PageHeader>
      <OoscBoard />
    </Shell>
  )
}
