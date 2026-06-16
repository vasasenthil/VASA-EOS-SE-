// VASA-EOS(SE) — crash-safe date formatting.
//
// date-fns `format(new Date(x), fmt)` throws `RangeError: Invalid time value` when x is null,
// undefined or an unparseable string. Several server-rendered pages called it directly on
// database/demo values, so a single missing or malformed timestamp crashed the whole page
// (surfaced to the user as "Something went wrong"). safeDate never throws — it returns a fallback
// for any value it cannot turn into a valid date.

import { format } from "date-fns"

export function safeDate(value: unknown, fmt: string, fallback = "N/A"): string {
  if (value === null || value === undefined || value === "") return fallback
  const d = value instanceof Date ? value : new Date(value as string | number)
  return Number.isNaN(d.getTime()) ? fallback : format(d, fmt)
}
