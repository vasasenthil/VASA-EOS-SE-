// VASA-EOS(SE) — react-i18next resource catalogues. Tamil-FIRST (the TN deployment language),
// English the link language, Hindi the national link. The four neighbouring scheduled languages
// (Telugu / Malayalam / Kannada / Urdu) carry the core navigation + common UI set; their remaining
// keys fall back to English. Coverage is reported honestly by lib/i18n/translate.ts (and surfaced at
// /accessibility/languages) so no locale is advertised as complete when it is not. The English
// catalogue is the REFERENCE key set every other locale is measured against.
//
// Keys are flat (dotted) strings; i18next resolves them via ignoreJSONStructure. Add keys to `en`
// first (it defines the committed set), then localise.

import type { Locale } from "./index"

// ── Type-safe code-first keys ──────────────────────────────────────────────────────────────────
// MESSAGE_KEYS is the committed UI string set; MessageKey is its literal union. English is typed as
// COMPLETE (Record<MessageKey,string>) so a missing key is a COMPILE error; every other locale is
// Partial<Record<MessageKey,string>> so a typo or orphan key (one not in MESSAGE_KEYS) is rejected by
// the compiler, while honestly-missing keys are allowed and reported by lib/i18n/translate.ts.
export const MESSAGE_KEYS = [
  "app.title", "app.tagline",
  "nav.dashboard", "nav.attendance", "nav.fees", "nav.schemes", "nav.students", "nav.staff",
  "nav.timetable", "nav.governance", "nav.accessibility", "nav.federation",
  "nav.announcements", "nav.communications", "nav.auditLog", "nav.compliance", "nav.certificates",
  "nav.library", "nav.aiAgents", "nav.assessments", "nav.admissions", "nav.academicCalendar",
  "action.save", "action.cancel", "action.search", "action.edit", "action.delete", "action.view",
  "action.new", "action.back", "action.export",
  "welcome", "language", "status", "loading", "noData", "signIn", "signOut",
  "demo.heading",
] as const

export type MessageKey = (typeof MESSAGE_KEYS)[number]

/** A locale catalogue may localise any subset of the committed keys; missing keys fall back to English. */
type Catalogue = { translation: Partial<Record<MessageKey, string>> }
/** The English reference MUST localise every committed key (enforced at compile time). */
type ReferenceCatalogue = { translation: Record<MessageKey, string> }

