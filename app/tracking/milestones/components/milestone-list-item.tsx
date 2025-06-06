"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Badge } from "@/components/ui/badge"
import { Edit3, Trash2, CalendarDays, CheckCircle, XCircle, Hourglass, Info } from "lucide-react"
import type { ImplementationMilestone, MilestoneStatus } from "../types"
import { MilestoneForm } from "./milestone-form"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

interface MilestoneListItemProps {
  milestone: ImplementationMilestone
  onUpdate: (updatedMilestone: ImplementationMilestone) => void
  onDelete: (milestoneId: string) => void
  updateActionFn: (data: any, implementationStatusId: string, milestoneId: string) => Promise<any>
  deleteActionFn: (milestoneId: string, implementationStatusId: string) => Promise<any>
  implementationStatusId: string
}

const statusColors: Record<MilestoneStatus, string> = {
  PLANNED: "bg-blue-500 hover:bg-blue-600",
  IN_PROGRESS: "bg-yellow-500 hover:bg-yellow-600",
  COMPLETED: "bg-green-500 hover:bg-green-600",
  DELAYED: "bg-red-500 hover:bg-red-600",
  ON_HOLD: "bg-gray-500 hover:bg-gray-600",
}

const statusIcons: Record<MilestoneStatus, React.ElementType> = {
  PLANNED: CalendarDays,
  IN_PROGRESS: Hourglass,
  COMPLETED: CheckCircle,
  DELAYED: XCircle,
  ON_HOLD: Info,
}

export function MilestoneListItem({
  milestone,
  onUpdate,
  onDelete,
  updateActionFn,
  deleteActionFn,
  implementationStatusId,
}: MilestoneListItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleUpdate = (updatedMilestone: ImplementationMilestone) => {
    onUpdate(updatedMilestone)
    setIsEditing(false)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteActionFn(milestone.id, implementationStatusId)
      if (result.success) {
        toast({
          title: "Milestone Deleted",
          description: result.message,
        })
        onDelete(milestone.id)
      } else {
        toast({
          title: "Error Deleting Milestone",
          description: result.message || "Could not delete milestone.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const StatusIcon = statusIcons[milestone.status] || Info

  if (isEditing) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Edit Milestone</CardTitle>
        </CardHeader>
        <CardContent>
          <MilestoneForm
            implementationStatusId={implementationStatusId}
            milestone={milestone}
            actionFn={updateActionFn}
            formAction="update"
            onSuccess={handleUpdate}
            onCancel={() => setIsEditing(false)}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-4 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold">{milestone.title}</CardTitle>
          <Badge className={`${statusColors[milestone.status]} text-white`}>
            <StatusIcon className="mr-1.5 h-3.5 w-3.5" />
            {milestone.status.replace("_", " ")}
          </Badge>
        </div>
        {milestone.description && (
          <CardDescription className="text-sm text-gray-600 pt-1">{milestone.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="text-sm space-y-2 pb-4">
        <div className="flex items-center">
          <CalendarDays className="h-4 w-4 mr-2 text-gray-500" />
          <strong>Target Date:</strong>
          <span className="ml-1">{format(new Date(milestone.target_date), "PPP")}</span>
        </div>
        {milestone.actual_completion_date && (
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
            <strong>Completed On:</strong>
            <span className="ml-1">{format(new Date(milestone.actual_completion_date), "PPP")}</span>
          </div>
        )}
        {milestone.notes && (
          <div className="pt-1">
            <p className="text-xs text-gray-500">Notes:</p>
            <p className="whitespace-pre-wrap text-gray-700">{milestone.notes}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end space-x-2 bg-slate-50 dark:bg-slate-800/30 py-3 px-6 border-t">
        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
          <Edit3 className="mr-1 h-4 w-4" /> Edit
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={isDeleting}>
              <Trash2 className="mr-1 h-4 w-4" /> {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the milestone &quot;{milestone.title}&quot;.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Yes, delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  )
}
