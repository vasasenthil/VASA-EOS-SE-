"use server"

import { createProposal, vote, castBallot, listProposals } from "@/lib/smc/store"
import { SMC_ROSTER, type Proposal } from "@/lib/smc"
import { can } from "@/lib/access/policy"
import { resolveSubject } from "@/lib/access/resolve"

export interface SmcState {
  proposals: Proposal[]
  error?: string
}

export async function smcAction(_prev: SmcState, formData: FormData): Promise<SmcState> {
  const op = (formData.get("op") as string) || "create"
  const subject = await resolveSubject()

  if (op === "create") {
    const title = ((formData.get("title") as string) || "").trim()
    const description = ((formData.get("description") as string) || "").trim()
    if (!title) return { proposals: await listProposals(), error: "Proposal title is required." }
    const d = can(subject, "create:proposal", { type: "smc" })
    if (!d.permitted) return { proposals: await listProposals(), error: `Not allowed: ${d.reason}` }
    await createProposal({ title, description })
  } else if (op === "for" || op === "against") {
    const d = can(subject, "vote:smc", { type: "smc" })
    if (!d.permitted) return { proposals: await listProposals(), error: `Not allowed: ${d.reason}` }
    await vote({ id: (formData.get("id") as string) || "", support: op === "for" })
  } else if (op === "ballot") {
    // Attributable, one-member-one-vote ballot (the accountable path).
    const d = can(subject, "vote:smc", { type: "smc" })
    if (!d.permitted) return { proposals: await listProposals(), error: `Not allowed: ${d.reason}` }
    const memberId = (formData.get("memberId") as string) || ""
    if (!SMC_ROSTER.some((m) => m.id === memberId)) return { proposals: await listProposals(), error: "Select a valid SMC member." }
    await castBallot({ id: (formData.get("id") as string) || "", memberId, support: (formData.get("support") as string) === "true" })
  }

  return { proposals: await listProposals() }
}
