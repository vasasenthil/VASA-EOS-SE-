"use client"

import { useFormState, useFormStatus } from "react-dom"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useEffect } from "react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { loginAction, type LoginState } from "./actions"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Signing In..." : "Sign In"}
    </Button>
  )
}

// Define roles for the dropdown
const userRoles = [
  { value: "STUDENT", label: "Student" },
  { value: "TEACHER", label: "Teacher" },
  { value: "PRINCIPAL", label: "Principal" },
  { value: "SUBJECT_INCHARGE", label: "Subject Incharge" },
  { value: "ACADEMIC_HEAD", label: "Academic Head" },
  { value: "INSTITUTION_HEAD", label: "Institution Head" },
  { value: "ADMIN", label: "System Admin" }, // Assuming 'ADMIN' maps to System Admin
]

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const errorParam = searchParams.get("error")
  const messageParam = searchParams.get("message")

  const initialState: LoginState = { success: false, message: "", errors: null, redirectPath: null }
  const [state, formAction] = useFormState(loginAction, initialState)

  useEffect(() => {
    if (state.success && state.redirectPath) {
      toast({ title: "Login Successful", description: state.message })
      router.push(state.redirectPath)
    } else if (!state.success && state.message && state.message !== "") {
      if (
        state.errors ||
        state.message.toLowerCase().includes("failed") ||
        state.message.toLowerCase().includes("error")
      ) {
        toast({
          title: "Login Failed",
          description: state.message,
          variant: "destructive",
        })
      }
    }
  }, [state, router, toast])

  useEffect(() => {
    if (errorParam) {
      let description = "An unknown error occurred."
      if (errorParam === "profile_not_found") description = "User profile not found. Please contact support."
      if (errorParam === "unknown_role") description = "User role is not recognized. Please contact support."
      if (errorParam === "profile_fetch_failed") description = "Failed to load user profile. Please try again."
      if (errorParam === "session_expired") description = "Your session has expired. Please log in again."
      toast({
        title: "Login Required",
        description: description,
        variant: "destructive",
      })
    }
    if (messageParam) {
      toast({
        title: "Information",
        description: messageParam,
      })
    }
  }, [errorParam, messageParam, toast])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <Image src="/logos/vasa-logo.png" alt="VASA Logo" width={60} height={60} className="mx-auto mb-4" />
          <CardTitle className="text-2xl">VASA-EOS (SE) Platform</CardTitle>
          <CardDescription>Sign in to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {state.message && !state.success && state.errors?._general && (
              <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Login Error</AlertTitle>
                <AlertDescription>{state.errors._general}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="m@example.com" required />
              {state.errors?.email && <p className="text-xs text-red-500">{state.errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
              {state.errors?.password && <p className="text-xs text-red-500">{state.errors.password}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Sign in as</Label>
              <Select name="role" defaultValue="STUDENT" required>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  {userRoles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state.errors?.role && <p className="text-xs text-red-500">{state.errors.role}</p>}
            </div>
            <SubmitButton />
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2">
          <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
            Forgot your password?
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
