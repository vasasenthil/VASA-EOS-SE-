import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { integrationModes } from "@/lib/integrations"
import { AadhaarVerify } from "./aadhaar-verify"

export default function AadhaarPage() {
  const mode = integrationModes.aadhaar
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Aadhaar Authentication (UIDAI)</PageHeaderHeading>
        <PageHeaderDescription>
          Verify-only Aadhaar OTP authentication behind a typed port. With INTEGRATION_AADHAAR=live and an AUA/KUA gateway
          it performs a real two-step OTP flow; otherwise it returns deterministic mock results. The full Aadhaar number
          is never sent or stored — only a transaction id and a verification result cross the seam.
        </PageHeaderDescription>
      </PageHeader>
      <AadhaarVerify mode={mode} />
    </Shell>
  )
}
