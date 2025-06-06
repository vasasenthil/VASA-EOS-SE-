"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DatabaseZap, Loader2 } from "lucide-react"
import { seedPoliciesAction } from "../create/actions" // Assuming path is correct
import { useToast } from "@/hooks/use-toast"

export function SeedDataButton() {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const handleSeedData = () => {
    startTransition(async () => {
      try {
        const result = await seedPoliciesAction(35) // Seed 35 policies
        toast({
          title: "Data Seeding Successful",
          description: `${result.count} policies have been seeded. The page will now refresh.`,
        })
        router.refresh() // Refresh the current route to reflect new data
      } catch (error) {
        console.error("Failed to seed data:", error)
        toast({
          title: "Data Seeding Failed",
          description: "An error occurred while trying to seed data. Check the console for details.",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <Button onClick={handleSeedData} disabled={isPending} variant="outline" className="w-full sm:w-auto">
      {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DatabaseZap className="mr-2 h-4 w-4" />}
      {isPending ? "Seeding..." : "Seed Sample Policies (Dev)"}
    </Button>
  )
}
