"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Database } from "lucide-react"
import { seedFeesAction } from "../actions"

export function SeedFeesButton() {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <Button variant="outline" disabled={pending} onClick={() => start(async () => { await seedFeesAction(); router.refresh() })}>
      <Database className="mr-2 h-4 w-4" />Seed demo fees
    </Button>
  )
}
