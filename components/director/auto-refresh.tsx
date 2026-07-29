"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function DirectorAutoRefresh({ intervalSeconds = 30 }: { intervalSeconds?: number }) {
  const router = useRouter()
  const [lastRefresh, setLastRefresh] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => { router.refresh(); setLastRefresh(new Date()) }, intervalSeconds * 1000)
    return () => window.clearInterval(timer)
  }, [intervalSeconds, router])
  return <p className="text-xs text-muted-foreground" role="status">Live-store refresh: {intervalSeconds}s · browser refresh {lastRefresh.toLocaleTimeString()}</p>
}
