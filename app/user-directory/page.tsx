import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { DemoDataNote } from "@/components/demo-data-note"
import { getDirectorySummary, getScopedUsers, backboneConnected } from "./actions"
import { UpsertUserForm, AccessExplainForm } from "./user-directory-client"

export const dynamic = "force-dynamic"

const SCOPE = process.env.PLATFORM_DEFAULT_ORG ?? "TN-DIST-Chennai"

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export default async function UserDirectoryPage() {
  const connected = await backboneConnected()
  const d = await getDirectorySummary()
  const scoped = await getScopedUsers(SCOPE)
  // discover a real tenancy node from the scoped users (so new users + lookups anchor correctly)
  const org = scoped[0]?.org_unit ?? "33030004181"
  const roles = (d?.catalogue ?? []).map((r) => ({ code: r.code, name: r.name }))
  const userIds = scoped.map((u) => u.id)

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>User Directory &amp; IAM</PageHeaderHeading>
        <PageHeaderDescription>
          The durable identity plane the unified PDP (RBAC · ABAC · ReBAC · PBAC · CABAC) decides over. Every user
          is anchored to a tenancy node and bound to a role from the canonical catalogue. Add or update users, see
          the role census, and run the reverse <strong>access-explain</strong> lookup — &ldquo;why can/can&rsquo;t
          this person do X&rdquo; — with the full per-model trace. Every button performs a real, persisted, audited
          operation.
        </PageHeaderDescription>
      </PageHeader>

      {!d ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Backbone not connected</AlertTitle>
          <AlertDescription>
            This module drives the durable Go backbone (platformd + PostgreSQL). Run the full stack and set{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">PLATFORM_URL</code> (e.g.{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">deploy/pilot/run-local.sh</code>), then every
            Save-user / Explain-access button performs a real persisted operation.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {!connected && <DemoDataNote />}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Users" value={d.users} />
            <Stat label="Roles" value={d.roles} />
            <Stat label="Access models" value={d.access_models.length} />
            <Stat label={`In ${SCOPE}`} value={scoped.length} />
            <div className="rounded-lg border p-4 sm:col-span-2">
              <div className="flex flex-wrap gap-1">
                {d.access_models.map((m) => <Badge key={m} variant="outline" className="font-mono text-[10px]">{m}</Badge>)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">unified PDP · durable · audited</p>
            </div>
          </section>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Users in scope — {SCOPE}</CardTitle>
              <CardDescription>
                Downward-governance scoping: exactly the {scoped.length} user(s) a subject at this node governs
                (fail-closed for anyone outside the jurisdiction).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scoped.length === 0 ? (
                <p className="text-sm text-muted-foreground">No users in this scope.</p>
              ) : (
                <ul className="divide-y">
                  {scoped.map((u) => (
                    <li key={u.id} className="flex items-center justify-between gap-2 py-2">
                      <div>
                        <p className="text-sm font-medium">{u.name || u.id}</p>
                        <p className="font-mono text-xs text-muted-foreground">{u.id} · {u.org_unit}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {u.suspended && <Badge variant="destructive" className="text-xs">suspended</Badge>}
                        <Badge variant="secondary">{u.role}</Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Access-explain — the reverse &ldquo;why&rdquo; lookup</CardTitle>
              <CardDescription>
                Evaluate any user against any action/resource and see the composed five-model effect with the full
                per-model trace (RBAC · ABAC · ReBAC · PBAC · CABAC).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AccessExplainForm org={org} users={userIds} />
            </CardContent>
          </Card>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Add / update a user</CardTitle>
                <CardDescription>Upserts into the durable directory (the PDP's identity plane).</CardDescription>
              </CardHeader>
              <CardContent>
                <UpsertUserForm org={org} roles={roles} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Role catalogue ({d.roles})</CardTitle>
                <CardDescription>The canonical user categories across the TN governance hierarchy.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {d.catalogue.map((r) => (
                    <Badge key={r.code} variant="outline" className="text-xs" title={`${r.name} · ${r.tier}`}>
                      {r.code} <span className="ml-1 text-muted-foreground">{d.role_census[r.code] ?? 0}</span>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </Shell>
  )
}
