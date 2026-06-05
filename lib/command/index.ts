// Pure helpers for the command palette (client-safe, no framework imports).

export interface CommandItem {
  title: string
  href: string
}

/** Drop entries with no href and any duplicate hrefs, preserving first-seen order. */
export function dedupeByHref(items: CommandItem[]): CommandItem[] {
  const seen = new Set<string>()
  const out: CommandItem[] = []
  for (const it of items) {
    if (it.href && !seen.has(it.href)) {
      seen.add(it.href)
      out.push(it)
    }
  }
  return out
}

/** Case-insensitive filter over title + href, capped at `limit`. */
export function filterCommandItems(items: CommandItem[], query: string, limit = 50): CommandItem[] {
  const t = query.trim().toLowerCase()
  const matched = t
    ? items.filter((i) => i.title.toLowerCase().includes(t) || i.href.toLowerCase().includes(t))
    : items
  return matched.slice(0, limit)
}
