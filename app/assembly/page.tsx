import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { AssemblyBoard } from "./assembly-board"

export default function AssemblyPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Morning Assembly / Bal Sabha Log</PageHeaderHeading>
        <PageHeaderDescription>
          Record each day&apos;s class-led assembly — the theme, who conducted it and the thought for the day — to run a
          rotating Bal Sabha that builds student voice and value education.
        </PageHeaderDescription>
      </PageHeader>
      <AssemblyBoard />
    </Shell>
  )
}
