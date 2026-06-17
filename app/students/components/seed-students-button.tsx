"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Database } from "lucide-react"
import { seedStudentsAction } from "../actions"

export function SeedStudentsButton() {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <Button variant="outline" disabled={pending} onClick={() => start(async () => { await seedStudentsAction(); router.refresh() })}>
      <Database className="mr-2 h-4 w-4" />Seed demo students
    </Button>
  )
}
