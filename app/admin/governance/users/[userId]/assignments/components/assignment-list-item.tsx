"use client"

import { useActionState } from "react"
import { removeUserAssignmentAction } from "@/app/governance/user-assignments/actions"
import type { UserOUAssignment } from "@/app/governance/types"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useEffect } from "react"
import { Loader2, Trash2 } from "lucide-react"

interface AssignmentListItemProps {
  assignment: UserOUAssignment
  canManage: boolean
}

function RemoveAssignmentForm({ assignmentId }: { assignmentId: string }) {
  const [state, formAction, isPending] = useActionState(removeUserAssignmentAction, {
    success: false,
    message: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? "Success" : "Error",
        description: state.message,
        variant: state.success ? "default" : "destructive",
      })
    }
  }, [state, toast])

  return (
    <form action={formAction}>
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <Button type="submit" variant="ghost" size="icon" disabled={isPending}>
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
        )}
        <span className="sr-only">Remove assignment</span>
      </Button>
    </form>
  )
}

export function AssignmentListItem({ assignment, canManage }: AssignmentListItemProps) {
  return (
    <li className="flex items-center justify-between py-4">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">{assignment.organizational_unit?.name}</p>
        <p className="truncate text-sm text-muted-foreground">{assignment.role?.name}</p>
      </div>
      {canManage && <RemoveAssignmentForm assignmentId={assignment.id} />}
    </li>
  )
}
