import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/i18n"

export type NotificationChannel = "in-app" | "email" | "sms" | "none"
export type NotificationDigest = "immediate" | "daily" | "weekly"
export type DateFormat = "DD-MM-YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD"
export type SupportedTimeZone = "Asia/Kolkata" | "UTC"

export interface PersonalPreferences {
  locale: Locale
  notificationChannel: NotificationChannel
  notificationDigest: NotificationDigest
  timeZone: SupportedTimeZone
  dateFormat: DateFormat
}

export const PERSONAL_PREFERENCES_STORAGE_KEY = "vasa-eos-personal-preferences"

export const DEFAULT_PERSONAL_PREFERENCES: PersonalPreferences = {
  locale: DEFAULT_LOCALE,
  notificationChannel: "in-app",
  notificationDigest: "daily",
  timeZone: "Asia/Kolkata",
  dateFormat: "DD-MM-YYYY",
}

const LOCALE_CODES = new Set(LOCALES.map((locale) => locale.code))
const CHANNELS = new Set<NotificationChannel>(["in-app", "email", "sms", "none"])
const DIGESTS = new Set<NotificationDigest>(["immediate", "daily", "weekly"])
const TIME_ZONES = new Set<SupportedTimeZone>(["Asia/Kolkata", "UTC"])
const DATE_FORMATS = new Set<DateFormat>(["DD-MM-YYYY", "DD/MM/YYYY", "YYYY-MM-DD"])

export function normalizePersonalPreferences(raw: unknown): PersonalPreferences {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_PERSONAL_PREFERENCES }
  const input = raw as Partial<PersonalPreferences>
  return {
    locale: LOCALE_CODES.has(input.locale as Locale) ? input.locale as Locale : DEFAULT_PERSONAL_PREFERENCES.locale,
    notificationChannel: CHANNELS.has(input.notificationChannel as NotificationChannel) ? input.notificationChannel as NotificationChannel : DEFAULT_PERSONAL_PREFERENCES.notificationChannel,
    notificationDigest: DIGESTS.has(input.notificationDigest as NotificationDigest) ? input.notificationDigest as NotificationDigest : DEFAULT_PERSONAL_PREFERENCES.notificationDigest,
    timeZone: TIME_ZONES.has(input.timeZone as SupportedTimeZone) ? input.timeZone as SupportedTimeZone : DEFAULT_PERSONAL_PREFERENCES.timeZone,
    dateFormat: DATE_FORMATS.has(input.dateFormat as DateFormat) ? input.dateFormat as DateFormat : DEFAULT_PERSONAL_PREFERENCES.dateFormat,
  }
}

export function parsePersonalPreferences(raw: string | null): PersonalPreferences {
  if (!raw) return { ...DEFAULT_PERSONAL_PREFERENCES }
  try {
    return normalizePersonalPreferences(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_PERSONAL_PREFERENCES }
  }
}
