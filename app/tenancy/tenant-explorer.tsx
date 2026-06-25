"use client"

import { useState } from "react"
import { DEMO_TENANTS, ancestorsOf } from "@/lib/tenancy"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronRight } from "lucide-react"

export function TenantExplorer() {
  const [selected, setSelected] = useState(DEMO_TENANTS[DEMO_TENANTS.length - 1]?.id)
  const chain = ancestorsOf(DEMO_TENANTS, selected)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tenant Sovereignty Path</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 max-w-md">
          <label htmlFor="tenant" className="text-sm font-medium">
            Current tenant
          </label>
          <select
            id="tenant"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            {DEMO_TENANTS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.tier})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-1 text-sm">
          {chain.map((t, i) => (
            <span key={t.id} className="flex items-center gap-1">
              <Badge variant={i === chain.length - 1 ? "default" : "outline"}>{t.name}</Badge>
              {i < chain.length - 1 ? <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" /> : null}
            </span>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Each tier governs its descendants and reports upward; data stays within the tenant and federates only with
          explicit, withdrawable consent.
        </p>
      </CardContent>
    </Card>
  )
}
