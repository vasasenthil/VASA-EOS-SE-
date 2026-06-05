// VASA-EOS(SE) — multi-channel communications (Sec 48 / Communication Agent).
// Compose to an audience over a channel; pure validation + audience sizing. The UI
// queues messages; production routes via Bhashini/SMS/WhatsApp/IVR providers.

import { SIS_ROSTER } from "@/lib/sis"

export type Channel = "sms" | "whatsapp" | "ivr" | "app"

export const CHANNELS: { key: Channel; label: string }[] = [
  { key: "sms", label: "SMS" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "ivr", label: "IVR (voice)" },
  { key: "app", label: "App push" },
]

export type Audience = "all_parents" | "class" | "staff" | "single"

export const AUDIENCES: { key: Audience; label: string }[] = [
  { key: "all_parents", label: "All parents" },
  { key: "class", label: "One class" },
  { key: "staff", label: "All staff" },
  { key: "single", label: "Single recipient" },
]

const STAFF_COUNT = 12

export function audienceSize(audience: Audience): number {
  switch (audience) {
    case "all_parents":
      return SIS_ROSTER.length
    case "class": {
      const klass = SIS_ROSTER[0]?.className
      return SIS_ROSTER.filter((s) => s.className === klass).length
    }
    case "staff":
      return STAFF_COUNT
    case "single":
      return 1
  }
}

export const MAX_LEN = 320

/** null if valid, else an error message. */
export function validateMessage(body: string): string | null {
  const t = body.trim()
  if (t.length === 0) return "Message cannot be empty."
  if (t.length > MAX_LEN) return `Message is too long (${t.length}/${MAX_LEN}).`
  return null
}

export interface Message {
  id: string
  channel: Channel
  audience: Audience
  body: string
  recipients: number
  sentAt: string
}
