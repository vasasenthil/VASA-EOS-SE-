"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DatabaseZap, Loader2, ListChecks } from "lucide-react" // Added ListChecks
import { seedPolicyImplementationAction } from "@/app/policies/create/actions"
import { seedImplementationMilestonesAction } from "@/app/tracking/dashboard/actions" // New action
import { useToast } from "@/hooks/use-toast"

export function SeedDataButtons() {
  const router = useRouter()
  const [isSeedingImplementations, startImplementationsSeedTransition] = useTransition()
  const [isSeedingMilestones, startMilestonesSeedTransition] = useTransition()
  const { toast } = useToast()

  const handleSeedImplementations = async () => {
    startImplementationsSeedTransition(async () => {
      try {
        const { data: policies, error: policiesError } = await (await import("@/lib/supabase/server"))
          .supabaseAdmin!.from("policies")
          .select("id")
          .limit(5) // Fetch a few policy IDs to seed against

        if (policiesError || !policies || policies.length === 0) {
          toast({
            title: "Seeding Failed",
            description:
              "Could not fetch existing policies to seed implementation data against. Please seed policies first.",
            variant: "destructive",
          })
          return
        }
        const policyIds = policies.map((p) => p.id)

        const { generateSeedPolicyImplementationData } = await import("@/scripts/seed-policy-implementation")
        const implementationSeedData = generateSeedPolicyImplementationData(policyIds, 5)

        if (implementationSeedData.length === 0) {
          toast({
            title: "No Data to Seed",
            description: "Could not generate implementation seed data.",
            variant: "destructive",
          })
          return
        }

        const result = await seedPolicyImplementationAction(implementationSeedData)
        if (result.error) throw new Error(result.error)
        toast({ title: "Seeding Successful", description: `${result.count} implementation entries seeded.` })
        router.refresh()
      } catch (error: any) {
        toast({ title: "Seeding Failed", description: error.message || "An error occurred.", variant: "destructive" })
      }
    })
  }

  const handleSeedMilestones = async () => {
    startMilestonesSeedTransition(async () => {
      try {
        // Fetch a few implementation_status_ids to seed milestones against
        const { data: implStatuses, error: implStatusesError } = await (await import("@/lib/supabase/server"))
          .supabaseAdmin!.from("policy_implementation_status")
          .select("id")
          .limit(10) // Fetch up to 10 implementation status IDs

        if (implStatusesError || !implStatuses || implStatuses.length === 0) {
          toast({
            title: "Seeding Milestones Failed",
            description:
              "Could not fetch existing policy implementation statuses. Please seed implementation data first.",
            variant: "destructive",
          })
          return
        }
        const implementationStatusIds = implStatuses.map((s) => s.id)

        const { generateSeedMilestonesData } = await import("@/scripts/seed-milestones")
        const milestonesSeedData = generateSeedMilestonesData(implementationStatusIds, 4) // Avg 4 milestones per implementation

        if (milestonesSeedData.length === 0) {
          toast({
            title: "No Milestones to Seed",
            description: "Could not generate milestone seed data.",
            variant: "destructive",
          })
          return
        }

        const result = await seedImplementationMilestonesAction(milestonesSeedData)
        if (result.error) throw new Error(result.error)
        toast({ title: "Milestone Seeding Successful", description: `${result.count} milestone entries seeded.` })
        router.refresh() // Or revalidate specific parts of the page
      } catch (error: any) {
        toast({
          title: "Milestone Seeding Failed",
          description: error.message || "An error occurred.",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleSeedImplementations}
        disabled={isSeedingImplementations || isSeedingMilestones}
        className="w-full sm:w-auto"
      >
        {isSeedingImplementations ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <DatabaseZap className="mr-2 h-4 w-4" />
        )}
        {isSeedingImplementations ? "Seeding Impl..." : "Seed Implementation Data"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSeedMilestones}
        disabled={isSeedingMilestones || isSeedingImplementations}
        className="w-full sm:w-auto"
      >
        {isSeedingMilestones ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ListChecks className="mr-2 h-4 w-4" />
        )}
        {isSeedingMilestones ? "Seeding Mstns..." : "Seed Milestone Data"}
      </Button>
    </div>
  )
}
