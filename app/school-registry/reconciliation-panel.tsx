import { verifyRegister } from "./actions"
import type { SchoolRecord } from "@/lib/integrations"
import { verificationLabel } from "@/lib/integrations/reconcile"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// A representative slice of the platform's OWN school register, to be reconciled against UDISE+. In a real
// deployment these are read from the tenancy/school store; here they are seeded so the gate is demonstrable in
// mock mode (one matching the registry, one with deliberate drift). The same gate runs against the live
// state-hosted registry when INTEGRATION_UDISE=live.
const PLATFORM_REGISTER: SchoolRecord[] = [
  { udiseCode: "33010100101", name: "Demo Government Higher Secondary School", district: "Chennai", board: "State (TN SCERT)" },
  { udiseCode: "33010100102", name: "Panchayat Union Primary School, Velachery", district: "Tiruvallur", board: "CBSE" },
]

function statusVariant(status: string): "default" | "secondary" | "destructive" {
  if (status === "verified") return "default"
  if (status === "mismatch") return "destructive"
  return "secondary"
}

export async function ReconciliationPanel() {
  const summary = await verifyRegister(PLATFORM_REGISTER)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          UDISE+ Reconciliation
          <Badge variant="outline" className="font-mono text-xs uppercase">{summary.mode}</Badge>
        </CardTitle>
        <CardDescription>
          The platform&apos;s own school records are verified against UDISE+ (the statutory source of truth), not
          just looked up. {summary.verified} verified · {summary.mismatch} mismatch · {summary.notFound} not found
          of {summary.total}. This gate runs identically against the live state-hosted registry when
          <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">INTEGRATION_UDISE=live</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {summary.rows.map((r) => (
          <div key={r.udiseCode} className="rounded-md border p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-medium">{r.name}</p>
                <p className="font-mono text-xs text-muted-foreground">{r.udiseCode}</p>
              </div>
              <Badge variant={statusVariant(r.status)}>{verificationLabel(r.status)}</Badge>
            </div>
            {r.mismatches.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm">
                {r.mismatches.map((m) => (
                  <li key={m.field} className="text-muted-foreground">
                    <span className="font-medium text-foreground">{m.field}</span>: platform “{m.local}” ≠ UDISE+ “{m.registry}”
                  </li>
                ))}
              </ul>
            )}
            {r.traceId && <p className="mt-2 font-mono text-[10px] text-muted-foreground">trace {r.traceId}</p>}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
