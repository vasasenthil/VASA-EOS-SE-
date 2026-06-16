"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import { inrCrore, sanctionBadgeVariant } from "@/lib/finance/fund-flow"
import { lookupSanctionAction, type SanctionLookupResult } from "./actions"

export function SanctionLookup() {
  const [id, setId] = useState("SANC-2026-0001")
  const [result, setResult] = useState<SanctionLookupResult | null>(null)
  const [pending, startTransition] = useTransition()

  function lookup() {
    startTransition(async () => {
      setResult(await lookupSanctionAction(id))
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sanction lookup (PFMS)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input value={id} onChange={(e) => setId(e.target.value)} placeholder="e.g. SANC-2026-0001" onKeyDown={(e) => e.key === "Enter" && lookup()} />
          <Button onClick={lookup} disabled={pending}><Search className="mr-2 h-4 w-4" />Look up</Button>
        </div>

        {result ? (
          result.ok && result.sanction ? (
            <div className="rounded-md border p-3 text-sm space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-medium">{result.sanction.sanctionId}</span>
                <Badge variant={sanctionBadgeVariant(result.sanction.status)}>{result.sanction.status}</Badge>
              </div>
              <p className="text-muted-foreground">{result.sanction.scheme} · {result.sanction.agency}</p>
              <p>Amount: <strong>{inrCrore(result.sanction.amount)}</strong>{result.sanction.releasedAt ? ` · released ${result.sanction.releasedAt}` : ""}</p>
              <p className="text-xs text-muted-foreground">{result.mode === "live" ? "Live" : "Mock"} · {result.traceId}</p>
            </div>
          ) : (
            <p className="text-sm text-red-600 dark:text-red-500">{result.error}</p>
          )
        ) : (
          <p className="text-xs text-muted-foreground">Enter a sanction id to resolve its scheme, agency, amount and fund status through the PFMS port.</p>
        )}
      </CardContent>
    </Card>
  )
}
