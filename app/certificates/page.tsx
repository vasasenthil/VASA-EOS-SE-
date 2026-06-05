import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { CertificateIssuer } from "./certificate-issuer"

export default function CertificatesPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Certificates</PageHeaderHeading>
        <PageHeaderDescription>
          Issue Transfer (TC), Bonafide and Conduct certificates — pick a student and type, add remarks, and the system
          assigns a reference number and issue date. Production credentials would be anchored to DigiLocker and the audit
          ledger.
        </PageHeaderDescription>
      </PageHeader>
      <CertificateIssuer />
    </Shell>
  )
}
