"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { type ImplementationMilestone, MILESTONE_STATUSES } from "../types"
import type { FormAction } from "@/app/tracking/challenges/types" // Re-use FormAction type
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"

const milestoneFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }).max(200),
  description: z.string().optional(),
  target_date: z.date({ required_error: "Target date is required." }),
  status: z.enum(MILESTONE_STATUSES),
  actual_completion_date: z.date().optional().nullable(),
  notes: z.string().optional(),
})

export type MilestoneFormValues = z.infer<typeof milestoneFormSchema>

interface MilestoneFormProps {
  implementationStatusId: string
  milestone?: ImplementationMilestone
  actionFn: (
    data: MilestoneFormValues,
    implementationStatusId: string,
    milestoneId?: string,
  ) => Promise<{ success: boolean; message: string; data?: ImplementationMilestone }>
  formAction: FormAction
  onSuccess: (milestone: ImplementationMilestone) => void
  onCancel?: () => void
}

export function MilestoneForm({
  implementationStatusId,
  milestone,
  actionFn,
  formAction,
  onSuccess,
  onCancel,
}: MilestoneFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const defaultValues: Partial<MilestoneFormValues> = milestone
    ? {
        ...milestone,
        target_date: milestone.target_date ? new Date(milestone.target_date) : undefined,
        actual_completion_date: milestone.actual_completion_date ? new Date(milestone.actual_completion_date) : null,
      }
    : {
        status: "PLANNED",
      }

  const form = useForm<MilestoneFormValues>({
    resolver: zodResolver(milestoneFormSchema),
    defaultValues,
  })

  async function onSubmit(values: MilestoneFormValues) {
    setIsSubmitting(true)
    try {
      const result = await actionFn(values, implementationStatusId, milestone?.id)
      if (result.success && result.data) {
        toast({
          title: formAction === "create" ? "Milestone Created" : "Milestone Updated",
          description: result.message,
        })
        onSuccess(result.data)
        if (formAction === "create") {
          form.reset({
            status: "PLANNED",
            title: "",
            description: "",
            notes: "",
            target_date: undefined,
            actual_completion_date: null,
          })
        }
      } else {
        toast({
          title: "Error",
          description: result.message || "An unexpected error occurred.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="E.g., Phase 1 Completion" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Detailed description of the milestone" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="target_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Target Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {MILESTONE_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="actual_completion_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Actual Completion Date (Optional)</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                    >
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Any relevant notes for this milestone" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {formAction === "create" ? "Add Milestone" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
