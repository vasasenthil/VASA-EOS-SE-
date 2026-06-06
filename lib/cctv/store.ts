// VASA-EOS(SE) — CCTV / surveillance register persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import type { Camera } from "./index"

function id(): string {
  return `CAM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  location: string
  zone: string
  working: boolean
  created_at: string
}

function fromRow(r: Row): Camera {
  return { id: r.id, location: r.location, zone: r.zone, working: r.working }
}

const store: Camera[] = []

export interface NewCamera {
  location: string
  zone: string
}

export async function createCamera(input: NewCamera): Promise<Camera> {
  const c: Camera = { id: id(), location: input.location, zone: input.zone, working: true }
  const db = getDb()
  if (db) {
    await db.from("cctv_cameras").insert({
      id: c.id,
      location: c.location,
      zone: c.zone,
      working: c.working,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(c)
  }
  await appendAudit({ actor: "safety", action: "cctv.register", resource: c.id, details: { zone: c.zone } })
  return c
}

async function load(cid: string): Promise<Camera | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("cctv_cameras").select("*").eq("id", cid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === cid)
}

export async function getCamera(cid: string): Promise<Camera | undefined> {
  return load(cid)
}

export async function setCameraWorking(cid: string, working: boolean): Promise<Camera | undefined> {
  const c = await load(cid)
  if (!c) return undefined
  c.working = working
  const db = getDb()
  if (db) await db.from("cctv_cameras").update({ working }).eq("id", cid)
  await appendAudit({ actor: "safety", action: "cctv.status", resource: cid, details: { working } })
  return c
}

export async function deleteCamera(cid: string): Promise<boolean> {
  const existing = await load(cid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("cctv_cameras").delete().eq("id", cid)
  } else {
    const i = store.findIndex((x) => x.id === cid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "cctv.delete", resource: cid })
  return true
}

export async function listCameras(): Promise<Camera[]> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("cctv_cameras").select("*").order("created_at", { ascending: false })
    return ((data as Row[] | null) ?? []).map(fromRow)
  }
  return [...store]
}
