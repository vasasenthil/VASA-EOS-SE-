"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Database } from "lucide-react"
import { seedAssignmentsAction } from "../actions"

export function SeedAssignmentsButton() {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <Button variant="outline" disabled={pending} onClick={() => start(async () => { await seedAssignmentsAction(); router.refresh() })}>
      <Database className="mr-2 h-4 w-4" />Seed demo assignments
    </Button>
  )
}
