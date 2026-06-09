// react-i18next resource catalogs. Tamil-first; English fallback. Add languages/keys
// here as the UI is localised. (The default `translation` namespace.)

export const resources = {
  ta: {
    translation: {
      "app.title": "வாசா-EOS (பள்ளிக் கல்வி)",
      "nav.dashboard": "டாஷ்போர்டு",
      "nav.attendance": "வருகை",
      "nav.fees": "கட்டணம்",
      "nav.schemes": "திட்டங்கள்",
      welcome: "வரவேற்கிறோம்",
      language: "மொழி",
      "demo.heading": "மொழியை மாற்றி UI சரங்கள் நிகழ்நேரத்தில் மாறுவதைக் காணுங்கள்",
    },
  },
  en: {
    translation: {
      "app.title": "VASA-EOS (School Education)",
      "nav.dashboard": "Dashboard",
      "nav.attendance": "Attendance",
      "nav.fees": "Fees",
      "nav.schemes": "Schemes",
      welcome: "Welcome",
      language: "Language",
      "demo.heading": "Switch the language and watch the UI strings change in real time",
    },
  },
  hi: {
    translation: {
      "app.title": "वासा-EOS (स्कूल शिक्षा)",
      "nav.dashboard": "डैशबोर्ड",
      "nav.attendance": "उपस्थिति",
      "nav.fees": "शुल्क",
      "nav.schemes": "योजनाएँ",
      welcome: "स्वागत है",
      language: "भाषा",
      "demo.heading": "भाषा बदलें और UI स्ट्रिंग्स को वास्तविक समय में बदलते देखें",
    },
  },
} as const

export const I18N_STORAGE_KEY = "vasa-eos-lang"
