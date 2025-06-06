"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle, Users, Loader2, AlertTriangle } from "lucide-react"
import type { ImplementationStakeholder } from "../types"
import { StakeholderForm } from "./stakeholder-form"
import { StakeholderListItem } from "./stakeholder-list-item"
import { getStakeholdersByImplementationIdAction } from "../../dashboard/actions"
import { useToast } from "@/hooks/use-toast"

interface StakeholdersSectionProps {
  implementationStatusId: string
}

export function StakeholdersSection({ implementationStatusId }: StakeholdersSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingStakeholder, setEditingStakeholder] = useState<ImplementationStakeholder | undefined>(undefined)
  const [stakeholders, setStakeholders] = useState<ImplementationStakeholder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchStakeholders = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getStakeholdersByImplementationIdAction(implementationStatusId)
      if (result.error) {
        setError(result.error)
        toast({ title: "Error fetching stakeholders", description: result.error, variant: "destructive" })
      } else {
        setStakeholders(result.stakeholders)
      }
    } catch (e: any) {
      setError("An unexpected error occurred.")
      toast({ title: "Error", description: "Failed to load stakeholders.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [implementationStatusId, toast])

  useEffect(() => {
    fetchStakeholders()
  }, [fetchStakeholders])

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingStakeholder(undefined)
    fetchStakeholders()
  }

  const handleEdit = (stakeholder: ImplementationStakeholder) => {
    setEditingStakeholder(stakeholder)
    setShowForm(true)
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingStakeholder(undefined)
  }

  const handleStakeholderDeleted = (deletedStakeholderId: string) => {
    setStakeholders((prev) => prev.filter((s) => s.id !== deletedStakeholderId))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-2 text-muted-foreground">Loading stakeholders...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-600 bg-red-50 p-4 rounded-md flex items-center">
        <AlertTriangle className="h-5 w-5 mr-2" />
        <p>Error loading stakeholders: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold flex items-center">
          <Users className="mr-3 h-6 w-6 text-gray-600" />
          Stakeholder Mapping
        </h3>
        {!showForm && (
          <Button
            onClick={() => {
              setEditingStakeholder(undefined)
              setShowForm(true)
            }}
            size="sm"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Stakeholder
          </Button>
        )}
      </div>

      {showForm && (
        <StakeholderForm
          implementationStatusId={implementationStatusId}
          stakeholder={editingStakeholder}
          onSuccess={handleFormSuccess}
          onCancel={handleCancelForm}
        />
      )}

      {!showForm && stakeholders.length === 0 && (
        <div className="text-center py-6 bg-gray-50 rounded-md">
          <Users className="mx-auto h-10 w-10 text-gray-400 mb-2" />
          <p className="text-gray-600">No stakeholders mapped for this implementation yet.</p>
          <p className="text-sm text-gray-500">Click "Add Stakeholder" to log the first one.</p>
        </div>
      )}

      {!showForm && stakeholders.length > 0 && (
        <div className="space-y-3">
          {stakeholders.map((stakeholder) => (
            <StakeholderListItem
              key={stakeholder.id}
              stakeholder={stakeholder}
              onEdit={handleEdit}
              onDeleted={handleStakeholderDeleted}
            />
          ))}
        </div>
      )}
    </div>
  )
}
