// VASA-EOS(SE) — pure i18n helpers (no React): server-safe translation + honest coverage reporting.
//
// The same resource catalogues that feed react-i18next on the client are read here without any
// runtime, so translation works server-side and the coverage of every advertised locale can be
// measured and tested. English is the REFERENCE catalogue: CORE_KEYS is exactly its key set, and
// every other locale is scored against it. This keeps the "22-language" commitment honest — a locale
// in the switcher is reported at its true percentage, never assumed complete.

import { resources, MESSAGE_KEYS, I18N_STORAGE_KEY, type MessageKey } from "./resources"
import { LOCALES, DEFAULT_LOCALE, type Locale } from "./index"

export { I18N_STORAGE_KEY, MESSAGE_KEYS }
export type { MessageKey }

/** The committed UI string set — exactly the keys of the English reference catalogue (typed). */
export const CORE_KEYS: readonly MessageKey[] = MESSAGE_KEYS

/**
 * Translate a typed key for a locale, falling back to English, then to the key itself. Pure — the
 * same lookup react-i18next performs (flat dotted keys), usable on the server. The `key: MessageKey`
 * parameter makes a typo a COMPILE error, not a silent English fallback at runtime.
 */
export function translate(locale: Locale, key: MessageKey): string {
  const cat = resources[locale]?.translation
  const hit = cat?.[key]
  if (hit !== undefined) return hit
  return resources.en.translation[key] ?? key
}

/**
 * Code-first ergonomic translator: key first (type-checked, autocompleted), locale optional
 * (defaults to the Tamil-first DEFAULT_LOCALE). `t("nav.dashboard")` is typo-proof; `t("nav.foo")`
 * does not compile.
 */
export function t(key: MessageKey, locale: Locale = DEFAULT_LOCALE): string {
  return translate(locale, key)
}

export interface LocaleCoverage {
  locale: Locale
  /** Native label from the locale registry. */
  label: string
  nativeLabel: string
  covered: number
  total: number
  /** Whole-number percentage of CORE_KEYS present in this locale. */
  pct: number
  /** Keys still falling back to English. */
  missing: string[]
}

export function localeCoverage(locale: Locale): LocaleCoverage {
  const def = LOCALES.find((l) => l.code === locale)
  const cat = resources[locale]?.translation ?? {}
  const present = CORE_KEYS.filter((k) => k in cat)
  const missing = CORE_KEYS.filter((k) => !(k in cat))
  const total = CORE_KEYS.length
  const pct = total === 0 ? 0 : Math.round((present.length / total) * 100)
  return { locale, label: def?.label ?? locale, nativeLabel: def?.nativeLabel ?? locale, covered: present.length, total, pct, missing }
}

export interface CoverageReport {
  locales: LocaleCoverage[]
  /** Locales at 100% of the core set. */
  complete: number
  /** Locales with some, but not full, coverage. */
  partial: number
  total: number
  coreKeys: number
  /** Mean coverage across all advertised locales, whole %. */
  averagePct: number
}

export function coverageReport(): CoverageReport {
  const locales = LOCALES.map((l) => localeCoverage(l.code))
  const complete = locales.filter((l) => l.pct === 100).length
  const partial = locales.filter((l) => l.pct > 0 && l.pct < 100).length
  const averagePct = locales.length === 0 ? 0 : Math.round(locales.reduce((s, l) => s + l.pct, 0) / locales.length)
  return { locales, complete, partial, total: locales.length, coreKeys: CORE_KEYS.length, averagePct }
}

export { DEFAULT_LOCALE }
