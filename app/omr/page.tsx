import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { OmrSheet } from "./omr-sheet"

export default function OmrPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>OCR / OMR Engine</PageHeaderHeading>
        <PageHeaderDescription>
          Smartphone OMR scoring for objective sections, with Tamil/English ICR for child handwriting behind the device
          vision seam. Mark the bubble sheet and score against the answer key — the same scoring path a teacher&apos;s
          phone-captured sheet would take.
        </PageHeaderDescription>
      </PageHeader>
      <OmrSheet />
    </Shell>
  )
}
