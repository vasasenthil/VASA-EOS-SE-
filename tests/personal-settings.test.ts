import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { DEFAULT_PERSONAL_PREFERENCES, normalizePersonalPreferences, parsePersonalPreferences } from "@/lib/preferences/personal"

test("personal preferences default to Tamil Nadu-safe regional settings", () => {
  assert.deepEqual(parsePersonalPreferences(null), DEFAULT_PERSONAL_PREFERENCES)
  assert.equal(DEFAULT_PERSONAL_PREFERENCES.locale, "ta")
  assert.equal(DEFAULT_PERSONAL_PREFERENCES.timeZone, "Asia/Kolkata")
  assert.equal(DEFAULT_PERSONAL_PREFERENCES.notificationChannel, "in-app")
})

test("personal preferences preserve supported values and reject arbitrary storage input", () => {
  const valid = normalizePersonalPreferences({ locale: "en", notificationChannel: "sms", notificationDigest: "weekly", timeZone: "UTC", dateFormat: "YYYY-MM-DD" })
  assert.deepEqual(valid, { locale: "en", notificationChannel: "sms", notificationDigest: "weekly", timeZone: "UTC", dateFormat: "YYYY-MM-DD" })
  assert.deepEqual(normalizePersonalPreferences({ locale: "xx", notificationChannel: "webhook", timeZone: "Europe/London" }), DEFAULT_PERSONAL_PREFERENCES)
  assert.deepEqual(parsePersonalPreferences("not-json"), DEFAULT_PERSONAL_PREFERENCES)
})

test("settings button routes to a real personal settings form without placeholder behaviour", () => {
  const button = readFileSync(join(process.cwd(), "components/settings-button.tsx"), "utf8")
  const page = readFileSync(join(process.cwd(), "app/settings/page.tsx"), "utf8")
  const form = readFileSync(join(process.cwd(), "app/settings/personal-settings-form.tsx"), "utf8")
  assert.match(button, /href="\/settings"/)
  assert.doesNotMatch(button, /TODO|console\.log|Placeholder component/)
  assert.match(page, /PersonalSettingsForm/)
  assert.match(form, /Save preferences/)
  assert.match(form, /contain no student records/)
})
