"use client"

import { type TextScale } from "@/lib/accessibility"
import { useAccessibility } from "@/components/accessibility-provider"
import { LOCALES } from "@/lib/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export function A11yPanel() {
  const { prefs, setPref, reset } = useAccessibility()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accessibility Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 max-w-md">
        <div className="flex items-center justify-between">
          <Label htmlFor="hc">High contrast</Label>
          <Checkbox id="hc" checked={prefs.highContrast} onCheckedChange={(v) => setPref("highContrast", v === true)} />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="rm">Reduce motion (sensory-friendly)</Label>
          <Checkbox id="rm" checked={prefs.reduceMotion} onCheckedChange={(v) => setPref("reduceMotion", v === true)} />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="vf">Voice-first (IVR / read-aloud)</Label>
          <Checkbox id="vf" checked={prefs.voiceFirst} onCheckedChange={(v) => setPref("voiceFirst", v === true)} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="ts">Text size</Label>
          <select
            id="ts"
            value={prefs.textScale}
            onChange={(e) => setPref("textScale", e.target.value as TextScale)}
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
            onChange={(e) => setPref("locale", e.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            {LOCALES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.nativeLabel}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">Preferences apply across the platform and persist on this device.</p>
          <Button variant="outline" size="sm" onClick={reset}>
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
