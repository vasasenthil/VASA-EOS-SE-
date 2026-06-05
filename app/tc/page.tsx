import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { TcBoard } from "./tc-board"

export default function TcPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Transfer Certificate (TC) Issuance</PageHeaderHeading>
        <PageHeaderDescription>
          Raise TC requests, verify records and dues, and issue a sequentially-numbered transfer certificate.
          Production issues a signed, verifiable certificate and syncs UDISE+ / SIS.
        </PageHeaderDescription>
      </PageHeader>
      <TcBoard />
    </Shell>
  )
}
