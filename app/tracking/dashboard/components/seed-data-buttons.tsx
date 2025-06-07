"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import {
  seedPolicyImplementationStatusAction,
  seedImplementationMilestonesAction,
  seedImplementationChallengesAction,
  seedImplementationStakeholdersAction,
} from "../actions"
import { generateSeedStakeholderData } from "../../../../scripts/seed-stakeholders"
// Corrected import path for supabaseAdmin
import { supabaseAdmin } from "@/lib/supabase/server"

type SeedDataButtonsProps = {}

// Changed to named export
export const SeedDataButtons: React.FC<SeedDataButtonsProps> = ({}) => {
  const [isPolicyImplementationsLoading, setIsPolicyImplementationsLoading] = useState(false)
  const [isMilestonesLoading, setIsMilestonesLoading] = useState(false)
  const [isChallengesLoading, setIsChallengesLoading] = useState(false)
  const [isStakeholdersLoading, setIsStakeholdersLoading] = useState(false)

  const handleSeedPolicyImplementations = async () => {
    setIsPolicyImplementationsLoading(true)
    try {
      // @ts-ignore - Assuming seedPolicyImplementationStatusAction can be called without args for now
      // or that it fetches/generates its own data.
      // This needs to be aligned with the actual signature of seedPolicyImplementationStatusAction
      const result = await seedPolicyImplementationStatusAction()
      if (result.error) {
        toast({
          title: "Error Seeding Policy Implementations",
          description: result.message,
          variant: "destructive",
        })
      } else {
        toast({ title: "Success", description: result.message })
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to seed policy implementations.",
        variant: "destructive",
      })
    } finally {
      setIsPolicyImplementationsLoading(false)
    }
  }

  const handleSeedMilestones = async () => {
    setIsMilestonesLoading(true)
    try {
      // @ts-ignore - Assuming seedImplementationMilestonesAction can be called without args for now
      // or that it fetches/generates its own data.
      // This needs to be aligned with the actual signature of seedImplementationMilestonesAction
      const result = await seedImplementationMilestonesAction()
      if (result.error) {
        toast({
          title: "Error Seeding Milestones",
          description: result.message,
          variant: "destructive",
        })
      } else {
        toast({ title: "Success", description: result.message })
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to seed milestones.",
        variant: "destructive",
      })
    } finally {
      setIsMilestonesLoading(false)
    }
  }

  const handleSeedChallenges = async () => {
    setIsChallengesLoading(true)
    try {
      // @ts-ignore - Assuming seedImplementationChallengesAction can be called without args for now
      // or that it fetches/generates its own data.
      // This needs to be aligned with the actual signature of seedImplementationChallengesAction
      const result = await seedImplementationChallengesAction()
      if (result.error) {
        toast({
          title: "Error Seeding Challenges",
          description: result.message,
          variant: "destructive",
        })
      } else {
        toast({ title: "Success", description: result.message })
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to seed challenges.",
        variant: "destructive",
      })
    } finally {
      setIsChallengesLoading(false)
    }
  }

  const handleSeedStakeholders = async () => {
    setIsStakeholdersLoading(true)
    try {
      if (!supabaseAdmin) {
        toast({
          title: "Configuration Error",
          description: "Supabase admin client is not available. Cannot fetch implementation IDs.",
          variant: "destructive",
        })
        setIsStakeholdersLoading(false)
        return
      }

      const { data: implStatuses, error: fetchError } = await supabaseAdmin
        .from("policy_implementation_status")
        .select("id")
        .limit(5)

      if (fetchError) {
        toast({
          title: "Error Fetching Implementation IDs",
          description: fetchError.message,
          variant: "destructive",
        })
        setIsStakeholdersLoading(false)
        return
      }

      const implIds = implStatuses?.map((s) => s.id) || []

      if (implIds.length === 0) {
        toast({
          title: "Stakeholder Seeding Info",
          description: "No implementation IDs found. Please seed policy implementations first.",
          variant: "default",
        })
        setIsStakeholdersLoading(false)
        return
      }

      const stakeholdersToSeed = generateSeedStakeholderData(implIds, 2) // 2 stakeholders per implementation
      const result = await seedImplementationStakeholdersAction(stakeholdersToSeed)

      if (result.error) {
        toast({ title: "Error Seeding Stakeholders", description: result.message, variant: "destructive" })
      } else {
        toast({ title: "Success", description: result.message })
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to seed stakeholders.", variant: "destructive" })
    } finally {
      setIsStakeholdersLoading(false)
    }
  }

  return (
    <div className="flex flex-col space-y-2">
      <Button variant="outline" disabled={isPolicyImplementationsLoading} onClick={handleSeedPolicyImplementations}>
        {isPolicyImplementationsLoading ? "Seeding..." : "Seed Policy Implementations"}
      </Button>
      <Button variant="outline" disabled={isMilestonesLoading} onClick={handleSeedMilestones}>
        {isMilestonesLoading ? "Seeding..." : "Seed Milestones"}
      </Button>
      <Button variant="outline" disabled={isChallengesLoading} onClick={handleSeedChallenges}>
        {isChallengesLoading ? "Seeding..." : "Seed Challenges"}
      </Button>
      <Button variant="outline" disabled={isStakeholdersLoading} onClick={handleSeedStakeholders}>
        {isStakeholdersLoading ? "Seeding..." : "Seed Stakeholders"}
      </Button>
    </div>
  )
}

// Remove default export if it was there
// export default SeedDataButtons;
