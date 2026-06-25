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

// UI string catalogues live in lib/i18n/resources.ts and are served via
// react-i18next (see components/i18n-provider + useTranslation()).
