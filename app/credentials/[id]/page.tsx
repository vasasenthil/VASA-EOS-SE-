import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ShieldCheck, ShieldAlert, Ban } from "lucide-react"
import { getCredentialAction } from "../actions"
import { RevokeButton } from "./revoke-button"
import { verifyDetailed, credentialStatus } from "@/lib/credentials"
import { safeDate } from "@/lib/format-date"

export const dynamic = "force-dynamic"

export default async function CredentialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const c = await getCredentialAction(id)

  if (!c) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Credential not found</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>No credential with this token id exists in the registry.</p>
            <Button asChild variant="outline" size="sm"><Link href="/credentials"><ArrowLeft className="mr-2 h-4 w-4" />Back to registry</Link></Button>
          </CardContent>
        </Card>
      </Shell>
    )
  }

  const v = verifyDetailed(c)
  const revoked = credentialStatus(c) === "Revoked"
  const rows: Array<[string, string]> = [
    ["Token id", c.id],
    ["Holder (APAAR)", c.apaarId],
    ["Kind", c.kind],
    ["Issuer", c.issuer],
    ["Issued", safeDate(c.issuedAt, "dd MMM yyyy")],
    ["Audit-ledger anchor", `#${c.anchorSeq}`],
    ["Transferable", "No — soulbound to the holder"],
  ]

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>{c.title}</PageHeaderHeading>
        <PageHeaderDescription>{c.kind} · token {c.id} · holder {c.apaarId}</PageHeaderDescription>
        <PageHeaderActions>
          {!revoked ? <RevokeButton id={c.id} /> : null}
        </PageHeaderActions>
      </PageHeader>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm"><Link href="/credentials"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button>
        <Badge variant="secondary">soulbound</Badge>
        {v.valid ? (
          <Badge className="bg-green-100 text-green-700 border-0"><ShieldCheck className="mr-1 h-3 w-3" />Valid</Badge>
        ) : v.authentic && v.revoked ? (
          <Badge className="bg-red-100 text-red-700 border-0"><Ban className="mr-1 h-3 w-3" />Revoked (authentic)</Badge>
        ) : (
          <Badge className="bg-red-100 text-red-700 border-0"><ShieldAlert className="mr-1 h-3 w-3" />Tampered</Badge>
        )}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Credential</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2">
              {rows.map(([k, val]) => (
                <div key={k} className="flex justify-between border-b py-2 text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium text-right">{val}</dd></div>
              ))}
            </dl>
            {revoked ? <p className="mt-3 text-sm text-red-700"><span className="text-muted-foreground">Revoked {c.revokedAt ? safeDate(c.revokedAt, "dd MMM yyyy") : ""}: </span>{c.revokeReason || "—"}</p> : null}
          </CardContent>
        </Card>
        <Card className={v.valid ? undefined : "border-red-200"}>
          <CardHeader><CardTitle className="text-base">Verification proof</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid gap-2">
              <div className="flex justify-between"><span className="text-muted-foreground">Authentic (hash matches mint)</span><span className={v.authentic ? "text-green-700 font-medium" : "text-red-700 font-medium"}>{v.authentic ? "Yes" : "No"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Anchored to audit ledger</span><span className={v.anchored ? "text-green-700 font-medium" : "text-red-700 font-medium"}>{v.anchored ? `Yes (#${v.anchorSeq})` : "No"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Revoked</span><span className={v.revoked ? "text-red-700 font-medium" : "text-green-700 font-medium"}>{v.revoked ? "Yes" : "No"}</span></div>
            </div>
            <div className="rounded-md border bg-muted/40 p-2 font-mono text-[11px] break-all">
              <div><span className="text-muted-foreground">stored&nbsp;&nbsp;</span>{v.contentHash}</div>
              <div><span className="text-muted-foreground">recomputed</span> {v.recomputed}</div>
            </div>
            <ul className="space-y-1 text-xs">
              {v.reasons.map((r, i) => <li key={i} className="text-muted-foreground">• {r}</li>)}
            </ul>
            <p className="text-[11px] text-muted-foreground">
              Verification recomputes the content hash from the credential&apos;s issuance fields and compares it to the
              stored hash anchored in the tamper-evident audit ledger. Any post-mint edit changes the hash and fails here.
              In-app analogue of a permissioned-blockchain record — not a distributed ledger or on-chain mint.
            </p>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}
