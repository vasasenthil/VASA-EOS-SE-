"use client"

import { useFormState, useFormStatus } from "react-dom"
import { useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { registerUserAction, type RegisterUserActionState } from "@/app/admin/users/actions/register-user-action" // We'll create this action next

const initialState: RegisterUserActionState = {
  success: false,
  message: "",
  errors: null,
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Creating User..." : "Create User"}
    </Button>
  )
}

export function RegisterUserForm({ schoolId }: { schoolId: string }) {
  const { toast } = useToast()
  const [state, formAction] = useFormState(registerUserAction.bind(null, schoolId), initialState)

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({
          title: "Success",
          description: state.message,
        })
        // Optionally, redirect or clear form here
      } else {
        toast({
          title: "Error",
          description: state.message || "Failed to create user.",
          variant: "destructive",
        })
      }
    }
  }, [state, toast])

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Register New User</CardTitle>
        <CardDescription>Add a new student or teacher to your school.</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" name="fullName" placeholder="Enter user's full name" required />
            {state.errors?.fullName && <p className="text-sm text-destructive">{state.errors.fullName}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="user@example.com" required />
            {state.errors?.email && <p className="text-sm text-destructive">{state.errors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" placeholder="Enter a strong password" required />
            {state.errors?.password && <p className="text-sm text-destructive">{state.errors.password}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select name="role" required>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STUDENT">Student</SelectItem>
                <SelectItem value="TEACHER">Teacher</SelectItem>
              </SelectContent>
            </Select>
            {state.errors?.role && <p className="text-sm text-destructive">{state.errors.role}</p>}
          </div>
          {state.errors?._general && <p className="text-sm text-destructive">{state.errors._general}</p>}
        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </form>
    </Card>
  )
}
