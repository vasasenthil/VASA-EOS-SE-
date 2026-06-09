"use client"

import { useActionState } from "react"
import { disburseAction, type DbtState } from "./actions"
import { SCHEME_OPTIONS } from "./schemes"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

const initial: DbtState = {}

export function DbtForm() {
  const [state, formAction, isPending] = useActionState(disburseAction, initial)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scheme Disbursement (DBT-APBS)</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-3 max-w-md">
          <div className="grid gap-2">
            <Label htmlFor="scheme">Scheme</Label>
            <select
              id="scheme"
              name="scheme"
              defaultValue={SCHEME_OPTIONS[0]?.code}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              {SCHEME_OPTIONS.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="apaar">Beneficiary APAAR</Label>
            <Input id="apaar" name="apaar" required placeholder="APAAR-XXXXXXXXXXXX" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="gender">Gender</Label>
            <select id="gender" name="gender" className="h-9 rounded-md border bg-background px-3 text-sm">
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="transgender">Transgender</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="govtSchool" defaultChecked /> Studied Classes 6-12 in a government school
          </label>
          <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Check eligibility & disburse
          </Button>
        </form>

        {state.error ? <p className="mt-3 text-sm text-destructive">{state.error}</p> : null}

        {state.eligible === false ? (
          <div className="mt-3 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
            Not eligible: {state.reason}
          </div>
        ) : null}

        {state.result ? (
          <div className="mt-4 rounded-md border bg-muted/30 p-3 text-sm space-y-1">
            <div className="flex items-center gap-2">
              <Badge>{state.result.status}</Badge>
              {state.mode ? <Badge variant="outline">{state.mode}</Badge> : null}
            </div>
            <p className="font-mono">{state.result.apbsReference}</p>
            <p className="text-muted-foreground">Disbursed via DBT-APBS; anchored for CAG-ready audit.</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
