"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { useActionState } from "react"
import { updateUserAssignmentAction } from "@/app/governance/user-assignments/actions"
import type { Role, UserOUAssignment } from "@/app/governance/types"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, SaveIcon, XIcon } from "lucide-react"
import { Input } from "@/components/ui/input" // For displaying OU name

interface EditAssignmentFormProps {
  assignment: UserOUAssignment
  allRoles: Role[]
  onCancel: () => void
  onSaved: () => void // To potentially refresh or close form after successful save
}

export function EditAssignmentForm({ assignment, allRoles, onCancel, onSaved }: EditAssignmentFormProps) {
  const [state, formAction, isPending] = useActionState(updateUserAssignmentAction.bind(null, assignment.id), {
    success: false,
    message: "",
  })
  const { toast } = useToast()
  const formRef = useRef<HTMLFormElement>(null)
  const [selectedRoleId, setSelectedRoleId] = useState(assignment.role_id)

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? "Success" : "Error",
        description: state.message,
        variant: state.success ? "default" : "destructive",
      })
      if (state.success) {
        onSaved() // Call the onSaved callback, which might close the form or revalidate
      }
    }
  }, [state, toast, onSaved])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    // We only need to pass role_id and is_primary_assignment if it's being changed.
    // For this form, we are only changing role_id.
    // The action `updateUserAssignmentAction` expects the assignmentId as the first param (bound)
    // and an object with `role_id` and/or `is_primary_assignment` as the second.
    formAction({ role_id: formData.get("role_id") as string })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 py-4">
      <div>
        <Label htmlFor="ou_name">Organizational Unit</Label>
        <Input id="ou_name" value={assignment.organizational_unit?.name || "N/A"} readOnly disabled />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="role_id">Role</Label>
        <Select name="role_id" value={selectedRoleId} onValueChange={setSelectedRoleId} required>
          <SelectTrigger>
            <SelectValue placeholder="Select a role..." />
          </SelectTrigger>
          <SelectContent>
            {allRoles.map((role) => (
              <SelectItem key={role.id} value={role.id} disabled={role.is_system_role}>
                {role.name} {role.is_system_role && "(System)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state.errors?.role_id && <p className="text-sm text-destructive">{state.errors.role_id}</p>}
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          <XIcon className="mr-2 h-4 w-4" /> Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SaveIcon className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </div>
      {state.errors?._general && <p className="mt-2 text-sm text-destructive">{state.errors._general}</p>}
    </form>
  )
}
