// VASA-EOS(SE) — multi-channel & IVR access catalogue (Accessibility / outreach).
//
// Reaching 1.27 crore students and their guardians — many low-literacy or rural —
// means the platform cannot be web-only. This declares the access channels (web,
// mobile, SMS, IVR/voice, WhatsApp, kiosk, assisted field officer) with their modality
// and literacy/offline characteristics, and the core voice IVR flows for citizen
// journeys (attendance, scheme status, results, grievance). Two relationships are
// self-verified by tests: every IVR flow's language codes exist in the language
// catalogue, and every flow's backing module exists on disk. Pure + client-safe.

import { csvField } from "@/lib/csv"

import { languageByCode } from "@/lib/i18n/languages"

export type Modality = "visual" | "voice" | "text"

export interface Channel {
  id: string
  name: string
  modality: Modality
  /** Does the channel require the user to read/write? */
  literacyRequired: boolean
  offlineCapable: boolean
  audience: string
}

export const CHANNELS: Channel[] = [
  { id: "web", name: "Web portal", modality: "visual", literacyRequired: true, offlineCapable: false, audience: "Officials, HMs, teachers" },
  { id: "mobile", name: "Mobile app", modality: "visual", literacyRequired: true, offlineCapable: true, audience: "Teachers, parents, students" },
  { id: "ivr", name: "IVR / voice (toll-free)", modality: "voice", literacyRequired: false, offlineCapable: true, audience: "Low-literacy & rural guardians" },
  { id: "sms", name: "SMS", modality: "text", literacyRequired: true, offlineCapable: true, audience: "Guardians — alerts & OTP" },
  { id: "whatsapp", name: "WhatsApp", modality: "text", literacyRequired: true, offlineCapable: false, audience: "Guardians — rich notifications" },
  { id: "kiosk", name: "CSC / school kiosk", modality: "voice", literacyRequired: false, offlineCapable: false, audience: "Assisted access, common-service centres" },
  { id: "field", name: "Field officer (assisted)", modality: "voice", literacyRequired: false, offlineCapable: true, audience: "Last-mile, tribal & remote" },
]

export interface IvrFlow {
  id: string
  title: string
  /** Plain-language description of the voice journey. */
  journey: string
  /** Language codes offered (must exist in the language catalogue). */
  languages: string[]
  /** Backing module that serves the data (asserted to exist on disk). */
  backedBy: string
  keypad: string[]
}

export const IVR_FLOWS: IvrFlow[] = [
  { id: "ivr_attendance", title: "Attendance & alerts", journey: "Hear today's attendance and absence alerts for a child", languages: ["ta", "en", "te", "ur"], backedBy: "lib/attendance", keypad: ["1 Today's attendance", "2 Absence alert", "9 Repeat"] },
  { id: "ivr_scheme", title: "Scheme / DBT status", journey: "Check eligibility and disbursement status of a scheme", languages: ["ta", "en", "te", "kn"], backedBy: "lib/integrations/live/dbt.ts", keypad: ["1 Eligibility", "2 Last payment", "0 Speak to officer"] },
  { id: "ivr_results", title: "Exam results", journey: "Hear a student's latest published result", languages: ["ta", "en"], backedBy: "lib/results", keypad: ["1 Latest result", "2 By subject", "9 Repeat"] },
  { id: "ivr_grievance", title: "Lodge a grievance", journey: "Record a spoken grievance and get a ticket number", languages: ["ta", "en", "te", "ur", "kn"], backedBy: "lib/grievance", keypad: ["1 New grievance", "2 Track status", "0 Speak to officer"] },
]

export function channelById(id: string): Channel | undefined {
  return CHANNELS.find((c) => c.id === id)
}

export function flowById(id: string): IvrFlow | undefined {
  return IVR_FLOWS.find((f) => f.id === id)
}

export function byModality(modality: Modality): Channel[] {
  return CHANNELS.filter((c) => c.modality === modality)
}

/** IVR language codes that don't resolve in the language catalogue (should be none). */
export function unknownLanguages(): string[] {
  const bad = new Set<string>()
  for (const f of IVR_FLOWS) for (const code of f.languages) if (!languageByCode(code)) bad.add(code)
  return [...bad]
}

/** Distinct languages offered across all IVR flows. */
export function ivrLanguages(): string[] {
  return [...new Set(IVR_FLOWS.flatMap((f) => f.languages))].sort()
}

export interface ChannelSummary {
  channels: number
  voiceChannels: number
  noLiteracyChannels: number
  offlineChannels: number
  ivrFlows: number
  ivrLanguages: number
}

export function channelSummary(): ChannelSummary {
  return {
    channels: CHANNELS.length,
    voiceChannels: CHANNELS.filter((c) => c.modality === "voice").length,
    noLiteracyChannels: CHANNELS.filter((c) => !c.literacyRequired).length,
    offlineChannels: CHANNELS.filter((c) => c.offlineCapable).length,
    ivrFlows: IVR_FLOWS.length,
    ivrLanguages: ivrLanguages().length,
  }
}


export function toCSV(items: Channel[] = CHANNELS): string {
  const header = ["Channel", "Modality", "Literacy required", "Offline-capable", "Audience"]
  const rows = items.map((c) =>
    [c.name, c.modality, c.literacyRequired ? "yes" : "no", c.offlineCapable ? "yes" : "no", c.audience].map(csvField).join(","),
  )
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
