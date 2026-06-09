"use client"

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
import { PORTALS } from "@/config/portals"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"
import { useActionState } from "react"

function SubmitButton({ isPending }: { isPending: boolean }) {
  // const { pending } = useFormStatus() // Remove this line
  return (
    <Button type="submit" className="w-full" disabled={isPending}>
      {isPending ? "Signing In..." : "Sign In"}
    </Button>
  )
}

// Roles for the dropdown — derived from the portal registry (single source of truth)
// so every governance-hierarchy role is selectable, ordered by tier.
const TIER_ORDER: Record<string, number> = {
  state: 0,
  national: 1,
  directorate: 2,
  district: 3,
  block: 4,
  cluster: 5,
  school: 6,
  public: 7,
}
const userRoles = Object.values(PORTALS)
  .slice()
  .sort((a, b) => (TIER_ORDER[a.tier] ?? 99) - (TIER_ORDER[b.tier] ?? 99))
  .map((p) => ({ value: p.role, label: p.label }))

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const errorParam = searchParams.get("error")
  const messageParam = searchParams.get("message")

  const initialState: LoginState = { success: false, message: "", errors: null, redirectPath: null }
  const [state, formAction, isFormPending] = useActionState(loginAction, initialState)

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
            <SubmitButton isPending={isFormPending} />
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
