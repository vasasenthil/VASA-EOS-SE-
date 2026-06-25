// VASA-EOS(SE) — multilingual language catalogue (Accessibility breadth).
//
// The platform commits to 22-language multilingual access. This enumerates the 22
// languages of the Eighth Schedule of the Constitution of India — the constitutional
// basis for that commitment — each with its ISO code, English and native name, script,
// and role in the Tamil-Nadu-first deployment. Beyond the 22, it records English (the
// link language) and the State's tribal / minority mother tongues, so inclusion is
// honest about reach. Translation/ASR/TTS at runtime flows through the Bhashini port
// (lib/integrations/live/bhashini); this is the registry that drives language choice,
// content localisation targets and the accessibility audit. Pure + client-safe.

import { csvField } from "@/lib/csv"

export type TnRole = "primary" | "neighbour" | "link" | "national" | "tribal-minority"

export interface LanguageDef {
  /** ISO 639-1 where one exists, else ISO 639-3. */
  code: string
  name: string
  nativeName: string
  script: string
  /** Listed in the Eighth Schedule of the Constitution of India. */
  scheduled: boolean
  /** Role in the Tamil Nadu deployment. */
  tnRole: TnRole
}

// The 22 scheduled languages — the constitutional "22-language" commitment.
export const SCHEDULED_LANGUAGES: LanguageDef[] = [
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", script: "Tamil", scheduled: true, tnRole: "primary" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", script: "Telugu", scheduled: true, tnRole: "neighbour" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", script: "Kannada", scheduled: true, tnRole: "neighbour" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", script: "Malayalam", scheduled: true, tnRole: "neighbour" },
  { code: "ur", name: "Urdu", nativeName: "اردو", script: "Perso-Arabic", scheduled: true, tnRole: "neighbour" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", script: "Devanagari", scheduled: true, tnRole: "national" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া", script: "Bengali-Assamese", scheduled: true, tnRole: "national" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", script: "Bengali-Assamese", scheduled: true, tnRole: "national" },
  { code: "brx", name: "Bodo", nativeName: "बड़ो", script: "Devanagari", scheduled: true, tnRole: "national" },
  { code: "doi", name: "Dogri", nativeName: "डोगरी", script: "Devanagari", scheduled: true, tnRole: "national" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", script: "Gujarati", scheduled: true, tnRole: "national" },
  { code: "ks", name: "Kashmiri", nativeName: "کٲشُر", script: "Perso-Arabic", scheduled: true, tnRole: "national" },
  { code: "kok", name: "Konkani", nativeName: "कोंकणी", script: "Devanagari", scheduled: true, tnRole: "national" },
  { code: "mai", name: "Maithili", nativeName: "मैथिली", script: "Devanagari", scheduled: true, tnRole: "national" },
  { code: "mni", name: "Manipuri (Meitei)", nativeName: "ꯃꯩꯇꯩ ꯂꯣꯟ", script: "Meitei Mayek", scheduled: true, tnRole: "national" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", script: "Devanagari", scheduled: true, tnRole: "national" },
  { code: "ne", name: "Nepali", nativeName: "नेपाली", script: "Devanagari", scheduled: true, tnRole: "national" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ", script: "Odia", scheduled: true, tnRole: "national" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", script: "Gurmukhi", scheduled: true, tnRole: "national" },
  { code: "sa", name: "Sanskrit", nativeName: "संस्कृतम्", script: "Devanagari", scheduled: true, tnRole: "national" },
  { code: "sat", name: "Santali", nativeName: "ᱥᱟᱱᱛᱟᱲᱤ", script: "Ol Chiki", scheduled: true, tnRole: "national" },
  { code: "sd", name: "Sindhi", nativeName: "سنڌي", script: "Perso-Arabic", scheduled: true, tnRole: "national" },
]

// Beyond the 22: the link language and Tamil Nadu's tribal / minority mother tongues.
export const ADDITIONAL_LANGUAGES: LanguageDef[] = [
  { code: "en", name: "English", nativeName: "English", script: "Latin", scheduled: false, tnRole: "link" },
  { code: "saz", name: "Saurashtra", nativeName: "ꢱꣃꢬꢵꢰ꣄ꢜ꣄ꢬ", script: "Saurashtra", scheduled: false, tnRole: "tribal-minority" },
  { code: "bfq", name: "Badaga", nativeName: "படகா", script: "Tamil", scheduled: false, tnRole: "tribal-minority" },
  { code: "iru", name: "Irula", nativeName: "இருளா", script: "Tamil", scheduled: false, tnRole: "tribal-minority" },
  { code: "tcx", name: "Toda", nativeName: "தோடா", script: "Tamil", scheduled: false, tnRole: "tribal-minority" },
  { code: "kfe", name: "Kota", nativeName: "கோத்தா", script: "Tamil", scheduled: false, tnRole: "tribal-minority" },
  { code: "kfi", name: "Kurumba", nativeName: "குறும்பா", script: "Tamil", scheduled: false, tnRole: "tribal-minority" },
]

/** The full catalogue: 22 scheduled languages plus the link & tribal/minority tongues. */
export const LANGUAGE_CATALOGUE: LanguageDef[] = [...SCHEDULED_LANGUAGES, ...ADDITIONAL_LANGUAGES]

export function languageByCode(code: string): LanguageDef | undefined {
  return LANGUAGE_CATALOGUE.find((l) => l.code === code)
}

export function byTnRole(role: TnRole): LanguageDef[] {
  return LANGUAGE_CATALOGUE.filter((l) => l.tnRole === role)
}

/** Distinct scripts the platform must render (font / shaping coverage planning). */
export function scripts(items: LanguageDef[] = LANGUAGE_CATALOGUE): string[] {
  return [...new Set(items.map((l) => l.script))].sort()
}

export interface LanguageSummary {
  total: number
  scheduled: number
  additional: number
  tribalMinority: number
  scripts: number
}

export function languageSummary(items: LanguageDef[] = LANGUAGE_CATALOGUE): LanguageSummary {
  return {
    total: items.length,
    scheduled: items.filter((l) => l.scheduled).length,
    additional: items.filter((l) => !l.scheduled).length,
    tribalMinority: items.filter((l) => l.tnRole === "tribal-minority").length,
    scripts: scripts(items).length,
  }
}


export function toCSV(items: LanguageDef[] = LANGUAGE_CATALOGUE): string {
  const header = ["Code", "Name", "Native name", "Script", "Eighth Schedule", "TN role"]
  const rows = items.map((l) =>
    [l.code, l.name, l.nativeName, l.script, l.scheduled ? "yes" : "no", l.tnRole].map(csvField).join(","),
  )
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
