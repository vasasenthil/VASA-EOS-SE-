import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { BankingBoard } from "./banking-board"

export default function StudentBankingPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Student Banking &amp; Financial Literacy</PageHeaderHeading>
        <PageHeaderDescription>
          Run a school savings-bank scheme — open student passbooks, record deposits and withdrawals (never
          overdrawn), and watch total savings grow. A hands-on financial-literacy programme.
        </PageHeaderDescription>
      </PageHeader>
      <BankingBoard />
    </Shell>
  )
}
