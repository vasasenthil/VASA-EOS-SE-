// VASA-EOS(SE) — Lesson Plans persistence (server-only). Full CRUD.
// Durable in Supabase when configured (arrays + class notes as JSONB); in-memory seeded fallback
// otherwise. Every mutation audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { LessonPlan, LessonPlanInput, ResourceLink } from "./index"

function id(): string {
  return `LP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  class_level: string
  section: string
  subject: string
  teacher: string
  date: string
  period: number
  start_time: string
  end_time: string
  lesson_type: string
  topic: string
  objectives: string
  previous_topics: unknown
  further_topics: unknown
  materials_to_bring: unknown
  homework: string
  lesson_planner_link: string
  class_notes: unknown
  status: string
  tenant_id: string
  created_at: string
  updated_at: string
}

function parseStrArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string")
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v)
      return Array.isArray(p) ? p.filter((x) => typeof x === "string") : []
    } catch {
      return []
    }
  }
  return []
}

function parseNotes(v: unknown): ResourceLink[] {
  const arr = Array.isArray(v) ? v : typeof v === "string" ? safeJson(v) : []
  return (arr as any[]).filter((n) => n && typeof n.url === "string").map((n) => ({ kind: n.kind, title: n.title ?? "", url: n.url }))
}

function safeJson(s: string): unknown[] {
  try {
    const p = JSON.parse(s)
    return Array.isArray(p) ? p : []
  } catch {
    return []
  }
}

function fromRow(r: Row): LessonPlan {
  return {
    id: r.id, classLevel: r.class_level, section: r.section, subject: r.subject, teacher: r.teacher, date: r.date,
    period: r.period, startTime: r.start_time, endTime: r.end_time, lessonType: (r.lesson_type as LessonPlan["lessonType"]) ?? "Theory",
    topic: r.topic, objectives: r.objectives ?? "", previousTopics: parseStrArray(r.previous_topics), furtherTopics: parseStrArray(r.further_topics),
    materialsToBring: parseStrArray(r.materials_to_bring), homework: r.homework ?? "", lessonPlannerLink: r.lesson_planner_link ?? "",
    classNotes: parseNotes(r.class_notes), status: (r.status as LessonPlan["status"]) ?? "Draft", createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

function toRow(p: LessonPlan, tenantId: string): Record<string, unknown> {
  return {
    id: p.id, class_level: p.classLevel, section: p.section, subject: p.subject, teacher: p.teacher, date: p.date,
    period: p.period, start_time: p.startTime, end_time: p.endTime, lesson_type: p.lessonType, topic: p.topic,
    objectives: p.objectives, previous_topics: p.previousTopics, further_topics: p.furtherTopics, materials_to_bring: p.materialsToBring,
    homework: p.homework, lesson_planner_link: p.lessonPlannerLink, class_notes: p.classNotes, status: p.status,
    tenant_id: tenantId, created_at: p.createdAt, updated_at: p.updatedAt,
  }
}

function seed(): LessonPlan[] {
  const now = "2026-04-01T00:00:00.000Z"
  return [
    {
      id: "demo-lp-1", classLevel: "X", section: "A", subject: "Mathematics", teacher: "Mr. Sharma", date: "2026-06-30",
      period: 2, startTime: "09:45", endTime: "10:30", lessonType: "Theory", topic: "Quadratic equations — factorisation",
      objectives: "Solve quadratics by factorisation; relate roots to coefficients.",
      previousTopics: ["Linear equations", "Polynomials"], furtherTopics: ["Quadratic formula", "Nature of roots"],
      materialsToBring: ["Textbook ch.4", "Graph notebook", "Geometry box"], homework: "Exercise 4.2, Q1–Q10.",
      lessonPlannerLink: "https://diksha.gov.in/lesson/quadratics",
      classNotes: [
        { kind: "Video", title: "Factorisation walkthrough", url: "https://diksha.gov.in/v/quad-factor" },
        { kind: "Document", title: "Worked examples (PDF)", url: "https://diksha.gov.in/d/quad-examples.pdf" },
      ],
      status: "Planned", createdAt: now, updatedAt: now,
    },
    {
      id: "demo-lp-2", classLevel: "X", section: "A", subject: "Science", teacher: "Ms. Rao", date: "2026-06-30",
      period: 3, startTime: "10:45", endTime: "11:30", lessonType: "Practical", topic: "Acids, bases and indicators",
      objectives: "Test common substances with litmus and natural indicators.",
      previousTopics: ["pH scale"], furtherTopics: ["Salts", "Neutralisation"],
      materialsToBring: ["Lab coat", "Record notebook"], homework: "Write up the indicator observations.",
      lessonPlannerLink: "https://diksha.gov.in/lesson/acids-bases",
      classNotes: [{ kind: "Audio", title: "Pre-lab briefing", url: "https://diksha.gov.in/a/acids-brief.mp3" }],
      status: "Planned", createdAt: now, updatedAt: now,
    },
    {
      id: "demo-lp-3", classLevel: "IX", section: "B", subject: "Social Science", teacher: "Mr. Khan", date: "2026-07-01",
      period: 1, startTime: "09:00", endTime: "09:45", lessonType: "Field Work", topic: "Local water bodies survey",
      objectives: "Map and assess a nearby water body; record observations.",
      previousTopics: ["Resources and development"], furtherTopics: ["Conservation report"],
      materialsToBring: ["Clipboard", "Water bottle", "ID card"], homework: "Draft the field report.",
      lessonPlannerLink: "", classNotes: [], status: "Draft", createdAt: now, updatedAt: now,
    },
  ]
}

const store: LessonPlan[] = seed()

export async function listLessonPlans(): Promise<LessonPlan[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("lesson_plans").select("*").order("date", { ascending: false })
      const rows = ((data as Row[] | null) ?? []).map(fromRow)
      return rows.length > 0 ? rows : seed()
    } catch {
      return seed()
    }
  }
  return [...store]
}

export async function getLessonPlan(lid: string): Promise<LessonPlan | undefined> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("lesson_plans").select("*").eq("id", lid).maybeSingle()
      if (data) return fromRow(data as Row)
    } catch {
      /* fall through */
    }
    return seed().find((p) => p.id === lid)
  }
  return store.find((p) => p.id === lid)
}

export async function createLessonPlan(input: LessonPlanInput, tenantId = DEFAULT_SCHOOL_NODE): Promise<LessonPlan> {
  const now = new Date().toISOString()
  const p: LessonPlan = { id: id(), ...input, createdAt: now, updatedAt: now }
  const db = getDb()
  if (db) await db.from("lesson_plans").insert(toRow(p, tenantId))
  else store.unshift(p)
  await appendAudit({ actor: "academics", action: "lessonplan.create", resource: p.id, details: { topic: p.topic, status: p.status } })
  return p
}

export async function updateLessonPlan(lid: string, input: LessonPlanInput): Promise<LessonPlan | undefined> {
  const existing = await getLessonPlan(lid)
  if (!existing) return undefined
  const updated: LessonPlan = { ...existing, ...input, updatedAt: new Date().toISOString() }
  const db = getDb()
  if (db) {
    await db.from("lesson_plans").update({
      class_level: updated.classLevel, section: updated.section, subject: updated.subject, teacher: updated.teacher, date: updated.date,
      period: updated.period, start_time: updated.startTime, end_time: updated.endTime, lesson_type: updated.lessonType, topic: updated.topic,
      objectives: updated.objectives, previous_topics: updated.previousTopics, further_topics: updated.furtherTopics,
      materials_to_bring: updated.materialsToBring, homework: updated.homework, lesson_planner_link: updated.lessonPlannerLink,
      class_notes: updated.classNotes, status: updated.status, updated_at: updated.updatedAt,
    }).eq("id", lid)
  } else {
    const i = store.findIndex((p) => p.id === lid)
    if (i >= 0) store[i] = updated
  }
  await appendAudit({ actor: "academics", action: "lessonplan.update", resource: lid, details: { status: updated.status } })
  return updated
}

export async function deleteLessonPlan(lid: string): Promise<boolean> {
  const db = getDb()
  if (db) {
    await db.from("lesson_plans").delete().eq("id", lid)
  } else {
    const i = store.findIndex((p) => p.id === lid)
    if (i < 0) return false
    store.splice(i, 1)
  }
  await appendAudit({ actor: "academics", action: "lessonplan.delete", resource: lid })
  return true
}

export async function seedLessonPlans(tenantId = DEFAULT_SCHOOL_NODE): Promise<number> {
  const rows = seed()
  const db = getDb()
  if (db) {
    for (const p of rows) await db.from("lesson_plans").upsert(toRow(p, tenantId))
  } else {
    for (const p of rows) if (!store.some((s) => s.id === p.id)) store.push(p)
  }
  await appendAudit({ actor: "academics", action: "lessonplan.seed", resource: "lesson_plans", details: { count: rows.length } })
  return rows.length
}
