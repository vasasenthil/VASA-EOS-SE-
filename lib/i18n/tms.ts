// VASA-EOS(SE) — Git-native TMS bridge (pure, no cloud SaaS).
//
// Modern i18n pairs type-safe code-first messages with a Translation Management System that
// round-trips through Git. For a SOVEREIGN, data-residency platform we keep that round-trip
// state-controlled: this module exports the committed catalogue to the standard flat-JSON shape a
// self-hostable TMS (Weblate / Inlang) watches, and validates a TMS-edited catalogue before it is
// merged back — rejecting orphan keys, reporting honest gaps. No string ever leaves the repo.
//
// English is the source template (complete by compile-time contract); every target locale is scored
// and gated against the typed MESSAGE_KEYS. Serialization is deterministic (sorted keys) so TMS
// commits produce minimal, reviewable Git diffs.

import { resources, MESSAGE_KEYS, type MessageKey } from "./resources"
import { LOCALES, type Locale } from "./index"

/** A locale's catalogue as a TMS consumes it: present keys only, sorted, plus the honest gap list. */
export interface LocaleCatalogue {
  locale: Locale
  label: string
  /** True when every committed key is localised (English, and any fully-translated target). */
  complete: boolean
  /** Localised messages (present keys only), key-sorted for deterministic diffs. */
  messages: Record<string, string>
  /** Committed keys not yet localised — what a translator still has to do. */
  missing: MessageKey[]
}

function sortedKeys(): MessageKey[] {
  return [...MESSAGE_KEYS].sort()
}

export function exportLocale(locale: Locale): LocaleCatalogue {
  const def = LOCALES.find((l) => l.code === locale)
  const cat = resources[locale]?.translation ?? {}
  const messages: Record<string, string> = {}
  const missing: MessageKey[] = []
  for (const k of sortedKeys()) {
    const v = cat[k]
    if (v !== undefined) messages[k] = v
    else missing.push(k)
  }
  return { locale, label: def?.label ?? locale, complete: missing.length === 0, messages, missing }
}

export function exportCatalogue(): LocaleCatalogue[] {
  return LOCALES.map((l) => exportLocale(l.code))
}

/** Deterministic JSON bundle (sorted locales, sorted keys) — the TMS-watchable artefact. */
export function serializeBundle(): string {
  const bundle: Record<string, Record<string, string>> = {}
  for (const l of [...LOCALES].sort((a, b) => a.code.localeCompare(b.code))) {
    bundle[l.code] = exportLocale(l.code).messages
  }
  return JSON.stringify(bundle, null, 2)
}

export interface ImportValidation {
  locale: string
  /** Keys in the incoming file that are NOT committed source keys — typos / removed-from-source. */
  orphanKeys: string[]
  /** Committed keys absent or blank in the incoming file (allowed: partial coverage). */
  missingKeys: MessageKey[]
  /** Committed keys present with a non-empty value. */
  filledKeys: MessageKey[]
  coveragePct: number
  /** A clean import has no orphan keys (missing keys are permitted — locales may be partial). */
  ok: boolean
}

/**
 * Validate a TMS-edited catalogue before merge: orphan keys are errors (they would silently rot or
 * break type-safety); missing keys are reported, not rejected (a target locale may be partial).
 */
export function validateCatalogue(locale: string, incoming: Record<string, string>): ImportValidation {
  const committed = new Set<string>(MESSAGE_KEYS)
  const orphanKeys = Object.keys(incoming).filter((k) => !committed.has(k)).sort()
  const filledKeys = (MESSAGE_KEYS as readonly MessageKey[]).filter((k) => (incoming[k] ?? "").trim() !== "")
  const missingKeys = (MESSAGE_KEYS as readonly MessageKey[]).filter((k) => (incoming[k] ?? "").trim() === "")
  const total: number = MESSAGE_KEYS.length
  const coveragePct = total === 0 ? 0 : Math.round((filledKeys.length / total) * 100)
  return { locale, orphanKeys, missingKeys, filledKeys, coveragePct, ok: orphanKeys.length === 0 }
}
