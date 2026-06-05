import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { VocationalBoard } from "./vocational-board"

export default function VocationalPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Vocational Education &amp; Skills (NSQF)</PageHeaderHeading>
        <PageHeaderDescription>
          Enrol students into vocational trades and track NSQF certification. NEP 2020 mainstreams vocational
          education from Class 6; production links to the Skill India / NSQF credential.
        </PageHeaderDescription>
      </PageHeader>
      <VocationalBoard />
    </Shell>
  )
}
