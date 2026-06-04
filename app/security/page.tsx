import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ZERO_TRUST_LAYERS, ZERO_TRUST_PRINCIPLES, SECURITY_HEADERS, INCIDENT_RESPONSE } from "@/lib/security"

export default function SecurityPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Zero-Trust Security</PageHeaderHeading>
        <PageHeaderDescription>
          Never trust, always verify; assume breach; least privilege. Defence-in-depth across 7 layers, CERT-In
          compliant, with hardened security headers applied to every response.
        </PageHeaderDescription>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>7-Layer Defence-in-Depth</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {ZERO_TRUST_LAYERS.map((l) => (
                <li key={l.layer}>
                  <div className="font-medium">{l.layer}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {l.controls.map((c) => (
                      <Badge key={c} variant="outline" className="text-xs">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Response Headers</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-xs font-mono">
                {SECURITY_HEADERS.map((h) => (
                  <li key={h.name} className="rounded border bg-muted/30 px-2 py-1">
                    {h.name}: {h.value}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Incident Response</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm list-disc list-inside text-muted-foreground">
                {INCIDENT_RESPONSE.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Principles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {ZERO_TRUST_PRINCIPLES.map((p) => (
              <Badge key={p} variant="secondary">
                {p}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Shell>
  )
}
