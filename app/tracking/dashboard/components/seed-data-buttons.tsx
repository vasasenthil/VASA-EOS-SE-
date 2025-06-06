"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Milestone, AlertTriangle, Users } from "lucide-react" // Added Users icon
import {
  seedImplementationMilestonesAction,
  seedImplementationChallengesAction,
  seedImplementationStakeholdersAction, // Import new action
} from "../actions" // Assuming actions are in the parent dashboard folder

// Sample data generation functions (can be moved to a separate utils file if they grow)
const generateSampleMilestones = (implementationStatusIds: string[]) => {
  if (implementationStatusIds.length === 0) return []
  const milestones = []
  const statuses = ["Planned", "In Progress", "Completed", "Delayed", "On Hold"]
  const entities = ["State Education Dept.", "District Office", "Partner NGO", "Tech Provider"]
  for (const statusId of implementationStatusIds) {
    for (let i = 0; i < Math.floor(Math.random() * 4) + 2; i++) {
      const targetDays = Math.floor(Math.random() * 90) + 30
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() + targetDays)
      milestones.push({
        implementation_status_id: statusId,
        milestone_name: `Milestone ${i + 1} for ${statusId.substring(0, 4)}`,
        description: `Key objective ${i + 1} for this phase.`,
        target_date: targetDate.toISOString().split("T")[0],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        responsible_entity: entities[Math.floor(Math.random() * entities.length)],
        notes: "Initial planning complete.",
      })
    }
  }
  return milestones
}

