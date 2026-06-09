"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import {
  A11Y_CLASSES,
  A11Y_STORAGE_KEY,
  DEFAULT_A11Y,
  a11yClassList,
  parseStoredPrefs,
  type AccessibilityPreferences,
} from "@/lib/accessibility"

interface AccessibilityContextValue {
  prefs: AccessibilityPreferences
  setPref: <K extends keyof AccessibilityPreferences>(key: K, value: AccessibilityPreferences[K]) => void
  reset: () => void
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null)

// Apply preferences to <html>. Idempotent with the no-FOUC boot script in the root
// layout, so the boot-applied classes are simply re-asserted after hydration.
function applyToDocument(prefs: AccessibilityPreferences) {
  const root = document.documentElement
  for (const c of A11Y_CLASSES) root.classList.remove(c)
  for (const c of a11yClassList(prefs)) root.classList.add(c)
  root.setAttribute("data-text-scale", prefs.textScale)
}

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  // Start from defaults (matches SSR), then hydrate from storage after mount so the
  // controlled inputs in the panel don't trigger a hydration mismatch.
  const [prefs, setPrefs] = useState<AccessibilityPreferences>(DEFAULT_A11Y)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setPrefs(parseStoredPrefs(window.localStorage.getItem(A11Y_STORAGE_KEY)))
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    applyToDocument(prefs)
    window.localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(prefs))
  }, [prefs, hydrated])

  const setPref = useCallback<AccessibilityContextValue["setPref"]>((key, value) => {
    setPrefs((p) => ({ ...p, [key]: value }))
  }, [])

  const reset = useCallback(() => setPrefs({ ...DEFAULT_A11Y }), [])

  return (
    <AccessibilityContext.Provider value={{ prefs, setPref, reset }}>{children}</AccessibilityContext.Provider>
  )
}

export function useAccessibility(): AccessibilityContextValue {
  const ctx = useContext(AccessibilityContext)
  if (!ctx) throw new Error("useAccessibility must be used within AccessibilityProvider")
  return ctx
}
