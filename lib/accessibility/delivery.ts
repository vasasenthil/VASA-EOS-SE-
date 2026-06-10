// VASA-EOS(SE) — last-mile delivery posture: closing the digital divide (Accessibility / equity).
//
// Reaching every child means designing for Tamil Nadu's real conditions, not Silicon
// Valley's assumptions: intermittent connectivity, unreliable power, low-literacy guardians,
// basic devices, dialect diversity and seasonal disruption. This declares the delivery
// capabilities that attack each barrier and the geographies they serve, with an honest
// status — most are runtime/edge infrastructure provisioned at deploy, so they are marked
// 'infra' or 'partial', not overclaimed. Self-verified against the i18n dialect list (the
// "8 Tamil dialects" claim is the actual locale data). Pure + client-safe.

import { csvField } from "@/lib/csv"

import { LOCALES } from "@/lib/i18n"

export type Barrier = "connectivity" | "electricity" | "literacy" | "device" | "dialect" | "disruption"
export type DeliveryStatus = "enforced" | "partial" | "infra"

export interface DeliveryCapability {
  id: string
  name: string
  capability: string
  /** Barriers this capability overcomes. */
  barriers: Barrier[]
  status: DeliveryStatus
}

export const DELIVERY_CAPABILITIES: DeliveryCapability[] = [
  { id: "offline-pwa", name: "Offline-first PWA", capability: "Usable without constant internet; cached shell + local data", barriers: ["connectivity"], status: "partial" },
  { id: "sync-when-connected", name: "Sync-when-connected", capability: "Background sync of queued changes when a network returns", barriers: ["connectivity"], status: "infra" },
  { id: "low-bandwidth", name: "Low-bandwidth / 2G", capability: "Lightweight interfaces that work on basic mobile connectivity", barriers: ["connectivity", "device"], status: "partial" },
  { id: "solar-edge", name: "Solar-powered edge nodes", capability: "Local compute where grid electricity is unreliable", barriers: ["electricity"], status: "infra" },
  { id: "ivr-voice", name: "IVR / voice", capability: "Voice-based interaction for guardians who cannot read", barriers: ["literacy"], status: "partial" },
  { id: "tamil-dialects", name: "Tamil dialect recognition", capability: "AI recognition across Tamil Nadu's Tamil dialects (Kongu, Madurai, Kanyakumari…)", barriers: ["dialect"], status: "partial" },
  { id: "disruption-resilience", name: "Disruption resilience", capability: "Continuity for coastal cyclones & seasonal migration; resumable journeys", barriers: ["disruption"], status: "infra" },
]

// Geographies the delivery posture is explicitly designed for.
export const GEOGRAPHIES: { id: string; name: string; note: string }[] = [
  { id: "rural", name: "Rural", note: "Offline-first, low-bandwidth, voice-based" },
  { id: "urban", name: "Urban", note: "Full-featured portals + real-time analytics" },
  { id: "hills", name: "Hill areas (Nilgiris)", note: "Tribal equity, PESA, mother-tongue materials" },
  { id: "coastal", name: "Coastal districts", note: "Cyclone preparedness, fishing-family seasonality" },
  { id: "border", name: "Border districts", note: "Cross-border learning portability" },
  { id: "tribal", name: "Tribal hamlets", note: "Toda/Kota/Irula/Kurumba mother-tongue support" },
]

export const BARRIERS: Barrier[] = ["connectivity", "electricity", "literacy", "device", "dialect", "disruption"]

/** The Tamil dialects recognised — the authoritative list from the i18n locale data. */
export function tamilDialects(): string[] {
  return LOCALES.find((l) => l.code === "ta")?.dialects ?? []
}

export function capabilityById(id: string): DeliveryCapability | undefined {
  return DELIVERY_CAPABILITIES.find((c) => c.id === id)
}

export function byBarrier(barrier: Barrier): DeliveryCapability[] {
  return DELIVERY_CAPABILITIES.filter((c) => c.barriers.includes(barrier))
}

/** Barriers with no delivery capability (should be none). */
export function uncoveredBarriers(): Barrier[] {
  return BARRIERS.filter((b) => byBarrier(b).length === 0)
}

export interface DeliverySummary {
  capabilities: number
  barriersCovered: number
  geographies: number
  tamilDialects: number
}

export function deliverySummary(): DeliverySummary {
  return {
    capabilities: DELIVERY_CAPABILITIES.length,
    barriersCovered: new Set(DELIVERY_CAPABILITIES.flatMap((c) => c.barriers)).size,
    geographies: GEOGRAPHIES.length,
    tamilDialects: tamilDialects().length,
  }
}


export function toCSV(items: DeliveryCapability[] = DELIVERY_CAPABILITIES): string {
  const header = ["Capability", "What it does", "Barriers", "Status"]
  const rows = items.map((c) => [c.name, c.capability, c.barriers.join("; "), c.status].map(csvField).join(","))
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
