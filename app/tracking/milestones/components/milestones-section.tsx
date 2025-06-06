"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle, Flag, Loader2, AlertTriangle } from "lucide-react"
import type { ImplementationMilestone } from "../types"
import { MilestoneForm } from "./milestone-form"
import { MilestoneListItem } from "./milestone-list-item"
import { getMilestonesByImplementationIdAction } from "../../dashboard/actions"
import { useToast } from "@/hooks/use-toast"

interface MilestonesSectionProps {
  implementationStatusId: string
}

export function MilestonesSection({ implementationStatusId }: MilestonesSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<ImplementationMilestone | undefined>(undefined)
  const [milestones, setMilestones] = useState<ImplementationMilestone[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchMilestones = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getMilestonesByImplementationIdAction(implementationStatusId)
      if (result.error) {
        setError(result.error)
        toast({ title: "Error fetching milestones", description: result.error, variant: "destructive" })
      } else {
        setMilestones(result.milestones)
      }
    } catch (e: any) {
      setError("An unexpected error occurred.")
      toast({ title: "Error", description: "Failed to load milestones.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [implementationStatusId, toast])

  useEffect(() => {
    fetchMilestones()
  }, [fetchMilestones])

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingMilestone(undefined)
    fetchMilestones()
  }

  const handleEdit = (milestone: ImplementationMilestone) => {
    setEditingMilestone(milestone)
    setShowForm(true)
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingMilestone(undefined)
  }

  const handleMilestoneDeleted = (deletedMilestoneId: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== deletedMilestoneId))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-2 text-muted-foreground">Loading milestones...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-600 bg-red-50 p-4 rounded-md flex items-center">
        <AlertTriangle className="h-5 w-5 mr-2" />
        <p>Error loading milestones: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold flex items-center">
          <Flag className="mr-3 h-6 w-6 text-gray-600" />
          Implementation Milestones
        </h3>
        {!showForm && (
          <Button
            onClick={() => {
              setEditingMilestone(undefined)
              setShowForm(true)
            }}
            size="sm"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Milestone
          </Button>
        )}
      </div>

      {showForm && (
        <MilestoneForm
          implementationStatusId={implementationStatusId}
          milestone={editingMilestone}
          onSuccess={handleFormSuccess}
          onCancel={handleCancelForm}
        />
      )}

      {!showForm && milestones.length === 0 && (
        <div className="text-center py-6 bg-gray-50 rounded-md">
          <Flag className="mx-auto h-10 w-10 text-gray-400 mb-2" />
          <p className="text-gray-600">No milestones defined for this implementation yet.</p>
          <p className="text-sm text-gray-500">Click "Add Milestone" to create the first one.</p>
        </div>
      )}

      {!showForm && milestones.length > 0 && (
        <div className="space-y-3">
          {milestones.map((milestone) => (
            <MilestoneListItem
              key={milestone.id}
              milestone={milestone}
              onEdit={handleEdit}
              onDeleted={handleMilestoneDeleted}
            />
          ))}
        </div>
      )}
    </div>
  )
}
