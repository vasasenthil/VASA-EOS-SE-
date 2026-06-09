import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { listCredentials } from "@/lib/credentials/store"
import { CredentialIssuer } from "./credential-issuer"

export default async function CredentialsPage() {
  const initial = await listCredentials()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Verifiable Credentials (NFT / SBT)</PageHeaderHeading>
        <PageHeaderDescription>
          Achievements minted as non-transferable soulbound tokens, soulbound to the learner&apos;s APAAR ID and anchored
          to the tamper-evident audit ledger. Verification recomputes the content hash to detect any post-mint tampering.
        </PageHeaderDescription>
      </PageHeader>
      <CredentialIssuer initial={initial} />
    </Shell>
  )
}
