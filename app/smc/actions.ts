"use server"

import { createProposal, vote, listProposals, type Proposal } from "@/lib/smc"

export interface SmcState {
  proposals: Proposal[]
  error?: string
}

export async function smcAction(_prev: SmcState, formData: FormData): Promise<SmcState> {
  const op = (formData.get("op") as string) || "create"

  if (op === "create") {
    const title = ((formData.get("title") as string) || "").trim()
    const description = ((formData.get("description") as string) || "").trim()
    if (!title) return { proposals: listProposals(), error: "Proposal title is required." }
    createProposal({ title, description })
  } else if (op === "for") {
    vote({ id: (formData.get("id") as string) || "", support: true })
  } else if (op === "against") {
    vote({ id: (formData.get("id") as string) || "", support: false })
  }

  return { proposals: listProposals() }
}
