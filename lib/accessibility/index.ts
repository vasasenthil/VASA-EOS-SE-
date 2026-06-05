// VASA-EOS(SE) — accessibility model (WCAG 2.2 AAA + 21 RPwD categories, Sec 6B).
// The 14 deep-accessibility features the platform commits to, plus a user
// preferences shape applied across portals.

export interface DeepAccessibilityFeature {
  key: string
  label: string
  beneficiaries: string
}

export const DEEP_ACCESSIBILITY: DeepAccessibilityFeature[] = [
  { key: "braille", label: "Braille support (incl. Tamil Braille)", beneficiaries: "Blind & low-vision" },
  { key: "screen_readers", label: "Screen readers (NVDA/JAWS/TalkBack)", beneficiaries: "Visually impaired" },
  { key: "voice_command", label: "Voice command & dictation", beneficiaries: "Motor impairments" },
  { key: "switch_access", label: "Switch access (single/multi-switch, scan)", beneficiaries: "Severe motor disability" },
  { key: "eye_tracking", label: "Eye tracking / dwell-click", beneficiaries: "Locked-in / severe motor" },
  { key: "captions", label: "Closed captions (Tamil + English)", beneficiaries: "Deaf & hard of hearing" },
  { key: "isl", label: "Indian Sign Language (ISL) overlays", beneficiaries: "Deaf students/teachers" },
  { key: "aac", label: "AAC (symbol-based communication)", beneficiaries: "Non-verbal / autism" },
  { key: "cognitive", label: "Cognitive mode (simple language, reduced load)", beneficiaries: "Learning / intellectual disability" },
  { key: "contrast", label: "Colour & contrast (colour-blind-safe)", beneficiaries: "Colour blindness / low vision" },
  { key: "text_scaling", label: "Text scaling 200%+ with reflow", beneficiaries: "Low vision / reading difficulty" },
  { key: "keyboard", label: "Full keyboard navigation", beneficiaries: "Motor impairments / power users" },
  { key: "reading", label: "Reading assistance (TTS, dyslexia fonts)", beneficiaries: "Dyslexia" },
  { key: "sensory", label: "Sensory-friendly mode (reduced motion)", beneficiaries: "Autism / anxiety" },
]

export type TextScale = "normal" | "large" | "xlarge"

export interface AccessibilityPreferences {
  highContrast: boolean
  textScale: TextScale
  reduceMotion: boolean
  voiceFirst: boolean
  locale: string
}

export const DEFAULT_A11Y: AccessibilityPreferences = {
  highContrast: false,
  textScale: "normal",
  reduceMotion: false,
  voiceFirst: false,
  locale: "ta",
}

export const A11Y_STORAGE_KEY = "vasa-eos-a11y"

// All `<html>` classes this module manages — removed in full before re-applying.
export const A11Y_CLASSES = ["a11y-high-contrast", "a11y-reduce-motion"] as const

const TEXT_SCALES: TextScale[] = ["normal", "large", "xlarge"]

/** Coerce arbitrary parsed input into a complete, valid preference set. */
export function normalizePrefs(raw: unknown): AccessibilityPreferences {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_A11Y }
  const p = raw as Partial<AccessibilityPreferences>
  const textScale = TEXT_SCALES.includes(p.textScale as TextScale) ? (p.textScale as TextScale) : DEFAULT_A11Y.textScale
  return {
    highContrast: p.highContrast === true,
    textScale,
    reduceMotion: p.reduceMotion === true,
    voiceFirst: p.voiceFirst === true,
    locale: typeof p.locale === "string" && p.locale.length > 0 ? p.locale : DEFAULT_A11Y.locale,
  }
}

/** Parse a stored JSON string into preferences, falling back to defaults. */
export function parseStoredPrefs(raw: string | null): AccessibilityPreferences {
  if (!raw) return { ...DEFAULT_A11Y }
  try {
    return normalizePrefs(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_A11Y }
  }
}

/** The subset of A11Y_CLASSES that should be active for a preference set. */
export function a11yClassList(prefs: AccessibilityPreferences): string[] {
  const classes: string[] = []
  if (prefs.highContrast) classes.push("a11y-high-contrast")
  if (prefs.reduceMotion) classes.push("a11y-reduce-motion")
  return classes
}
