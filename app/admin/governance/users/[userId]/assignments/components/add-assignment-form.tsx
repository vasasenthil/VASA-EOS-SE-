"use client"

import { useEffect, useRef } from "react"
import { useActionState } from "react"
import { assignUserToOuAction } from "@/app/governance/user-assignments/actions"
import type { OrganizationalUnit, Role } from "@/app/governance/types"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface AddAssignmentFormProps {
  userId: string
  organizationalUnits: OrganizationalUnit[]
  roles: Role[]
}

export function AddAssignmentForm({ userId, organizationalUnits, roles }: AddAssignmentFormProps) {
  const [state, formAction, isPending] = useActionState(assignUserToOuAction, {
    success: false,
    message: "",
  })
  const { toast } = useToast()
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? "Success" : "Error",
        description: state.message,
        variant: state.success ? "default" : "destructive",
      })
      if (state.success) {
        formRef.current?.reset()
      }
    }
  }, [state, toast])

  return (
    <form ref={formRef} action={formAction} className="grid gap-4">
      <input type="hidden" name="user_id" value={userId} />
      <div className="grid gap-2">
        <Label htmlFor="ou_id">Organizational Unit</Label>
        <Select name="ou_id" required>
          <SelectTrigger>
            <SelectValue placeholder="Select a unit..." />
          </SelectTrigger>
          <SelectContent>
            {organizationalUnits.map((ou) => (
              <SelectItem key={ou.id} value={ou.id}>
                {ou.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state.errors?.ou_id && <p className="text-sm text-destructive">{state.errors.ou_id}</p>}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="role_id">Role</Label>
        <Select name="role_id" required>
          <SelectTrigger>
            <SelectValue placeholder="Select a role..." />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.id} disabled={role.is_system_role}>
                {role.name} {role.is_system_role && "(System)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state.errors?.role_id && <p className="text-sm text-destructive">{state.errors.role_id}</p>}
      </div>
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Assign Role
      </Button>
    </form>
  )
}
