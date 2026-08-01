"use client"

import { useEffect } from "react"

export function OfflineServiceWorker(): null {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") return
    if (!("serviceWorker" in navigator)) return
    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined)
  }, [])
  return null
}
