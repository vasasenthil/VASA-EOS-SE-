"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerPopoverProps {
  date: string | undefined // Date as YYYY-MM-DD string or undefined
  onSelectDate: (date: string | undefined) => void // Callback with YYYY-MM-DD string or undefined
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DatePickerPopover({
  date,
  onSelectDate,
  placeholder = "Pick a date",
  className,
  disabled,
}: DatePickerPopoverProps) {
  const [popoverOpen, setPopoverOpen] = React.useState(false)

  // Convert YYYY-MM-DD string to Date object for the Calendar component
  const selectedDateObject = date ? new Date(date + "T00:00:00") : undefined // Ensure correct parsing by adding time

  const handleDateSelect = (selectedDay: Date | undefined) => {
    if (selectedDay) {
      onSelectDate(format(selectedDay, "yyyy-MM-dd"))
    } else {
      onSelectDate(undefined) // Allow clearing the date
    }
    setPopoverOpen(false)
  }

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground", className)}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(selectedDateObject!, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selectedDateObject}
          onSelect={handleDateSelect}
          initialFocus
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  )
}
