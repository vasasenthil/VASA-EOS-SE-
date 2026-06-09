// Pure helpers for breadcrumbs and the route announcer (client-safe, no imports).

export interface Crumb {
  label: string
  href: string
}

// Segments that should render fully uppercased rather than title-cased.
const ACRONYMS = new Set([
  "sis", "omr", "dbt", "rbsk", "smc", "beo", "deo", "crcc", "esg", "udise", "apaar",
  "ai", "ivr", "nep", "rte", "pm", "cmbs", "poshan", "tn", "kpi", "id",
])

/** Turn a URL segment into a human label ("school-registry" -> "School Registry"). */
export function humanizeSegment(seg: string): string {
  return seg
    .split("-")
    .map((w) => (ACRONYMS.has(w.toLowerCase()) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ")
}

/** Cumulative breadcrumb trail for a pathname; uses titleMap when a route is known. */
export function breadcrumbsFor(pathname: string, titleMap: Record<string, string> = {}): Crumb[] {
  const segments = pathname.split("/").filter(Boolean)
  const crumbs: Crumb[] = []
  let href = ""
  for (const seg of segments) {
    href += "/" + seg
    crumbs.push({ label: titleMap[href] ?? humanizeSegment(seg), href })
  }
  return crumbs
}

/** Human title for a route — used to announce navigation to assistive tech. */
export function routeTitle(pathname: string, titleMap: Record<string, string> = {}): string {
  if (titleMap[pathname]) return titleMap[pathname]
  const segments = pathname.split("/").filter(Boolean)
  if (segments.length === 0) return "Home"
  return humanizeSegment(segments[segments.length - 1])
}
