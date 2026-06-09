import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { ConsentPanel } from "./consent-panel"

export default function ConsentPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Consent &amp; Audit (DPDP)</PageHeaderHeading>
        <PageHeaderDescription>
          DPDP Act 2023 compliance-by-design — InDEA 2.0 consent for every personal-data purpose, withdrawable any time,
          with special protection for children&apos;s data. Every grant/withdraw is written to a tamper-evident audit trail.
        </PageHeaderDescription>
      </PageHeader>
      <ConsentPanel />
    </Shell>
  )
}
