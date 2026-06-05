// VASA-EOS(SE) — academic calendar & events (Sec 25 / school operations).
// Term, exam, holiday, PTM and general events. Pure sort/upcoming/summary helpers;
// the UI adds events and lists them by date and type.

export type EventType = "term" | "exam" | "holiday" | "ptm" | "event"

export const EVENT_TYPES: { key: EventType; label: string }[] = [
  { key: "term", label: "Term" },
  { key: "exam", label: "Examination" },
  { key: "holiday", label: "Holiday" },
  { key: "ptm", label: "Parent-Teacher Meeting" },
  { key: "event", label: "Event" },
]

export interface AcademicEvent {
  id: string
  title: string
  type: EventType
  date: string // YYYY-MM-DD
}

export const SAMPLE_EVENTS: AcademicEvent[] = [
  { id: "ev-1", title: "Term I begins", type: "term", date: "2026-06-01" },
  { id: "ev-2", title: "Quarterly examinations", type: "exam", date: "2026-09-14" },
  { id: "ev-3", title: "Pongal holidays", type: "holiday", date: "2027-01-14" },
  { id: "ev-4", title: "Parent-Teacher Meeting", type: "ptm", date: "2026-07-19" },
]

export function sortEvents(events: AcademicEvent[]): AcademicEvent[] {
  return [...events].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

/** Events on or after `today`, soonest first. */
export function upcoming(events: AcademicEvent[], today: string): AcademicEvent[] {
  return sortEvents(events.filter((e) => e.date >= today))
}

export interface CalendarSummary {
  total: number
  byType: Record<EventType, number>
}

export function calendarSummary(events: AcademicEvent[]): CalendarSummary {
  const byType = Object.fromEntries(EVENT_TYPES.map((t) => [t.key, 0])) as Record<EventType, number>
  for (const e of events) byType[e.type] += 1
  return { total: events.length, byType }
}