export const resources: Record<Locale, Catalogue> & { en: ReferenceCatalogue } = {
  // ── English — the reference key set (every other locale is measured against these keys) ──
  en: {
    translation: {
      "app.title": "VASA-EOS (School Education)",
      "app.tagline": "AI-native Education Operating System",
      "nav.dashboard": "Dashboard",
      "nav.attendance": "Attendance",
      "nav.fees": "Fees",
      "nav.schemes": "Schemes",
      "nav.students": "Students",
      "nav.staff": "Staff",
      "nav.timetable": "Timetable",
      "nav.governance": "Governance",
      "nav.accessibility": "Accessibility",
      "nav.federation": "Federation",
      "nav.announcements": "Announcements",
      "nav.communications": "Communications",
      "nav.auditLog": "Audit Log",
      "nav.compliance": "Compliance",
      "nav.certificates": "Certificates",
      "nav.library": "Library",
      "nav.aiAgents": "AI Agents",
      "nav.assessments": "Assessment & Exams",
      "nav.admissions": "Admissions & Enrolment",
      "nav.academicCalendar": "Academic Calendar",
      "action.save": "Save",
      "action.cancel": "Cancel",
      "action.search": "Search",
      "action.edit": "Edit",
      "action.delete": "Delete",
      "action.view": "View",
      "action.new": "New",
      "action.back": "Back",
      "action.export": "Export",
      welcome: "Welcome",
      language: "Language",
      status: "Status",
      loading: "Loading…",
      noData: "No data",
      signIn: "Sign in",
      signOut: "Sign out",
      "demo.heading": "Switch the language and watch the UI strings change in real time",
    },
  },
  // ── Tamil — primary, FULL coverage ──
  ta: {
    translation: {
      "app.title": "வாசா-EOS (பள்ளிக் கல்வி)",
      "app.tagline": "AI-நேட்டிவ் கல்வி இயக்க அமைப்பு",
      "nav.dashboard": "டாஷ்போர்டு",
      "nav.attendance": "வருகை",
      "nav.fees": "கட்டணம்",
      "nav.schemes": "திட்டங்கள்",
      "nav.students": "மாணவர்கள்",
      "nav.staff": "பணியாளர்கள்",
      "nav.timetable": "கால அட்டவணை",
      "nav.governance": "ஆளுகை",
      "nav.accessibility": "அணுகல்தன்மை",
      "nav.federation": "கூட்டமைப்பு",
      "nav.announcements": "அறிவிப்புகள்",
      "nav.communications": "தொடர்புகள்",
      "nav.auditLog": "தணிக்கைப் பதிவு",
      "nav.compliance": "இணக்கம்",
      "nav.certificates": "சான்றிதழ்கள்",
      "nav.library": "நூலகம்",
      "nav.aiAgents": "AI முகவர்கள்",
      "nav.assessments": "மதிப்பீடு & தேர்வுகள்",
      "nav.admissions": "சேர்க்கை & பதிவு",
      "nav.academicCalendar": "கல்வி நாட்காட்டி",
      "action.save": "சேமி",
      "action.cancel": "ரத்து",
      "action.search": "தேடு",
      "action.edit": "திருத்து",
      "action.delete": "நீக்கு",
      "action.view": "பார்",
      "action.new": "புதியது",
      "action.back": "பின்செல்",
      "action.export": "ஏற்றுமதி",
      welcome: "வரவேற்கிறோம்",
      language: "மொழி",
      status: "நிலை",
      loading: "ஏற்றுகிறது…",
      noData: "தரவு இல்லை",
      signIn: "உள்நுழை",
      signOut: "வெளியேறு",
      "demo.heading": "மொழியை மாற்றி UI சரங்கள் நிகழ்நேரத்தில் மாறுவதைக் காணுங்கள்",
    },
  },
  // ── Hindi — national link, FULL coverage ──
  hi: {
    translation: {
      "app.title": "वासा-EOS (स्कूल शिक्षा)",
      "app.tagline": "एआई-नेटिव शिक्षा संचालन प्रणाली",
      "nav.dashboard": "डैशबोर्ड",
      "nav.attendance": "उपस्थिति",
      "nav.fees": "शुल्क",
      "nav.schemes": "योजनाएँ",
      "nav.students": "विद्यार्थी",
      "nav.staff": "कर्मचारी",
      "nav.timetable": "समय-सारणी",
      "nav.governance": "शासन",
      "nav.accessibility": "सुगम्यता",
      "nav.federation": "संघटन",
      "nav.announcements": "घोषणाएँ",
      "nav.communications": "संचार",
      "nav.auditLog": "ऑडिट लॉग",
      "nav.compliance": "अनुपालन",
      "nav.certificates": "प्रमाणपत्र",
      "nav.library": "पुस्तकालय",
      "nav.aiAgents": "एआई एजेंट",
      "nav.assessments": "मूल्यांकन और परीक्षा",
      "nav.admissions": "प्रवेश और नामांकन",
      "nav.academicCalendar": "शैक्षणिक कैलेंडर",
      "action.save": "सहेजें",
      "action.cancel": "रद्द करें",
      "action.search": "खोजें",
      "action.edit": "संपादित करें",
      "action.delete": "हटाएँ",
      "action.view": "देखें",
      "action.new": "नया",
      "action.back": "वापस",
      "action.export": "निर्यात",
      welcome: "स्वागत है",
      language: "भाषा",
      status: "स्थिति",
      loading: "लोड हो रहा है…",
      noData: "कोई डेटा नहीं",
      signIn: "साइन इन",
      signOut: "साइन आउट",
      "demo.heading": "भाषा बदलें और UI स्ट्रिंग्स को वास्तविक समय में बदलते देखें",
    },
  },
  // ── Telugu — neighbour, core set (remaining keys fall back to English) ──
  te: {
    translation: {
      "nav.dashboard": "డాష్‌బోర్డ్",
      "nav.attendance": "హాజరు",
      "nav.fees": "ఫీజులు",
      "nav.schemes": "పథకాలు",
      "nav.students": "విద్యార్థులు",
      "nav.staff": "సిబ్బంది",
      "nav.timetable": "సమయ పట్టిక",
      "nav.governance": "పాలన",
      "action.save": "సేవ్ చేయి",
      "action.cancel": "రద్దు చేయి",
      "action.search": "వెతుకు",
      welcome: "స్వాగతం",
      language: "భాష",
      status: "స్థితి",
    },
  },
  // ── Malayalam — neighbour, core set ──
  ml: {
    translation: {
      "nav.dashboard": "ഡാഷ്‌ബോർഡ്",
      "nav.attendance": "ഹാജർ",
      "nav.fees": "ഫീസ്",
      "nav.schemes": "പദ്ധതികൾ",
      "nav.students": "വിദ്യാർത്ഥികൾ",
      "nav.staff": "ജീവനക്കാർ",
      "nav.timetable": "സമയക്രമം",
      "nav.governance": "ഭരണം",
      "action.save": "സംരക്ഷിക്കുക",
      "action.cancel": "റദ്ദാക്കുക",
      "action.search": "തിരയുക",
      welcome: "സ്വാഗതം",
      language: "ഭാഷ",
      status: "നില",
    },
  },
  // ── Kannada — neighbour, core set ──
  kn: {
    translation: {
      "nav.dashboard": "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
      "nav.attendance": "ಹಾಜರಾತಿ",
      "nav.fees": "ಶುಲ್ಕ",
      "nav.schemes": "ಯೋಜನೆಗಳು",
      "nav.students": "ವಿದ್ಯಾರ್ಥಿಗಳು",
      "nav.staff": "ಸಿಬ್ಬಂದಿ",
      "nav.timetable": "ವೇಳಾಪಟ್ಟಿ",
      "nav.governance": "ಆಡಳಿತ",
      "action.save": "ಉಳಿಸಿ",
      "action.cancel": "ರದ್ದುಮಾಡಿ",
      "action.search": "ಹುಡುಕಿ",
      welcome: "ಸ್ವಾಗತ",
      language: "ಭಾಷೆ",
      status: "ಸ್ಥಿತಿ",
    },
  },
  // ── Urdu — neighbour, core set (RTL) ──
  ur: {
    translation: {
      "nav.dashboard": "ڈیش بورڈ",
      "nav.attendance": "حاضری",
      "nav.fees": "فیس",
      "nav.schemes": "اسکیمیں",
      "nav.students": "طلبہ",
      "nav.staff": "عملہ",
      "nav.timetable": "نظام الاوقات",
      "nav.governance": "نظم و نسق",
      "action.save": "محفوظ کریں",
      "action.cancel": "منسوخ کریں",
      "action.search": "تلاش کریں",
      welcome: "خوش آمدید",
      language: "زبان",
      status: "حیثیت",
    },
  },
}

export const I18N_STORAGE_KEY = "vasa-eos-lang"
