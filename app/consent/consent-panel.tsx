"use client"

import { useActionState } from "react"
import { consentAction, type ConsentState } from "./actions"
import { CONSENT_PURPOSES } from "@/lib/consent"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShieldCheck, ShieldAlert } from "lucide-react"

const initial: ConsentState = { records: [], trail: [], verified: true }

export function ConsentPanel() {
  const [state, formAction] = useActionState(consentAction, initial)

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Capture / Withdraw Consent</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-3">
            <div className="grid gap-2">
              <Label htmlFor="apaar">Subject APAAR</Label>
              <Input id="apaar" name="apaar" required placeholder="APAAR-XXXXXXXXXXXX" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="purpose">Purpose</Label>
              <select id="purpose" name="purpose" className="h-9 rounded-md border bg-background px-3 text-sm">
                {CONSENT_PURPOSES.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="actor">Granted by (guardian for under-18)</Label>
              <Input id="actor" name="actor" placeholder="guardian" />
            </div>
            <div className="flex gap-2">
              <Button type="submit" name="op" value="grant">
                Grant
              </Button>
              <Button type="submit" name="op" value="withdraw" variant="outline">
                Withdraw
              </Button>
            </div>
          </form>
          {state.error ? <p className="mt-3 text-sm text-destructive">{state.error}</p> : null}

          {state.records.length > 0 ? (
            <ul className="mt-4 space-y-1 text-sm">
              {state.records.map((r) => (
                <li key={r.id} className="flex items-center gap-2">
                  <Badge variant={r.status === "granted" ? "default" : "outline"}>{r.status}</Badge>
                  <span className="font-mono text-xs">{r.subjectApaar}</span>
                  <span className="text-muted-foreground">{r.purpose}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Immutable Audit Trail
            {state.verified ? (
              <Badge className="gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> chain verified
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <ShieldAlert className="h-3.5 w-3.5" /> tampered
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {state.trail.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events yet — grant a consent to append.</p>
          ) : (
            <ul className="space-y-1 text-xs font-mono">
              {state.trail.map((e) => (
                <li key={e.seq} className="rounded border bg-muted/30 px-2 py-1">
                  #{e.seq} {e.action} · {e.actor} · {e.hash}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
