"use client"

import type React from "react"
import { useEffect, useState } from "react"
import i18next, { type i18n as I18nInstance } from "i18next"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { resources, I18N_STORAGE_KEY } from "@/lib/i18n/resources"
import { DEFAULT_LOCALE } from "@/lib/i18n"

let instance: I18nInstance | null = null

function getInstance(): I18nInstance {
  if (!instance) {
    const i = i18next.createInstance()
    i.use(initReactI18next).init({
      resources,
      lng: DEFAULT_LOCALE,
      fallbackLng: "en",
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    })
    instance = i
  }
  return instance
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [i18n] = useState(getInstance)

  useEffect(() => {
    const saved = window.localStorage.getItem(I18N_STORAGE_KEY)
    if (saved && saved !== i18n.language) {
      void i18n.changeLanguage(saved)
    }
  }, [i18n])

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
