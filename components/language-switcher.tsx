"use client"

import { useTranslation } from "react-i18next"
import { LOCALES } from "@/lib/i18n"
import { I18N_STORAGE_KEY } from "@/lib/i18n/resources"

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  function change(code: string) {
    void i18n.changeLanguage(code)
    window.localStorage.setItem(I18N_STORAGE_KEY, code)
  }

  return (
    <select
      aria-label="Language"
      value={i18n.language}
      onChange={(e) => change(e.target.value)}
      className="h-9 rounded-md border bg-background px-3 text-sm"
    >
      {LOCALES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.nativeLabel}
        </option>
      ))}
    </select>
  )
}
