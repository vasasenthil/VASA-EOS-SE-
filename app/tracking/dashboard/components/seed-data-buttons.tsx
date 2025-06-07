"use client"

import type React from "react" // Ensure React is imported if FC is used or for JSX
import { useTransition } from "react" // Added useTransition
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast" // Corrected path for useToast
import { Loader2, DatabaseZap, MilestoneIcon, AlertTriangle, Users } from "lucide-react" // Added icons

import {
  seedPolicyImplementationStatusAction,
  seedImplementationMilestonesAction,
  seedImplementationChallengesAction,
  seedImplementationStakeholdersAction,
} from "../actions"

// This component no longer needs to import data generation functions or supabaseAdmin

export const SeedDataButtons: React.FC = () => {
  const { toast } = useToast()
  const [isSeedingPolicyImplementations, startPolicyImplTransition] = useTransition()
  const [isSeedingMilestones, startMilestoneTransition] = useTransition()
  const [isSeedingChallenges, startChallengeTransition] = useTransition()
  const [isSeedingStakeholders, startStakeholderTransition] = useTransition()

  const handleSeedPolicyImplementations = () => {
    startPolicyImplTransition(async () => {
      const result = await seedPolicyImplementationStatusAction()
      if (result.error) {
        toast({ title: "Error Seeding Policy Implementations", description: result.message, variant: "destructive" })
      } else {
        toast({ title: "Policy Implementations Seeded", description: result.message })
      }
    })
  }

  const handleSeedMilestones = () => {
    startMilestoneTransition(async () => {
      const result = await seedImplementationMilestonesAction()
      if (result.error) {
        toast({ title: "Error Seeding Milestones", description: result.message, variant: "destructive" })
      } else {
        toast({ title: "Milestones Seeded", description: result.message })
      }
    })
  }

  const handleSeedChallenges = () => {
    startChallengeTransition(async () => {
      const result = await seedImplementationChallengesAction()
      if (result.error) {
        toast({ title: "Error Seeding Challenges", description: result.message, variant: "destructive" })
      } else {
        toast({ title: "Challenges Seeded", description: result.message })
      }
    })
  }

  const handleSeedStakeholders = () => {
    startStakeholderTransition(async () => {
      const result = await seedImplementationStakeholdersAction()
      if (result.error) {
        toast({ title: "Error Seeding Stakeholders", description: result.message, variant: "destructive" })
      } else {
        toast({ title: "Stakeholders Seeded", description: result.message })
      }
    })
  }

  return (
    <div className="p-4 border rounded-md bg-slate-50 dark:bg-slate-800">
      <h3 className="text-lg font-semibold mb-3 text-slate-700 dark:text-slate-200">Development: Seed Data</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          onClick={handleSeedPolicyImplementations}
          disabled={isSeedingPolicyImplementations}
          variant="outline"
          className="w-full"
        >
          {isSeedingPolicyImplementations ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <DatabaseZap className="mr-2 h-4 w-4" />
          )}
          Seed Policy Implementations
        </Button>
        <Button onClick={handleSeedMilestones} disabled={isSeedingMilestones} variant="outline" className="w-full">
          {isSeedingMilestones ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <MilestoneIcon className="mr-2 h-4 w-4" />
          )}
          Seed Milestones
        </Button>
        <Button onClick={handleSeedChallenges} disabled={isSeedingChallenges} variant="outline" className="w-full">
          {isSeedingChallenges ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <AlertTriangle className="mr-2 h-4 w-4" />
          )}
          Seed Challenges
        </Button>
        <Button onClick={handleSeedStakeholders} disabled={isSeedingStakeholders} variant="outline" className="w-full">
          {isSeedingStakeholders ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Users className="mr-2 h-4 w-4" />
          )}
          Seed Stakeholders
        </Button>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
        Note: Seeding will clear existing related data for the generated items.
      </p>
    </div>
  )
}
