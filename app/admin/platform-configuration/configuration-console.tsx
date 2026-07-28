"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { CONFIGURATION_CONTROLS, type ConfigurationProposal } from "@/lib/configuration/governed"

export function ConfigurationConsole({ proposals, roles }: { proposals: ConfigurationProposal[]; roles: string[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)
  const canDecide = roles.some((role) => ["SECRETARY", "ADMIN"].includes(role))
  const canActivate = roles.includes("ADMIN")

  async function request(path: string, body?: unknown) {
    setBusy(true)
    const response = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined })
    const result = await response.json() as { error?: string }
    setBusy(false)
    if (!response.ok) return toast({ title: "Configuration change blocked", description: result.error ?? "Request failed", variant: "destructive" })
    toast({ title: "Configuration workflow updated", description: "The immutable version history and audit trail have been updated." })
    router.refresh()
  }

  async function submit(formData: FormData) {
    await request("/api/admin/platform-configuration", {
      control: formData.get("control"), value: formData.get("value"), tenantScope: String(formData.get("tenantScope") ?? "").split(",").map((value) => value.trim()).filter(Boolean),
      rationale: formData.get("rationale"), reference: formData.get("reference"), risk: formData.get("risk"),
      activationAt: formData.get("activationAt") || undefined, expiresAt: formData.get("expiresAt") || undefined,
    })
  }

  return <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
    <Card><CardHeader><CardTitle className="text-base">Submit proposal</CardTitle><CardDescription>Only allowlisted, non-secret controls are accepted. Submission never activates a change.</CardDescription></CardHeader>
      <CardContent><form action={submit} className="space-y-4">
        <div><Label htmlFor="control">Control</Label><select id="control" name="control" className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm">{CONFIGURATION_CONTROLS.map((control) => <option key={control}>{control}</option>)}</select></div>
        <div><Label htmlFor="value">Proposed value</Label><Input id="value" name="value" required placeholder="Non-secret value" /></div>
        <div><Label htmlFor="scope">Tenant scope</Label><Input id="scope" name="tenantScope" required defaultValue="TN" placeholder="TN, TN-CHN" /></div>
        <div><Label htmlFor="reference">Ticket / GO / incident reference</Label><Input id="reference" name="reference" required placeholder="CHG-2026-0042" /></div>
        <div><Label htmlFor="rationale">Rationale</Label><Textarea id="rationale" name="rationale" minLength={15} required placeholder="Explain the operational need, impact, and rollback trigger." /></div>
        <div><Label htmlFor="risk">Risk</Label><select id="risk" name="risk" className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"><option>low</option><option>medium</option><option>high</option></select></div>
        <div className="grid gap-3 sm:grid-cols-2"><div><Label htmlFor="activation">Activate after</Label><Input id="activation" name="activationAt" type="datetime-local" /></div><div><Label htmlFor="expiry">Optional expiry</Label><Input id="expiry" name="expiresAt" type="datetime-local" /></div></div>
        <Button type="submit" disabled={busy}>{busy ? "Submitting…" : "Submit for approval"}</Button>
      </form></CardContent>
    </Card>
    <Card><CardHeader><CardTitle className="text-base">Immutable version history</CardTitle><CardDescription>Self-approval is rejected server-side. Activation and rollback are separate audited operations.</CardDescription></CardHeader>
      <CardContent className="space-y-3">{proposals.length === 0 ? <p className="text-sm text-muted-foreground">No configuration proposals have been submitted.</p> : proposals.map((proposal) => <div key={proposal.id} className="rounded-lg border p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-medium">v{proposal.version} · {proposal.control}</p><p className="text-xs text-muted-foreground">{proposal.reference} · {proposal.tenantScope.join(", ")} · {proposal.risk} risk</p></div><Badge>{proposal.status}</Badge></div><p className="mt-2 text-sm">{proposal.rationale}</p><div className="mt-3 flex flex-wrap gap-2">{proposal.status === "submitted" && canDecide && <><Button size="sm" disabled={busy} onClick={() => request(`/api/admin/platform-configuration/${proposal.id}/decision`, { decision: "approve" })}>Approve</Button><Button size="sm" variant="destructive" disabled={busy} onClick={() => request(`/api/admin/platform-configuration/${proposal.id}/decision`, { decision: "reject" })}>Reject</Button></>}{proposal.status === "approved" && canActivate && <Button size="sm" disabled={busy} onClick={() => request(`/api/admin/platform-configuration/${proposal.id}/activate`)}>Activate</Button>}{proposal.status === "active" && <Button size="sm" variant="outline" disabled={busy} onClick={() => request(`/api/admin/platform-configuration/${proposal.id}/rollback`)}>Propose rollback</Button>}</div></div>)}</CardContent>
    </Card>
  </div>
}
