"use client"

import { useState, useTransition } from "react"
import type { CredentialKind, VerifiableCredential } from "@/lib/credentials"
import { mintAction, verifyAction } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const KINDS: CredentialKind[] = ["certificate", "badge", "micro-credential", "transcript"]

export function CredentialIssuer({ initial }: { initial: VerifiableCredential[] }) {
  const [issued, setIssued] = useState<VerifiableCredential[]>(initial)
  const [apaarId, setApaarId] = useState("APAAR-0001")
  const [title, setTitle] = useState("Foundational Numeracy — Grade 4")
  const [kind, setKind] = useState<CredentialKind>("micro-credential")
  const [results, setResults] = useState<Record<string, string>>({})
  const [mintError, setMintError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function mint() {
    startTransition(async () => {
      const r = await mintAction({ apaarId, kind, title, issuer: "Directorate of School Education, TN" })
      if (r.ok && r.credential) {
        setIssued((prev) => [r.credential!, ...prev])
        setMintError(null)
      } else {
        setMintError(r.error ?? "Mint failed.")
      }
    })
  }

  function verify(id: string) {
    startTransition(async () => {
      const r = await verifyAction(id)
      setResults((prev) => ({ ...prev, [id]: r.valid ? `✓ ${r.reason}` : `✗ ${r.reason}` }))
    })
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
      <Card>
        <CardHeader>
          <CardTitle>Mint soulbound credential</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="apaar">Holder (APAAR ID)</Label>
            <Input id="apaar" value={apaarId} onChange={(e) => setApaarId(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Kind</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as CredentialKind)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KINDS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {k}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={mint} disabled={pending} className="w-full">
            {pending ? "Minting…" : "Mint & anchor"}
          </Button>
          {mintError ? <p className="text-sm text-destructive">{mintError}</p> : null}
          <p className="text-xs text-muted-foreground">
            Non-transferable by construction — soulbound to the holder&apos;s APAAR ID and anchored to the audit ledger.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registry</CardTitle>
        </CardHeader>
        <CardContent>
          {issued.length ? (
            <ul className="space-y-3">
              {issued.map((c) => (
                <li key={c.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{c.title}</span>
                    <Badge variant="outline">{c.kind}</Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{c.id}</span>
                    <span>holder {c.apaarId}</span>
                    <span>anchor #{c.anchorSeq}</span>
                    <span className="font-mono">hash {c.contentHash}</span>
                    <Badge variant="secondary">soulbound</Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <Button size="sm" variant="outline" onClick={() => verify(c.id)} disabled={pending}>
                      Verify
                    </Button>
                    {results[c.id] ? (
                      <span
                        className={`text-xs ${results[c.id].startsWith("✓") ? "text-emerald-600" : "text-destructive"}`}
                      >
                        {results[c.id]}
                      </span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No credentials minted yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
