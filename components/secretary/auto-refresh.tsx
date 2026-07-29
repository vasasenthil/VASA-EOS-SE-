"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function SecretaryAutoRefresh({ intervalSeconds = 30 }: { intervalSeconds?: number }) {
  const router = useRouter()
  const [lastRefresh, setLastRefresh] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => { router.refresh(); setLastRefresh(new Date()) }, intervalSeconds * 1000)
    return () => window.clearInterval(timer)
  }, [intervalSeconds, router])
  return <p className="text-xs text-muted-foreground" role="status">Auto-refresh: {intervalSeconds}s · browser refresh {lastRefresh.toLocaleTimeString()}</p>
}

