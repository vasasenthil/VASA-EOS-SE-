import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, ShieldCheck, ShieldAlert } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { getAuditTrail, backboneConnected } from "./actions"

export const dynamic = "force-dynamic"

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

const EFFECT_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  permit: "default",
  executed: "default",
  approved: "default",
  published: "default",
  resolved: "default",
  deny: "destructive",
  rejected: "destructive",
}

export default async function AuditTrailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "")
  const filter = {
    actor: str("actor"),
    action: str("action"),
    resource: str("resource"),
    effect: str("effect"),
    limit: Number.parseInt(str("limit") || "100", 10) || 100,
  }
  const connected = await backboneConnected()
  const a = await getAuditTrail(filter)

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Audit Trail &amp; Integrity Ledger</PageHeaderHeading>
        <PageHeaderDescription>
          The immutable, hash-chained ledger every workflow on the platform writes to. Each record links to the
          previous by SHA-256 hash, so any tampering breaks the chain and is detected on verification. This console
          reads the durable ledger, runs a <strong>live integrity check</strong>, and lets you filter by actor,
          action, resource or effect. The ledger is append-only by construction — you write to it by performing
          operations in the other modules, never by editing here.
        </PageHeaderDescription>
      </PageHeader>

      {!connected || !a ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Backbone not connected</AlertTitle>
          <AlertDescription>
            This module drives the durable Go backbone (platformd + PostgreSQL). Run the full stack and set{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">PLATFORM_URL</code> (e.g.{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">deploy/pilot/run-local.sh</code>), then the
            live, verifiable audit chain is surfaced here.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {/* integrity banner */}
          <Alert variant={a.intact ? "default" : "destructive"}>
            {a.intact ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
            <AlertTitle>{a.intact ? "Chain verified — tamper-evident integrity intact" : `Chain BROKEN at record #${a.bad_index}`}</AlertTitle>
            <AlertDescription className="font-mono text-xs">
              {a.length} records · head {a.head.slice(0, 16)}… · merkle {a.merkle_root.slice(0, 16)}…
            </AlertDescription>
          </Alert>

          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Chain length" value={a.length} />
            <Stat label="Integrity" value={a.intact ? "✓ intact" : "✗ broken"} />
            <Stat label="Showing" value={a.matched} />
            <div className="rounded-lg border p-4 sm:col-span-3">
              <p className="text-sm font-medium">Effect census (whole chain)</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {Object.entries(a.effect_census).filter(([k]) => k).sort((x, y) => y[1] - x[1]).map(([e, n]) => (
                  <Badge key={e} variant={EFFECT_VARIANT[e] ?? "outline"} className="text-xs">{e} {n}</Badge>
                ))}
              </div>
            </div>
          </section>

          {/* filter form — every field is a real query against the durable ledger */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Filter the ledger</CardTitle>
              <CardDescription>Substring, case-insensitive. Combine fields to narrow the trail.</CardDescription>
            </CardHeader>
            <CardContent>
              <form method="get" className="grid items-end gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <div className="space-y-1">
                  <Label htmlFor="f-actor">Actor</Label>
                  <Input id="f-actor" name="actor" defaultValue={filter.actor} placeholder="role:DEO" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="f-action">Action</Label>
                  <Input id="f-action" name="action" defaultValue={filter.action} placeholder="exams.moderate" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="f-resource">Resource</Label>
                  <Input id="f-resource" name="resource" defaultValue={filter.resource} placeholder="EXM-CHN" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="f-effect">Effect</Label>
                  <Input id="f-effect" name="effect" defaultValue={filter.effect} placeholder="deny" />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Apply</Button>
                  <Button type="submit" variant="ghost" name="reset" value="1" formAction="/audit-trail">Clear</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Records (most recent first)</CardTitle>
              <CardDescription>{a.matched} record(s) shown of {a.length} in the chain.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {a.records.length === 0 ? (
                <p className="text-sm text-muted-foreground">No records match the filter.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-1 pr-3 font-medium">#</th>
                      <th className="py-1 pr-3 font-medium">Timestamp</th>
                      <th className="py-1 pr-3 font-medium">Actor</th>
                      <th className="py-1 pr-3 font-medium">Action</th>
                      <th className="py-1 pr-3 font-medium">Resource</th>
                      <th className="py-1 pr-3 font-medium">Effect</th>
                      <th className="py-1 font-medium">Hash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {a.records.map((r) => (
                      <tr key={r.seq} className="border-t align-top">
                        <td className="py-1 pr-3 font-mono tabular-nums">{r.seq}</td>
                        <td className="py-1 pr-3 font-mono whitespace-nowrap">{r.ts.replace("T", " ").slice(0, 19)}</td>
                        <td className="py-1 pr-3 font-mono">{r.actor}</td>
                        <td className="py-1 pr-3 font-mono">{r.action}</td>
                        <td className="py-1 pr-3 font-mono">{r.resource || "—"}{r.detail && <span className="text-muted-foreground"> · {r.detail}</span>}</td>
                        <td className="py-1 pr-3">
                          <Badge variant={EFFECT_VARIANT[r.effect] ?? "secondary"} className="text-[10px]">{r.effect || "—"}</Badge>
                        </td>
                        <td className="py-1 font-mono text-muted-foreground" title={`${r.prev_hash} → ${r.hash}`}>{r.hash.slice(0, 12)}…</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </Shell>
  )
}
