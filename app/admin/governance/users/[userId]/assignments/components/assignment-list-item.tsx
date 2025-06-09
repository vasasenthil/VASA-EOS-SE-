"use client"

import { useState } from "react"
import { useActionState } from "react"
import { removeUserAssignmentAction } from "@/app/governance/user-assignments/actions"
import type { Role, UserOUAssignment } from "@/app/governance/types"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { AlertTriangle, Edit3Icon, Loader2, Trash2Icon } from "lucide-react"
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
import { EditAssignmentForm } from "./edit-assignment-form" // Import the new form

interface AssignmentListItemProps {
  assignment: UserOUAssignment
  allRoles: Role[] // Pass all roles for the edit form
  canManage: boolean
}

export function AssignmentListItem({ assignment, allRoles, canManage }: AssignmentListItemProps) {
  const [removeState, removeFormAction, isRemoving] = useActionState(
    removeUserAssignmentAction.bind(null, assignment.id),
    { success: false, message: "" },
  )
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)

  const handleRemove = () => {
    removeFormAction() // No FormData needed for simple delete by ID
  }

  useState(() => {
    if (removeState.message) {
      toast({
        title: removeState.success ? "Success" : "Error",
        description: removeState.message,
        variant: removeState.success ? "default" : "destructive",
      })
    }
  }) // Re-run effect when removeState changes

  const handleEditSaved = () => {
    setIsEditing(false)
    // Potentially trigger a revalidation or refresh here if needed,
    // though revalidatePath in the server action should handle it.
  }

  if (isEditing) {
    return (
      <li className="py-4">
        <EditAssignmentForm
          assignment={assignment}
          allRoles={allRoles}
          onCancel={() => setIsEditing(false)}
          onSaved={handleEditSaved}
        />
      </li>
    )
  }

  return (
    <li className="flex items-center justify-between gap-x-6 py-4">
      <div className="min-w-0">
        <div className="flex items-start gap-x-3">
          <p className="text-sm font-semibold leading-6 text-foreground">
            {assignment.organizational_unit?.name || "Unknown OU"}
          </p>
          <span
            className={`rounded-md whitespace-nowrap mt-0.5 px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
              assignment.role?.is_system_role
                ? "text-amber-700 bg-amber-50 ring-amber-600/20"
                : "text-green-700 bg-green-50 ring-green-600/20"
            }`}
          >
            {assignment.role?.name || "Unknown Role"}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-muted-foreground">
          <p className="whitespace-nowrap">
            Assigned on{" "}
            <time dateTime={assignment.assigned_at}>{new Date(assignment.assigned_at).toLocaleDateString()}</time>
          </p>
        </div>
      </div>
      {canManage && (
        <div className="flex flex-none items-center gap-x-2">
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} disabled={isRemoving}>
            <Edit3Icon className="h-4 w-4 mr-1" /> Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isRemoving}>
                {isRemoving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Trash2Icon className="h-4 w-4 mr-1" /> Remove
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  <AlertTriangle className="inline-block mr-2 h-5 w-5 text-destructive" />
                  Are you sure?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This action will remove the user&apos;s assignment to the role &quot;
                  <strong>{assignment.role?.name}</strong>&quot; in the unit &quot;
                  <strong>{assignment.organizational_unit?.name}</strong>&quot;. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRemove} disabled={isRemoving}>
                  {isRemoving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm Removal
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </li>
  )
}
