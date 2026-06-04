"use client"

import { useEffect, useState } from "react"
import {
  A11Y_STORAGE_KEY,
  DEFAULT_A11Y,
  type AccessibilityPreferences,
  type TextScale,
} from "@/lib/accessibility"
import { LOCALES } from "@/lib/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export function A11yPanel() {
  const [prefs, setPrefs] = useState<AccessibilityPreferences>(DEFAULT_A11Y)

  useEffect(() => {
    const raw = window.localStorage.getItem(A11Y_STORAGE_KEY)
    if (!raw) return
    try {
      setPrefs({ ...DEFAULT_A11Y, ...(JSON.parse(raw) as Partial<AccessibilityPreferences>) })
    } catch {
      setPrefs(DEFAULT_A11Y)
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("a11y-high-contrast", prefs.highContrast)
    root.classList.toggle("a11y-reduce-motion", prefs.reduceMotion)
    root.setAttribute("data-text-scale", prefs.textScale)
    window.localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(prefs))
  }, [prefs])

  function update<K extends keyof AccessibilityPreferences>(key: K, value: AccessibilityPreferences[K]) {
    setPrefs((p) => ({ ...p, [key]: value }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accessibility Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 max-w-md">
        <div className="flex items-center justify-between">
          <Label htmlFor="hc">High contrast</Label>
          <Checkbox id="hc" checked={prefs.highContrast} onCheckedChange={(v) => update("highContrast", v === true)} />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="rm">Reduce motion (sensory-friendly)</Label>
          <Checkbox id="rm" checked={prefs.reduceMotion} onCheckedChange={(v) => update("reduceMotion", v === true)} />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="vf">Voice-first (IVR / read-aloud)</Label>
          <Checkbox id="vf" checked={prefs.voiceFirst} onCheckedChange={(v) => update("voiceFirst", v === true)} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="ts">Text size</Label>
          <select
            id="ts"
            value={prefs.textScale}
            onChange={(e) => update("textScale", e.target.value as TextScale)}
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            <option value="normal">Normal</option>
            <option value="large">Large</option>
            <option value="xlarge">Extra large</option>
          </select>
        </div>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="loc">Language</Label>
          <select
            id="loc"
            value={prefs.locale}
            onChange={(e) => update("locale", e.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            {LOCALES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.nativeLabel}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-muted-foreground">Preferences apply instantly and persist on this device.</p>
      </CardContent>
    </Card>
  )
}
