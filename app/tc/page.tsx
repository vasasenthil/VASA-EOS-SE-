import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { TcBoard } from "./tc-board"
import { listTcAction } from "./actions"

export default async function TcPage() {
  const initial = await listTcAction()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Transfer Certificate (TC) Issuance</PageHeaderHeading>
        <PageHeaderDescription>
          Raise TC requests, verify records and dues, and issue a sequentially-numbered transfer certificate.
          Production issues a signed, verifiable certificate and syncs UDISE+ / SIS.
        </PageHeaderDescription>
      </PageHeader>
      <TcBoard initial={initial} />
    </Shell>
  )
}
