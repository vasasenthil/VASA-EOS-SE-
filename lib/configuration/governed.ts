export const CONFIGURATION_CONTROLS = [
  "maintenance_mode",
  "notification_policy",
  "retention_profile",
  "feature_release",
] as const

export type ConfigurationControl = typeof CONFIGURATION_CONTROLS[number]
export type ConfigurationStatus = "submitted" | "approved" | "active" | "rejected" | "superseded"
export type RiskLevel = "low" | "medium" | "high"

export interface ConfigurationProposal {
  id: string
  version: number
  control: ConfigurationControl
  value: string | boolean
  tenantScope: string[]
  rationale: string
  reference: string
  risk: RiskLevel
  status: ConfigurationStatus
  proposedBy: string
  approvedBy?: string
  activatedBy?: string
  activationAt?: string
  expiresAt?: string
  rollbackOf?: string
  createdAt: string
  updatedAt: string
}

const PROHIBITED_KEY = /secret|password|token|private.?key|api.?key|connection|string|endpoint|integration.?mode/i

export function validateProposalInput(input: Partial<ConfigurationProposal>): string[] {
  const errors: string[] = []
  if (!CONFIGURATION_CONTROLS.includes(input.control as ConfigurationControl)) errors.push("Unsupported or secret-bearing configuration control")
  if (PROHIBITED_KEY.test(String(input.control ?? ""))) errors.push("Secrets, endpoints, and integration modes are deployment controlled")
  if (typeof input.value !== "string" && typeof input.value !== "boolean") errors.push("Configuration value must be a string or boolean")
  if (!input.rationale?.trim() || input.rationale.trim().length < 15) errors.push("Rationale must contain at least 15 characters")
  if (!input.reference?.trim()) errors.push("Ticket, incident, or Government Order reference is required")
  if (!input.tenantScope?.length) errors.push("At least one tenant scope is required")
  if (!(["low", "medium", "high"] as const).includes(input.risk as RiskLevel)) errors.push("Risk level is invalid")
  if (input.expiresAt && input.activationAt && Date.parse(input.expiresAt) <= Date.parse(input.activationAt)) errors.push("Expiry must be after activation")
  return errors
}

export function createProposal(input: Omit<ConfigurationProposal, "id" | "version" | "status" | "createdAt" | "updatedAt">, version: number, now = new Date().toISOString()): ConfigurationProposal {
  const errors = validateProposalInput(input)
  if (errors.length) throw new Error(errors.join("; "))
  return { ...input, id: crypto.randomUUID(), version, status: "submitted", createdAt: now, updatedAt: now }
}

export function approveProposal(proposal: ConfigurationProposal, approver: string, now = new Date().toISOString()): ConfigurationProposal {
  if (proposal.status !== "submitted") throw new Error("Only submitted proposals can be approved")
  if (proposal.proposedBy === approver) throw new Error("Segregation of duties prohibits self-approval")
  return { ...proposal, status: "approved", approvedBy: approver, updatedAt: now }
}

export function rejectProposal(proposal: ConfigurationProposal, approver: string, now = new Date().toISOString()): ConfigurationProposal {
  if (proposal.status !== "submitted") throw new Error("Only submitted proposals can be rejected")
  if (proposal.proposedBy === approver) throw new Error("Segregation of duties prohibits self-decision")
  return { ...proposal, status: "rejected", approvedBy: approver, updatedAt: now }
}

export function activateProposal(proposal: ConfigurationProposal, actor: string, now = new Date().toISOString()): ConfigurationProposal {
  if (proposal.status !== "approved") throw new Error("Only approved proposals can be activated")
  if (!proposal.approvedBy) throw new Error("Approval evidence is required")
  if (proposal.activationAt && Date.parse(proposal.activationAt) > Date.parse(now)) throw new Error("Scheduled activation time has not arrived")
  return { ...proposal, status: "active", activatedBy: actor, updatedAt: now }
}

export function rollbackProposal(active: ConfigurationProposal, actor: string, version: number, now = new Date().toISOString()): ConfigurationProposal {
  if (active.status !== "active") throw new Error("Only active configuration can be rolled back")
  return {
    ...active,
    id: crypto.randomUUID(),
    version,
    status: "submitted",
    proposedBy: actor,
    approvedBy: undefined,
    activatedBy: undefined,
    rollbackOf: active.id,
    rationale: `Rollback of configuration ${active.id}: ${active.rationale}`,
    createdAt: now,
    updatedAt: now,
  }
}
