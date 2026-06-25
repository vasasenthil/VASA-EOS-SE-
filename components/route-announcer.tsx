"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname } from "next/navigation"
import { dashboardNavConfig } from "@/config/dashboard-nav"
import { routeTitle } from "@/lib/navigation"

// Announces client-side route changes to assistive tech via a polite live region,
// so screen-reader users hear which page they landed on after navigation.
export function RouteAnnouncer() {
  const pathname = usePathname()
  const titleMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const nav of Object.values(dashboardNavConfig)) for (const n of nav) if (n.href) map[n.href] = n.title
    return map
  }, [])
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!pathname) return
    const title = routeTitle(pathname, titleMap)
    // Slight delay so the live region re-announces even on same-text updates.
    const id = setTimeout(() => setMessage(`Navigated to ${title}`), 120)
    return () => clearTimeout(id)
  }, [pathname, titleMap])

  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  )
}
