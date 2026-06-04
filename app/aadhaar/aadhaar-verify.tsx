"use client"

import { useActionState } from "react"
import { aadhaarAction, type AadhaarState } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const initial: AadhaarState = { step: "idle" }

export function AadhaarVerify({ mode }: { mode: "mock" | "live" }) {
  const [state, formAction, pending] = useActionState(aadhaarAction, initial)
  const sent = state.step === "otp_sent" || state.step === "verified"

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Aadhaar OTP auth</CardTitle>
            <Badge variant={mode === "live" ? "default" : "secondary"}>{mode === "live" ? "UIDAI live" : "mock"}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form action={formAction} className="space-y-3">
            <input type="hidden" name="op" value="send" />
            <div className="space-y-1.5">
              <Label htmlFor="ref">Aadhaar (last 4 / token)</Label>
              <Input id="ref" name="ref" placeholder="e.g. 1234" inputMode="numeric" />
            </div>
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Requesting…" : "Send OTP"}
            </Button>
          </form>

          <form action={formAction} className="space-y-3">
            <input type="hidden" name="op" value="verify" />
            <input type="hidden" name="txnId" value={state.txnId ?? ""} />
            <div className="space-y-1.5">
              <Label htmlFor="otp">Enter OTP</Label>
              <Input id="otp" name="otp" placeholder="6-digit OTP" inputMode="numeric" disabled={!sent} />
            </div>
            <Button type="submit" variant="outline" disabled={pending || !sent} className="w-full">
              {pending ? "Verifying…" : "Verify OTP"}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground">
            Verify-only: the full Aadhaar number is never sent or stored. Set INTEGRATION_AADHAAR=live and AADHAAR_BASE_URL
            to call a real AUA/KUA gateway.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Status</CardTitle>
            {state.traceId ? <span className="font-mono text-xs text-muted-foreground">{state.traceId}</span> : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {state.error ? <p className="text-destructive">{state.error}</p> : null}
          {state.step === "idle" && !state.error ? (
            <p className="text-muted-foreground">Send an OTP to begin verification.</p>
          ) : null}
          {state.txnId ? (
            <p>
              Transaction: <span className="font-mono">{state.txnId}</span>
            </p>
          ) : null}
          {state.step === "otp_sent" ? <Badge variant="secondary">OTP sent — awaiting verification</Badge> : null}
          {state.step === "verified" ? <Badge>Verified ✓</Badge> : null}
          {state.step === "failed" && !state.error ? <Badge variant="destructive">Not verified</Badge> : null}
        </CardContent>
      </Card>
    </div>
  )
}
