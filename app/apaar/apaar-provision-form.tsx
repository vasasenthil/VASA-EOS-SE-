"use client"

import { useActionState } from "react"
import { provisionApaarAction, type ApaarState } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

const initial: ApaarState = {}

export function ApaarProvisionForm() {
  const [state, formAction, isPending] = useActionState(provisionApaarAction, initial)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Provision APAAR (Anganwadi / Class 1 enrolment)</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-3 max-w-md">
          <div className="grid gap-2">
            <Label htmlFor="name">Student name</Label>
            <Input id="name" name="name" required placeholder="e.g., Aarthi M" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dob">Date of birth</Label>
            <Input id="dob" name="dob" type="date" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="consent" /> Aadhaar linkage consent (DPDP — guardian for under-18)
          </label>
          <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Provision APAAR
          </Button>
        </form>

        {state.error ? <p className="mt-3 text-sm text-destructive">{state.error}</p> : null}

        {state.duplicates && state.duplicates.length > 0 ? (
          <ul className="mt-3 space-y-1 text-sm">
            {state.duplicates.map((d) => (
              <li key={d.apaarId}>
                {d.apaarId} — match {(d.score * 100).toFixed(0)}%
              </li>
            ))}
          </ul>
        ) : null}

        {state.record ? (
          <div className="mt-4 rounded-md border bg-muted/30 p-3 text-sm space-y-1">
            <div className="flex items-center gap-2">
              <Badge>APAAR provisioned</Badge>
              {state.mode ? <Badge variant="outline">{state.mode}</Badge> : null}
            </div>
            <p className="font-mono">{state.record.apaarId}</p>
            <p>{state.record.name}</p>
            <p className="text-muted-foreground">Lifelong identity issued; credential push to DigiLocker available.</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
