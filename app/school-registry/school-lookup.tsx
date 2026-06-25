"use client"

import { useActionState } from "react"
import { lookupAction, type RegistryState } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const initial: RegistryState = { schools: [] }

export function SchoolLookup({ mode }: { mode: "mock" | "live" }) {
  const [state, formAction, pending] = useActionState(lookupAction, initial)

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.8fr]">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>UDISE+ lookup</CardTitle>
            <Badge variant={mode === "live" ? "default" : "secondary"}>{mode === "live" ? "UDISE+ live" : "mock"}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form action={formAction} className="space-y-3">
            <input type="hidden" name="op" value="get" />
            <div className="space-y-1.5">
              <Label htmlFor="udise">By UDISE code</Label>
              <Input id="udise" name="udise" placeholder="e.g. 33010100101" />
            </div>
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Looking up…" : "Get school"}
            </Button>
          </form>

          <form action={formAction} className="space-y-3">
            <input type="hidden" name="op" value="search" />
            <div className="space-y-1.5">
              <Label htmlFor="q">By name / district</Label>
              <Input id="q" name="q" placeholder="e.g. Egmore" />
            </div>
            <Button type="submit" variant="outline" disabled={pending} className="w-full">
              {pending ? "Searching…" : "Search registry"}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground">
            {mode === "live"
              ? "Calling the configured UDISE+ gateway live."
              : "Returning mock results. Set INTEGRATION_UDISE=live and UDISE_BASE_URL to call a real gateway."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Results</CardTitle>
            {state.traceId ? <span className="font-mono text-xs text-muted-foreground">{state.traceId}</span> : null}
          </div>
        </CardHeader>
        <CardContent>
          {state.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : !state.queried ? (
            <p className="text-sm text-muted-foreground">Look up a school by UDISE code or search the registry.</p>
          ) : state.schools.length === 0 ? (
            <p className="text-sm text-muted-foreground">No schools found.</p>
          ) : (
            <ul className="space-y-2">
              {state.schools.map((s) => (
                <li key={s.udiseCode} className="rounded-md border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{s.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">{s.udiseCode}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {s.district ? <Badge variant="outline">{s.district}</Badge> : null}
                    {s.block ? <Badge variant="outline">{s.block}</Badge> : null}
                    {s.managementType ? <Badge variant="outline">{s.managementType}</Badge> : null}
                    {s.board ? <Badge variant="outline">{s.board}</Badge> : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
