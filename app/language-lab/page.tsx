import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { DemoDataNote } from "@/components/demo-data-note"
import { getLanguageLabDashboard, getTranslations, backboneConnected } from "./actions"
import { RequestTranslationForm, AdvanceTranslationForm } from "./language-lab-client"

export const dynamic = "force-dynamic"

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

const STATUS_VARIANT: Record<string, "secondary" | "default" | "destructive" | "outline"> = {
  requested: "outline",
  translated: "secondary",
  reviewed: "default",
  published: "default",
  rejected: "destructive",
}

export default async function LanguageLabPage() {
  const connected = await backboneConnected()
  const d = await getLanguageLabDashboard()
  const jobs = await getTranslations()
  const org = jobs[0]?.org_unit ?? "33030004181"

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Native AI Language Lab</PageHeaderHeading>
        <PageHeaderDescription>
          The language Native-AI pillar as a durable workflow: translate school content (curriculum / notices /
          circulars / parent-comms) into the <strong>22 Eighth-Schedule languages</strong>, with an optional{" "}
          <strong>Bhashini machine first-draft</strong>, through <em>requested → translated → reviewed → published</em>.
          The backbone enforces a <strong>quality gate</strong>: a translation <strong>cannot be published without
          human review</strong> — so machine output never reaches parents unreviewed. Every button is real, persisted
          and audited.
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
            control performs a real persisted operation.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {!connected && <DemoDataNote />}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Jobs" value={d.jobs} />
            <Stat label="Published" value={d.published} />
            <Stat label="Machine-assisted" value={d.machine_assisted} />
            <Stat label="Languages covered" value={d.languages_covered.length} />
            <div className="rounded-lg border p-4 sm:col-span-2">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">Bhashini-assisted · review-gated · durable</p>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Awaiting review</CardTitle>
                <CardDescription>Translated jobs that cannot be published until reviewed.</CardDescription>
              </CardHeader>
              <CardContent>
                {(d.review_worklist ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nothing awaiting review.</p>
                ) : (
                  <ul className="divide-y text-sm">
                    {(d.review_worklist ?? []).map((j) => (
                      <li key={j.id} className="flex items-center justify-between gap-2 py-2">
                        <div>
                          <p className="font-medium">{j.title}</p>
                          <p className="text-xs text-muted-foreground">
                            <span className="font-mono">{j.id}</span> · {j.source_lang}→{j.target_lang}
                            {j.machine_assisted ? " · Bhashini draft" : ""}
                          </p>
                        </div>
                        <Badge variant="secondary">translated</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">By target language</CardTitle>
                <CardDescription>Jobs per language; published languages are covered.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {Object.entries(d.by_target_lang).sort().map(([k, v]) => (
                    <li key={k} className="flex items-center justify-between">
                      <span className="font-mono">{k}{d.languages_covered.includes(k) ? " ✓" : ""}</span>
                      <span className="tabular-nums">{v}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Translation jobs</CardTitle>
              <CardDescription>{jobs.length} job(s) in scope.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {jobs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No translation jobs.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-1 pr-3 font-medium">Id</th>
                      <th className="py-1 pr-3 font-medium">Title</th>
                      <th className="py-1 pr-3 font-medium">Domain</th>
                      <th className="py-1 pr-3 font-medium">Lang</th>
                      <th className="py-1 pr-3 font-medium">Bhashini</th>
                      <th className="py-1 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.sort((a, b) => a.id.localeCompare(b.id)).map((j) => (
                      <tr key={j.id} className="border-t">
                        <td className="py-1 pr-3 font-mono whitespace-nowrap">{j.id}</td>
                        <td className="py-1 pr-3">{j.title}</td>
                        <td className="py-1 pr-3">{j.domain}</td>
                        <td className="py-1 pr-3 font-mono">{j.source_lang}→{j.target_lang}</td>
                        <td className="py-1 pr-3">{j.machine_assisted ? "yes" : "—"}</td>
                        <td className="py-1">
                          <Badge variant={STATUS_VARIANT[j.status] ?? "outline"}>{j.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Request a translation</CardTitle>
                <CardDescription>Open a new translation job for a content item.</CardDescription>
              </CardHeader>
              <CardContent>
                <RequestTranslationForm org={org} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Advance a job</CardTitle>
                <CardDescription>Translate (Bhashini) → review → publish (review-gated), or reject.</CardDescription>
              </CardHeader>
              <CardContent>
                <AdvanceTranslationForm />
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </Shell>
  )
}
