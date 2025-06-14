"use client"

import { useFormState, useFormStatus } from "react-dom"
import { useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { createCourseAction, type CreateCourseActionState } from "@/app/teacher/courses/actions/create-course-action"
import { useRouter } from "next/navigation"

const initialState: CreateCourseActionState = {
  success: false,
  message: "",
  errors: null,
  courseId: null,
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Creating Course..." : "Create Course"}
    </Button>
  )
}

export function CreateCourseForm({ teacherId }: { teacherId: string }) {
  const { toast } = useToast()
  const router = useRouter()
  const [state, formAction] = useFormState(createCourseAction.bind(null, teacherId), initialState)

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({
          title: "Success",
          description: state.message,
        })
        if (state.courseId) {
          // Redirect to manage course page or add materials page
          router.push(`/teacher/courses/${state.courseId}/manage`)
        } else {
          // Optionally, clear form here if not redirecting
          // Or redirect to a course list page
          router.push("/teacher/courses")
        }
      } else {
        toast({
          title: "Error",
          description: state.message || "Failed to create course.",
          variant: "destructive",
        })
      }
    }
  }, [state, toast, router])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Create New Course</CardTitle>
        <CardDescription>Define the basic details for your new course.</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Course Title</Label>
            <Input id="title" name="title" placeholder="e.g., Grade 10 Mathematics" required />
            {state.errors?.title && <p className="text-sm text-destructive">{state.errors.title}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Course Description (Optional)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Provide a brief overview of the course content and objectives."
              rows={4}
            />
            {state.errors?.description && <p className="text-sm text-destructive">{state.errors.description}</p>}
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
