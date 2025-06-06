"use client"

import { useState, useTransition } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Edit, Trash2, CalendarDays, User, Tag, CheckCircle, Loader2 } from "lucide-react"
import type { ImplementationChallenge } from "../types"
import { deleteChallengeAction, type ChallengeActionState } from "../../dashboard/actions"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ChallengeListItemProps {
  challenge: ImplementationChallenge
  onEdit: (challenge: ImplementationChallenge) => void
  onDeleted: (challengeId: string) => void
}

const severityColors: Record<ImplementationChallenge["severity"], string> = {
  Low: "bg-green-100 text-green-700 border-green-300",
  Medium: "bg-yellow-100 text-yellow-700 border-yellow-300",
  High: "bg-orange-100 text-orange-700 border-orange-300",
  Critical: "bg-red-100 text-red-700 border-red-300",
}

const statusColors: Record<ImplementationChallenge["status"], string> = {
  Open: "bg-blue-100 text-blue-700 border-blue-300",
  "In Progress": "bg-indigo-100 text-indigo-700 border-indigo-300",
  Resolved: "bg-green-100 text-green-700 border-green-300",
  Closed: "bg-gray-200 text-gray-600 border-gray-400",
  Escalated: "bg-purple-100 text-purple-700 border-purple-300",
}

export function ChallengeListItem({ challenge, onEdit, onDeleted }: ChallengeListItemProps) {
  const { toast } = useToast()
  const [isDeleting, startDeleteTransition] = useTransition()
  const [isAlertOpen, setIsAlertOpen] = useState(false)

  const handleDelete = () => {
    startDeleteTransition(async () => {
      const result: ChallengeActionState = await deleteChallengeAction(challenge.id)
      if (result.success) {
        toast({ title: "Challenge Deleted", description: result.message })
        onDeleted(challenge.id)
        setIsAlertOpen(false)
      } else {
        toast({ title: "Error Deleting Challenge", description: result.message, variant: "destructive" })
      }
    })
  }

  return (
    <Card className="mb-4 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold">{challenge.challenge_title}</CardTitle>
          <Badge className={severityColors[challenge.severity]}>{challenge.severity}</Badge>
        </div>
        <CardDescription className="flex items-center text-xs text-gray-500">
          <AlertTriangle className="w-3 h-3 mr-1.5" />
          ID: {challenge.id.substring(0, 8)}...
          {challenge.category && (
            <>
              <span className="mx-1.5">|</span>
              <Tag className="w-3 h-3 mr-1" /> {challenge.category}
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {challenge.description && <p className="text-sm text-gray-700 mb-3">{challenge.description}</p>}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-gray-600">
          <div className="flex items-center">
            <strong className="mr-1.5">Status:</strong>
            <Badge variant="outline" className={`${statusColors[challenge.status]} px-1.5 py-0.5 text-xs`}>
              {challenge.status}
            </Badge>
          </div>
          {challenge.reported_date && (
            <div className="flex items-center">
              <CalendarDays className="w-3.5 h-3.5 mr-1 text-gray-500" />
              <strong>Reported:</strong> {format(new Date(challenge.reported_date), "dd MMM yyyy")}
            </div>
          )}
          {challenge.reported_by && (
            <div className="flex items-center">
              <User className="w-3.5 h-3.5 mr-1 text-gray-500" />
              <strong>By:</strong> {challenge.reported_by}
            </div>
          )}
          {challenge.assigned_to && (
            <div className="flex items-center">
              <User className="w-3.5 h-3.5 mr-1 text-gray-500" />
              <strong>Assigned:</strong> {challenge.assigned_to}
            </div>
          )}
          {(challenge.status === "Resolved" || challenge.status === "Closed") && challenge.resolved_date && (
            <div className="flex items-center col-span-2">
              <CheckCircle className="w-3.5 h-3.5 mr-1 text-green-600" />
              <strong>Resolved:</strong> {format(new Date(challenge.resolved_date), "dd MMM yyyy")}
            </div>
          )}
        </div>
        {challenge.resolution_details && (challenge.status === "Resolved" || challenge.status === "Closed") && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-700">Resolution:</p>
            <p className="text-xs text-gray-600 whitespace-pre-wrap">{challenge.resolution_details}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2 border-t pt-3 pb-3">
        <Button variant="outline" size="sm" onClick={() => onEdit(challenge)}>
          <Edit className="mr-1.5 h-3.5 w-3.5" /> Edit
        </Button>
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the challenge "{challenge.challenge_title}"? This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  )
}
