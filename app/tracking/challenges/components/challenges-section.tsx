"use client" // This component manages state for form visibility and selected challenge

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle, AlertTriangle, Loader2 } from "lucide-react"
import type { ImplementationChallenge } from "../types"
import { ChallengeForm } from "./challenge-form"
import { ChallengeListItem } from "./challenge-list-item"
import { getChallengesByImplementationIdAction } from "../../dashboard/actions"
import { useToast } from "@/hooks/use-toast"

interface ChallengesSectionProps {
  implementationStatusId: string
  // This component will fetch its own data, but could accept initial data as prop
}

export function ChallengesSection({ implementationStatusId }: ChallengesSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingChallenge, setEditingChallenge] = useState<ImplementationChallenge | undefined>(undefined)
  const [challenges, setChallenges] = useState<ImplementationChallenge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchChallenges = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getChallengesByImplementationIdAction(implementationStatusId)
      if (result.error) {
        setError(result.error)
        toast({ title: "Error fetching challenges", description: result.error, variant: "destructive" })
      } else {
        setChallenges(result.challenges)
      }
    } catch (e: any) {
      setError("An unexpected error occurred.")
      toast({ title: "Error", description: "Failed to load challenges.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [implementationStatusId, toast])

  useEffect(() => {
    fetchChallenges()
  }, [fetchChallenges])

  const handleFormSuccess = (challengeId: string) => {
    setShowForm(false)
    setEditingChallenge(undefined)
    fetchChallenges() // Re-fetch challenges to show the new/updated one
  }

  const handleEdit = (challenge: ImplementationChallenge) => {
    setEditingChallenge(challenge)
    setShowForm(true)
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingChallenge(undefined)
  }

  const handleChallengeDeleted = (deletedChallengeId: string) => {
    setChallenges((prev) => prev.filter((c) => c.id !== deletedChallengeId))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-2 text-muted-foreground">Loading challenges...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-600 bg-red-50 p-4 rounded-md flex items-center">
        <AlertTriangle className="h-5 w-5 mr-2" />
        <p>Error loading challenges: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Implementation Challenges</h3>
        {!showForm && (
          <Button
            onClick={() => {
              setEditingChallenge(undefined)
              setShowForm(true)
            }}
            size="sm"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Challenge
          </Button>
        )}
      </div>

      {showForm && (
        <ChallengeForm
          implementationStatusId={implementationStatusId}
          challenge={editingChallenge}
          onSuccess={handleFormSuccess}
          onCancel={handleCancelForm}
        />
      )}

      {!showForm && challenges.length === 0 && (
        <div className="text-center py-6 bg-gray-50 rounded-md">
          <AlertTriangle className="mx-auto h-10 w-10 text-gray-400 mb-2" />
          <p className="text-gray-600">No challenges reported for this implementation yet.</p>
          <p className="text-sm text-gray-500">Click "Add Challenge" to log the first one.</p>
        </div>
      )}

      {!showForm && challenges.length > 0 && (
        <div className="space-y-3">
          {challenges.map((challenge) => (
            <ChallengeListItem
              key={challenge.id}
              challenge={challenge}
              onEdit={handleEdit}
              onDeleted={handleChallengeDeleted}
            />
          ))}
        </div>
      )}
    </div>
  )
}
