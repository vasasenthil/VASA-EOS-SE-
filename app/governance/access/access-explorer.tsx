"use client"

import { useState } from "react"
import { PORTALS, type PortalRole } from "@/config/portals"
import { allActions, can, subjectForRoles } from "@/lib/access/policy"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

const ROLES = Object.keys(PORTALS) as PortalRole[]
const ACTIONS = allActions()

export function AccessExplorer() {
  const [role, setRole] = useState<PortalRole>("TEACHER")
  const [action, setAction] = useState(ACTIONS[0])
  const [suspended, setSuspended] = useState(false)
  const [emergency, setEmergency] = useState(false)
  const [highThreat, setHighThreat] = useState(false)
  const [sensitive, setSensitive] = useState(false)
  const [pii, setPii] = useState(false)

  const decision = can(
    subjectForRoles([role], suspended ? { suspended: true } : undefined),
    action,
    { type: "resource", attributes: { sensitive, pii } },
    { emergency, threatLevel: highThreat ? "high" : "low" },
  )

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="role">Role (subject)</Label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as PortalRole)}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {PORTALS[r].label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="action">Action</Label>
            <select
              id="action"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="h-9 w-full rounded-md border bg-background px-3 font-mono text-sm"
            >
              {ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <Toggle id="susp" label="Subject suspended" checked={suspended} onChange={setSuspended} />
            <Toggle id="emg" label="Emergency window" checked={emergency} onChange={setEmergency} />
            <Toggle id="thr" label="High threat" checked={highThreat} onChange={setHighThreat} />
            <Toggle id="sens" label="Resource sensitive" checked={sensitive} onChange={setSensitive} />
            <Toggle id="pii" label="Resource has PII" checked={pii} onChange={setPii} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Decision (PDP)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Badge variant={decision.permitted ? "default" : "destructive"} className="text-sm">
            {decision.permitted ? "PERMIT" : "DENY"}
          </Badge>
          <p className="text-sm text-muted-foreground">{decision.reason}</p>
          <div className="rounded-md border bg-muted/40 p-3 font-mono text-xs">
            {role} · {action}
            <br />
            {`{ suspended: ${suspended}, emergency: ${emergency}, threat: ${highThreat ? "high" : "low"}, sensitive: ${sensitive}, pii: ${pii} }`}
          </div>
          <p className="text-xs text-muted-foreground">
            Combines RBAC · ReBAC · ABAC · PBAC · CABAC. Deny policies win; absent any grant it fails closed.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function Toggle({
  id,
  label,
  checked,
  onChange,
}: {
  id: string
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(v === true)} />
      <Label htmlFor={id} className="text-sm">
        {label}
      </Label>
    </div>
  )
}
