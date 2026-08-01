"use client"

import Link from "next/link"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

export const SettingsButton = () => {
  return (
    <Button asChild variant="ghost" size="icon" className="h-10 w-10 rounded-full">
      <Link href="/settings" aria-label="Personal settings">
        <Settings className="h-5 w-5" />
      </Link>
    </Button>
  )
}
