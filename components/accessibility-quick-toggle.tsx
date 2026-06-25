"use client"

import Link from "next/link"
import { Accessibility } from "lucide-react"
import { useAccessibility } from "@/components/accessibility-provider"
import type { TextScale } from "@/lib/accessibility"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export function AccessibilityQuickToggle() {
  const { prefs, setPref, reset } = useAccessibility()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Accessibility options" className="h-10 w-10 rounded-full">
          <Accessibility className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 space-y-4">
        <p className="text-sm font-medium">Accessibility</p>
        <div className="flex items-center justify-between">
          <Label htmlFor="qt-hc" className="text-sm">High contrast</Label>
          <Checkbox id="qt-hc" checked={prefs.highContrast} onCheckedChange={(v) => setPref("highContrast", v === true)} />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="qt-rm" className="text-sm">Reduce motion</Label>
          <Checkbox id="qt-rm" checked={prefs.reduceMotion} onCheckedChange={(v) => setPref("reduceMotion", v === true)} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="qt-ts" className="text-sm">Text size</Label>
          <select
            id="qt-ts"
            value={prefs.textScale}
            onChange={(e) => setPref("textScale", e.target.value as TextScale)}
            className="h-8 rounded-md border bg-background px-2 text-sm"
          >
            <option value="normal">Normal</option>
            <option value="large">Large</option>
            <option value="xlarge">Extra large</option>
          </select>
        </div>
        <div className="flex items-center justify-between pt-1">
          <Link href="/accessibility" className="text-xs text-muted-foreground underline underline-offset-4">
            More options
          </Link>
          <Button variant="outline" size="sm" onClick={reset}>
            Reset
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
