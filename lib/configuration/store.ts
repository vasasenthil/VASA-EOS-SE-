import { appendAudit } from "@/lib/audit/trail"
import { requireDb } from "@/lib/db"
import { activateProposal, approveProposal, createProposal, rejectProposal, rollbackProposal, type ConfigurationProposal } from "./governed"

const TABLE = "governed_configuration_proposals"

function fromRow(row: Record<string, unknown>): ConfigurationProposal {
  return {
    id: String(row.id), version: Number(row.version), control: row.control as ConfigurationProposal["control"], value: row.value as string | boolean,
    tenantScope: (row.tenant_scope ?? []) as string[], rationale: String(row.rationale), reference: String(row.reference), risk: row.risk as ConfigurationProposal["risk"],
    status: row.status as ConfigurationProposal["status"], proposedBy: String(row.proposed_by), approvedBy: row.approved_by ? String(row.approved_by) : undefined,
    activatedBy: row.activated_by ? String(row.activated_by) : undefined, activationAt: row.activation_at ? String(row.activation_at) : undefined,
    expiresAt: row.expires_at ? String(row.expires_at) : undefined, rollbackOf: row.rollback_of ? String(row.rollback_of) : undefined,
    createdAt: String(row.created_at), updatedAt: String(row.updated_at),
  }
}

function toRow(proposal: ConfigurationProposal): Record<string, unknown> {
  return {
    id: proposal.id, version: proposal.version, control: proposal.control, value: proposal.value, tenant_scope: proposal.tenantScope,
    rationale: proposal.rationale, reference: proposal.reference, risk: proposal.risk, status: proposal.status, proposed_by: proposal.proposedBy,
    approved_by: proposal.approvedBy ?? null, activated_by: proposal.activatedBy ?? null, activation_at: proposal.activationAt ?? null,
    expires_at: proposal.expiresAt ?? null, rollback_of: proposal.rollbackOf ?? null, created_at: proposal.createdAt, updated_at: proposal.updatedAt,
  }
}

export async function listConfigurationProposals(): Promise<ConfigurationProposal[]> {
  const { data, error } = await requireDb().from(TABLE).select("*").order("version", { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => fromRow(row as Record<string, unknown>))
}

export async function getConfigurationProposal(id: string): Promise<ConfigurationProposal> {
  const { data, error } = await requireDb().from(TABLE).select("*").eq("id", id).single()
  if (error || !data) throw error ?? new Error("Configuration proposal not found")
  return fromRow(data as Record<string, unknown>)
}

export async function submitConfigurationProposal(input: Omit<ConfigurationProposal, "id" | "version" | "status" | "createdAt" | "updatedAt">): Promise<ConfigurationProposal> {
  const existing = await listConfigurationProposals()
  const proposal = createProposal(input, (existing[0]?.version ?? 0) + 1)
  const { error } = await requireDb().from(TABLE).insert(toRow(proposal))
  if (error) throw error
  await appendAudit({ actor: input.proposedBy, action: "configuration.proposed", resource: proposal.id, details: { control: proposal.control, version: proposal.version, reference: proposal.reference } })
  return proposal
}

async function persist(proposal: ConfigurationProposal, action: string, actor: string): Promise<ConfigurationProposal> {
  const { error } = await requireDb().from(TABLE).update(toRow(proposal)).eq("id", proposal.id)
  if (error) throw error
  await appendAudit({ actor, action, resource: proposal.id, details: { control: proposal.control, version: proposal.version, status: proposal.status } })
  return proposal
}

export async function decideConfigurationProposal(id: string, actor: string, decision: "approve" | "reject") {
  const current = await getConfigurationProposal(id)
  return persist(decision === "approve" ? approveProposal(current, actor) : rejectProposal(current, actor), `configuration.${decision}d`, actor)
}

export async function activateConfigurationProposal(id: string, actor: string) {
  const checked = activateProposal(await getConfigurationProposal(id), actor)
  const { data, error } = await requireDb().rpc("activate_governed_configuration", { p_id: id, p_actor: actor })
  if (error || !data) throw error ?? new Error("Atomic configuration activation failed")
  const proposal = fromRow((Array.isArray(data) ? data[0] : data) as Record<string, unknown>)
  await appendAudit({ actor, action: "configuration.activated", resource: proposal.id, details: { control: proposal.control, version: proposal.version, status: checked.status } })
  return proposal
}

export async function proposeConfigurationRollback(id: string, actor: string) {
  const existing = await listConfigurationProposals()
  const proposal = rollbackProposal(await getConfigurationProposal(id), actor, (existing[0]?.version ?? 0) + 1)
  const { error } = await requireDb().from(TABLE).insert(toRow(proposal))
  if (error) throw error
  await appendAudit({ actor, action: "configuration.rollback.proposed", resource: proposal.id, details: { rollbackOf: id, version: proposal.version } })
  return proposal
}
