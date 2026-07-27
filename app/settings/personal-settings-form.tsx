"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { useAccessibility } from "@/components/accessibility-provider"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { DEFAULT_A11Y, type AccessibilityPreferences, type TextScale } from "@/lib/accessibility"
import { LOCALES, type Locale } from "@/lib/i18n"
import { I18N_STORAGE_KEY } from "@/lib/i18n/resources"
import {
  DEFAULT_PERSONAL_PREFERENCES,
  PERSONAL_PREFERENCES_STORAGE_KEY,
  parsePersonalPreferences,
  type DateFormat,
  type NotificationChannel,
  type NotificationDigest,
  type PersonalPreferences,
  type SupportedTimeZone,
} from "@/lib/preferences/personal"

const selectClass = "h-10 w-full rounded-md border bg-background px-3 text-sm sm:w-56"

export function PersonalSettingsForm() {
  const { prefs, setPref, reset: resetAccessibility } = useAccessibility()
  const { i18n } = useTranslation()
  const { toast } = useToast()
  const [personal, setPersonal] = useState<PersonalPreferences>(DEFAULT_PERSONAL_PREFERENCES)
  const [accessibility, setAccessibility] = useState<AccessibilityPreferences>(prefs)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const stored = parsePersonalPreferences(window.localStorage.getItem(PERSONAL_PREFERENCES_STORAGE_KEY))
    setPersonal({ ...stored, locale: (i18n.language || stored.locale) as Locale })
    setAccessibility(prefs)
    setLoaded(true)
  }, [i18n.language, prefs])

  function updatePersonal<K extends keyof PersonalPreferences>(key: K, value: PersonalPreferences[K]) {
    setPersonal((current) => ({ ...current, [key]: value }))
  }

  function updateAccessibility<K extends keyof AccessibilityPreferences>(key: K, value: AccessibilityPreferences[K]) {
    setAccessibility((current) => ({ ...current, [key]: value }))
  }

  function save() {
    window.localStorage.setItem(PERSONAL_PREFERENCES_STORAGE_KEY, JSON.stringify(personal))
    window.localStorage.setItem(I18N_STORAGE_KEY, personal.locale)
    void i18n.changeLanguage(personal.locale)
    for (const [key, value] of Object.entries(accessibility) as [keyof AccessibilityPreferences, AccessibilityPreferences[keyof AccessibilityPreferences]][]) {
      setPref(key, value)
    }
    toast({ title: "Preferences saved", description: "Your language, accessibility, notification, and regional preferences now apply on this device." })
  }

  function reset() {
    const personalDefaults = { ...DEFAULT_PERSONAL_PREFERENCES }
    setPersonal(personalDefaults)
    setAccessibility({ ...DEFAULT_A11Y })
    window.localStorage.setItem(PERSONAL_PREFERENCES_STORAGE_KEY, JSON.stringify(personalDefaults))
    window.localStorage.setItem(I18N_STORAGE_KEY, personalDefaults.locale)
    void i18n.changeLanguage(personalDefaults.locale)
    resetAccessibility()
    toast({ title: "Preferences reset", description: "Tamil Nadu platform defaults have been restored." })
  }

  if (!loaded) return <p className="text-sm text-muted-foreground" aria-live="polite">Loading saved preferences…</p>

  return (
    <form className="space-y-6" onSubmit={(event) => { event.preventDefault(); save() }}>
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold">Language and region</legend>
        <SettingRow label="Interface language" hint="Tamil is the Tamil Nadu deployment default.">
          <select id="settings-locale" aria-label="Interface language" value={personal.locale} onChange={(event) => updatePersonal("locale", event.target.value as Locale)} className={selectClass}>
            {LOCALES.map((locale) => <option key={locale.code} value={locale.code}>{locale.nativeLabel}</option>)}
          </select>
        </SettingRow>
        <SettingRow label="Time zone" hint="Dates and deadlines are shown using this time zone.">
          <select id="settings-time-zone" aria-label="Time zone" value={personal.timeZone} onChange={(event) => updatePersonal("timeZone", event.target.value as SupportedTimeZone)} className={selectClass}>
            <option value="Asia/Kolkata">India Standard Time (IST)</option>
            <option value="UTC">UTC</option>
          </select>
        </SettingRow>
        <SettingRow label="Date format" hint="Controls how dates are presented on this device.">
          <select id="settings-date-format" aria-label="Date format" value={personal.dateFormat} onChange={(event) => updatePersonal("dateFormat", event.target.value as DateFormat)} className={selectClass}>
            <option value="DD-MM-YYYY">DD-MM-YYYY</option><option value="DD/MM/YYYY">DD/MM/YYYY</option><option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </SettingRow>
      </fieldset>

      <fieldset className="space-y-4 border-t pt-5">
        <legend className="text-sm font-semibold">Accessibility</legend>
        <ToggleRow id="settings-contrast" label="High contrast" checked={accessibility.highContrast} onChange={(value) => updateAccessibility("highContrast", value)} />
        <ToggleRow id="settings-motion" label="Reduce motion" checked={accessibility.reduceMotion} onChange={(value) => updateAccessibility("reduceMotion", value)} />
        <ToggleRow id="settings-voice" label="Voice-first assistance" checked={accessibility.voiceFirst} onChange={(value) => updateAccessibility("voiceFirst", value)} />
        <SettingRow label="Text size" hint="Supports reflow-friendly enlargement across portals.">
          <select id="settings-text-scale" aria-label="Text size" value={accessibility.textScale} onChange={(event) => updateAccessibility("textScale", event.target.value as TextScale)} className={selectClass}>
            <option value="normal">Normal</option><option value="large">Large</option><option value="xlarge">Extra large</option>
          </select>
        </SettingRow>
      </fieldset>

      <fieldset className="space-y-4 border-t pt-5">
        <legend className="text-sm font-semibold">Notifications</legend>
        <SettingRow label="Preferred channel" hint="No contact details are stored in these device preferences.">
          <select id="settings-channel" aria-label="Preferred notification channel" value={personal.notificationChannel} onChange={(event) => updatePersonal("notificationChannel", event.target.value as NotificationChannel)} className={selectClass}>
            <option value="in-app">In-app</option><option value="email">Email</option><option value="sms">SMS</option><option value="none">None</option>
          </select>
        </SettingRow>
        <SettingRow label="Frequency" hint="Emergency and statutory notices may bypass digest timing.">
          <select id="settings-digest" aria-label="Notification frequency" value={personal.notificationDigest} onChange={(event) => updatePersonal("notificationDigest", event.target.value as NotificationDigest)} className={selectClass} disabled={personal.notificationChannel === "none"}>
            <option value="immediate">Immediate</option><option value="daily">Daily digest</option><option value="weekly">Weekly digest</option>
          </select>
        </SettingRow>
      </fieldset>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
        <p className="max-w-xl text-xs text-muted-foreground">Preferences are stored only in this browser. They contain no student records, contact details, credentials, or administrative configuration.</p>
        <div className="flex gap-2"><Button type="button" variant="outline" onClick={reset}>Reset defaults</Button><Button type="submit">Save preferences</Button></div>
      </div>
    </form>
  )
}

function SettingRow({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return <div className="flex flex-col justify-between gap-3 rounded-lg border p-4 sm:flex-row sm:items-center"><div><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{hint}</p></div>{children}</div>
}

function ToggleRow({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <div className="flex items-center justify-between rounded-lg border p-4"><Label htmlFor={id}>{label}</Label><Checkbox id={id} checked={checked} onCheckedChange={(value) => onChange(value === true)} /></div>
}
