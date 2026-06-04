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
