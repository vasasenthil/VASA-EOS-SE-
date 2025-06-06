"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DatabaseZap, Loader2 } from "lucide-react"
import { seedPolicyImplementationAction } from "@/app/policies/create/actions"
import { useToast } from "@/hooks/use-toast"

export function SeedImplementationsButton() {
  const router = useRouter()
  const [isSeeding, startSeedingTransition] = useTransition()
  const { toast } = useToast()

  const handleSeedData = async () => {
    startSeedingTransition(async () => {
      try {
        // Dynamically fetch existing policy IDs from the server to seed against.
        const { data: policies, error: policiesError } = await (await import("@/lib/supabase/server"))
          .supabaseAdmin!.from("policies")
          .select("id")
          .limit(5)

        if (policiesError || !policies || policies.length === 0) {
          toast({
            title: "Seeding Failed",
            description: "Could not fetch existing policies to seed against. Please seed policies first.",
            variant: "destructive",
          })
          return
        }

        const policyIds = policies.map((p) => p.id)

        const { generateSeedPolicyImplementationData } = await import("@/scripts/seed-policy-implementation")
        const implementationSeedData = generateSeedPolicyImplementationData(policyIds, 5) // 5 entries per policy

        if (implementationSeedData.length === 0) {
          toast({
            title: "No Data to Seed",
            description: "Could not generate implementation seed data.",
            variant: "destructive",
          })
          return
        }

        const result = await seedPolicyImplementationAction(implementationSeedData)
        if (result.error) {
          throw new Error(result.error)
        }
        toast({
          title: "Seeding Successful",
          description: `${result.count} implementation entries have been seeded.`,
        })
        router.refresh()
      } catch (error: any) {
        console.error("Failed to seed implementation data:", error)
        toast({
          title: "Seeding Failed",
          description: error.message || "An error occurred. Check console for details.",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <Button variant="outline" size="sm" onClick={handleSeedData} disabled={isSeeding}>
      {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DatabaseZap className="mr-2 h-4 w-4" />}
      {isSeeding ? "Seeding..." : "Seed Implementation Data (Dev)"}
    </Button>
  )
}