const generateSampleChallenges = (implementationStatusIds: string[]) => {
  if (implementationStatusIds.length === 0) return []
  const challenges = []
  const severities = ["Low", "Medium", "High", "Critical"]
  const statuses = ["Open", "In Progress", "Resolved", "Closed", "Escalated"]
  const types = ["Funding", "Resource", "Technical", "Administrative", "Community Acceptance"]
  for (const statusId of implementationStatusIds) {
    for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
      const reportedDate = new Date()
      reportedDate.setDate(reportedDate.getDate() - Math.floor(Math.random() * 30))
      challenges.push({
        implementation_status_id: statusId,
        challenge_title: `Challenge ${i + 1} for ${statusId.substring(0, 4)}`,
        description: `Description of challenge ${i + 1}.`,
        challenge_type: types[Math.floor(Math.random() * types.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        reported_date: reportedDate.toISOString().split("T")[0],
        // resolved_date: (status === 'Resolved' || status === 'Closed') ? new Date().toISOString().split('T')[0] : undefined,
        mitigation_plan: "Plan to address this challenge.",
        reported_by: "System/User",
      })
    }
  }
  return challenges
}

// Sample data for stakeholders
const generateSampleStakeholders = (implementationStatusIds: string[]) => {
  if (implementationStatusIds.length === 0) return []
  const stakeholders = []
  const stakeholderTypes = [
    "State Education Department",
    "NGO/Civil Society Organization",
    "School Management Committee (SMC)",
    "Teacher Union/Association",
    "Parent Association",
  ]
  const roles = [
    "Supporting Implementer",
    "Monitoring & Evaluation",
    "Beneficiary Representative",
    "Advocacy & Awareness",
  ]
  const engagementLevels = ["High", "Medium", "Consulted"]
  const influenceLevels = ["High", "Medium", "Low"]
  const interestLevels = ["High", "Medium", "Low"]

  for (const statusId of implementationStatusIds) {
    for (let i = 0; i < Math.floor(Math.random() * 3) + 2; i++) {
      // 2 to 4 stakeholders per implementation
      stakeholders.push({
        implementation_status_id: statusId,
        stakeholder_name: `Org ${i + 1} for ${statusId.substring(0, 4)}`,
        stakeholder_type: stakeholderTypes[Math.floor(Math.random() * stakeholderTypes.length)],
        role_in_implementation: roles[Math.floor(Math.random() * roles.length)],
        contact_person: `Mr./Ms. Contact ${i + 1}`,
        email: `contact_${statusId.substring(0, 2)}_${i + 1}@example.com`,
        engagement_level: engagementLevels[Math.floor(Math.random() * engagementLevels.length)],
        influence_level: influenceLevels[Math.floor(Math.random() * influenceLevels.length)],
        interest_level: interestLevels[Math.floor(Math.random() * interestLevels.length)],
        contribution_summary: "Provides local insights and support.",
        notes: "Regularly updated.",
      })
    }
  }
  return stakeholders
}

export function SeedDataButtons({ implementationStatusIds }: { implementationStatusIds: string[] }) {
  const { toast } = useToast()
  const [isSeedingMilestones, startMilestoneTransition] = useTransition()
  const [isSeedingChallenges, startChallengeTransition] = useTransition()
  const [isSeedingStakeholders, startStakeholderTransition] = useTransition() // New state for stakeholders

  const handleSeedMilestones = async () => {
    if (implementationStatusIds.length === 0) {
      toast({
        title: "No Implementations",
        description: "No implementation IDs to seed milestones for.",
        variant: "destructive",
      })
      return
    }
    startMilestoneTransition(async () => {
      const sampleMilestones = generateSampleMilestones(implementationStatusIds)
      if (sampleMilestones.length === 0) {
        toast({
          title: "No Milestones Generated",
          description: "Could not generate sample milestones.",
          variant: "destructive",
        })
        return
      }
      const result = await seedImplementationMilestonesAction(sampleMilestones)
      if (result.error) {
        toast({ title: "Error Seeding Milestones", description: result.message, variant: "destructive" })
      } else {
        toast({ title: "Milestones Seeded", description: result.message })
      }
    })
  }

  const handleSeedChallenges = async () => {
    if (implementationStatusIds.length === 0) {
      toast({
        title: "No Implementations",
        description: "No implementation IDs to seed challenges for.",
        variant: "destructive",
      })
      return
    }
    startChallengeTransition(async () => {
      const sampleChallenges = generateSampleChallenges(implementationStatusIds)
      if (sampleChallenges.length === 0) {
        toast({
          title: "No Challenges Generated",
          description: "Could not generate sample challenges.",
          variant: "destructive",
        })
        return
      }
      const result = await seedImplementationChallengesAction(sampleChallenges)
      if (result.error) {
        toast({ title: "Error Seeding Challenges", description: result.message, variant: "destructive" })
      } else {
        toast({ title: "Challenges Seeded", description: result.message })
      }
    })
  }

  const handleSeedStakeholders = async () => {
    if (implementationStatusIds.length === 0) {
      toast({
        title: "No Implementations",
        description: "No implementation IDs to seed stakeholders for.",
        variant: "destructive",
      })
      return
    }
    startStakeholderTransition(async () => {
      const sampleStakeholders = generateSampleStakeholders(implementationStatusIds)
      if (sampleStakeholders.length === 0) {
        toast({
          title: "No Stakeholders Generated",
          description: "Could not generate sample stakeholders.",
          variant: "destructive",
        })
        return
      }
      const result = await seedImplementationStakeholdersAction(sampleStakeholders)
      if (result.error) {
        toast({ title: "Error Seeding Stakeholders", description: result.message, variant: "destructive" })
      } else {
        toast({ title: "Stakeholders Seeded", description: result.message })
      }
    })
  }

  if (implementationStatusIds.length === 0) {
    return <p className="text-sm text-muted-foreground">No implementation data found to seed related items.</p>
  }

  return (
    <div className="flex flex-wrap gap-2 p-4 border rounded-md bg-slate-50">
      <Button onClick={handleSeedMilestones} disabled={isSeedingMilestones} variant="outline" size="sm">
        {isSeedingMilestones ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Milestone className="mr-2 h-4 w-4" />
        )}
        Seed Milestones ({generateSampleMilestones(implementationStatusIds).length})
      </Button>
      <Button onClick={handleSeedChallenges} disabled={isSeedingChallenges} variant="outline" size="sm">
        {isSeedingChallenges ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <AlertTriangle className="mr-2 h-4 w-4" />
        )}
        Seed Challenges ({generateSampleChallenges(implementationStatusIds).length})
      </Button>
      <Button onClick={handleSeedStakeholders} disabled={isSeedingStakeholders} variant="outline" size="sm">
        {isSeedingStakeholders ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
        Seed Stakeholders ({generateSampleStakeholders(implementationStatusIds).length})
      </Button>
    </div>
  )
}
