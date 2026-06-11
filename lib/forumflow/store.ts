// VASA-EOS(SE) — Governance forum / meeting (RACI) flow persistence (server-only).
// Each meeting carries a live FORUM_RESOLUTION workflow instance: the Secretary tables
// the agenda, a quorum of Directors adopts the resolution, and the Minister ratifies
// significant items (dynamic). Durable in Supabase when configured; in-memory
// otherwise, with a couple of seeded meetings so oversight has data. Every action is
// audited; action-items are captured with the meeting.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { act, startInstance, type ActInput, type WorkflowInstance } from "@/lib/workflow"
import { FORUM_RESOLUTION } from "@/lib/workflow/definitions"

function id(): string {
  return `FM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

/** Rich detail captured by the governance forum resolution form. */
export interface ForumDetails {
  category?: string
  meetingDate?: string
  decisionText?: string
  responsible?: string
  accountable?: string
  fundImplication?: number
}

export interface ForumFlowRecord {
  id: string
  forum: string
  title: string
  requiresMinister: boolean
  actionItems: string[]
  instance: WorkflowInstance
  details?: ForumDetails
}

interface Row {
  id: string
  forum: string
  title: string
  requires_minister: boolean
  action_items: string[]
  instance: WorkflowInstance
  details?: ForumDetails
  created_at: string
}

function fromRow(r: Row): ForumFlowRecord {
  return {
    id: r.id,
    forum: r.forum,
    title: r.title,
    requiresMinister: r.requires_minister,
    actionItems: r.action_items ?? [],
    instance: r.instance,
    details: r.details,
  }
}

// Seeded so the Forums page and the Oversight Command Centre have live data without a DB.
function seed(): ForumFlowRecord[] {
  // 1) Significant budget item: Secretary convened, one Director adopted — awaiting the
  //    second Director toward quorum, then Minister ratification (requiresMinister).
  let budget = startInstance(FORUM_RESOLUTION, {
    requiresMinister: true,
    forum: "State Steering Committee",
  })
  budget = act(FORUM_RESOLUTION, budget, {
    actorRole: "SECRETARY",
    actor: "Secretary (seed)",
    decision: "approve",
    at: "2026-06-02T05:30:00.000Z",
  }).instance
  budget = act(FORUM_RESOLUTION, budget, {
    actorRole: "DIRECTOR",
    actor: "DSE (seed)",
    decision: "approve",
    at: "2026-06-03T05:30:00.000Z",
  }).instance

  // 2) Routine programme review: fresh, awaiting the Secretary to adopt the agenda.
  const sprint = startInstance(FORUM_RESOLUTION, {
    requiresMinister: false,
    forum: "Programme Management",
  })

  return [
    {
      id: "FM-SEED01",
      forum: "State Steering Committee",
      title: "Q1 FY26 budget review (> ₹100 Cr reallocation)",
      requiresMinister: true,
      actionItems: ["Approve revised PM POSHAN allocation", "Sanction CMBS vendor expansion"],
      instance: budget,
    },
    {
      id: "FM-SEED02",
      forum: "Programme Management",
      title: "Sprint 14 module review & UAT scheduling",
      requiresMinister: false,
      actionItems: ["Prioritise SIS persistence", "Schedule UAT with 3 pilot districts"],
      instance: sprint,
    },
  ]
}

const store: ForumFlowRecord[] = seed()

export interface NewForum {
  forum: string
  title: string
  requiresMinister: boolean
  actionItems?: string[]
  details?: ForumDetails
}

export async function fileForum(input: NewForum): Promise<ForumFlowRecord> {
  const rec: ForumFlowRecord = {
    id: id(),
    forum: input.forum,
    title: input.title,
    requiresMinister: input.requiresMinister,
    actionItems: input.actionItems ?? [],
    instance: startInstance(FORUM_RESOLUTION, { requiresMinister: input.requiresMinister, forum: input.forum }),
    details: input.details,
  }
  const db = getDb()
  if (db) {
    await db.from("forum_flows").insert({
      id: rec.id,
      forum: rec.forum,
      title: rec.title,
      requires_minister: rec.requiresMinister,
      action_items: rec.actionItems,
      instance: rec.instance,
      details: rec.details,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(rec)
  }
  await appendAudit({
    actor: "secretariat",
    action: "forumflow.file",
    resource: rec.id,
    details: { forum: rec.forum, category: rec.details?.category, requiresMinister: rec.requiresMinister },
  })
  return rec
}

async function load(rid: string): Promise<ForumFlowRecord | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("forum_flows").select("*").eq("id", rid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === rid)
}

export async function getForum(rid: string): Promise<ForumFlowRecord | undefined> {
  return load(rid)
}

export interface ActResult {
  ok: boolean
  record?: ForumFlowRecord
  reason?: string
}

export async function actOnForum(rid: string, input: ActInput): Promise<ActResult> {
  const rec = await load(rid)
  if (!rec) return { ok: false, reason: "Meeting not found." }
  const result = act(FORUM_RESOLUTION, rec.instance, input)
  if (!result.ok) return { ok: false, record: rec, reason: result.reason }
  rec.instance = result.instance
  const db = getDb()
  if (db) await db.from("forum_flows").update({ instance: rec.instance }).eq("id", rid)
  await appendAudit({
    actor: input.actor,
    action: "forumflow.decide",
    resource: rid,
    details: { role: input.actorRole, decision: input.decision, status: rec.instance.status },
  })
  return { ok: true, record: rec }
}

export async function deleteForum(rid: string): Promise<boolean> {
  const existing = await load(rid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("forum_flows").delete().eq("id", rid)
  } else {
    const i = store.findIndex((x) => x.id === rid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "forumflow.delete", resource: rid })
  return true
}

export async function listForums(): Promise<ForumFlowRecord[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("forum_flows").select("*").order("created_at", { ascending: false })
      return ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return [...store]
}
