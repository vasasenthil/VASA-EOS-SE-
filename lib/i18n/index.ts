// VASA-EOS(SE) — lightweight i18n (Tamil-first for TN deployment).
// Real translation/ASR/TTS at scale runs through the Bhashini LanguageService port;
// this provides the in-app UI string layer + locale registry. Tamil is the default
// for TN; English and other Indian languages are switchable.

export type Locale = "ta" | "en" | "hi" | "te" | "ml" | "kn" | "ur"

export interface LocaleDef {
  code: Locale
  label: string
  nativeLabel: string
  /** Tamil dialects supported by IVR/ASR for this locale (TN context). */
  dialects?: string[]
}

export const LOCALES: LocaleDef[] = [
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்", dialects: ["Chennai", "Madurai", "Kongu", "Nellai", "Kanniyakumari", "Chettinad", "Jaffna", "Tribal"] },
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
  { code: "te", label: "Telugu", nativeLabel: "తెలుగు" },
  { code: "ml", label: "Malayalam", nativeLabel: "മലയാളം" },
  { code: "kn", label: "Kannada", nativeLabel: "ಕನ್ನಡ" },
  { code: "ur", label: "Urdu", nativeLabel: "اردو" },
]

export const DEFAULT_LOCALE: Locale = "ta"

type Dict = Record<string, string>

// UI strings — Tamil-first. (Subset; expands as modules land.)
const messages: Partial<Record<Locale, Dict>> = {
  ta: {
    "app.title": "வாசா-EOS (பள்ளிக் கல்வி)",
    "nav.dashboard": "டாஷ்போர்டு",
    "nav.attendance": "வருகை",
    "nav.fees": "கட்டணம்",
    "nav.schemes": "திட்டங்கள்",
    "welcome": "வரவேற்கிறோம்",
    "language": "மொழி",
  },
  en: {
    "app.title": "VASA-EOS (School Education)",
    "nav.dashboard": "Dashboard",
    "nav.attendance": "Attendance",
    "nav.fees": "Fees",
    "nav.schemes": "Schemes",
    "welcome": "Welcome",
    "language": "Language",
  },
}

/** Translate a UI key; falls back to English, then the key itself. */
export function t(locale: Locale, key: string): string {
  return messages[locale]?.[key] ?? messages.en?.[key] ?? key
}
