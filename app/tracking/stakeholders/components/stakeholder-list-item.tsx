"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Loader2, User, Briefcase, Mail, Phone, BarChart, Heart, Handshake } from "lucide-react"
import type { ImplementationStakeholder } from "../types"
import { deleteStakeholderAction, type StakeholderActionState } from "../../dashboard/actions"
import { useToast } from "@/hooks/use-toast"
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

interface StakeholderListItemProps {
  stakeholder: ImplementationStakeholder
  onEdit: (stakeholder: ImplementationStakeholder) => void
  onDeleted: (stakeholderId: string) => void
}

const levelColors: Record<string, string> = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-yellow-100 text-yellow-700",
  Low: "bg-green-100 text-green-700",
}

export function StakeholderListItem({ stakeholder, onEdit, onDeleted }: StakeholderListItemProps) {
  const { toast } = useToast()
  const [isDeleting, startDeleteTransition] = useTransition()
  const [isAlertOpen, setIsAlertOpen] = useState(false)

  const handleDelete = () => {
    startDeleteTransition(async () => {
      const result: StakeholderActionState = await deleteStakeholderAction(stakeholder.id)
      if (result.success) {
        toast({ title: "Stakeholder Deleted", description: result.message })
        onDeleted(stakeholder.id)
        setIsAlertOpen(false)
      } else {
        toast({ title: "Error Deleting Stakeholder", description: result.message, variant: "destructive" })
      }
    })
  }

  return (
    <Card className="mb-4 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-semibold">{stakeholder.stakeholder_name}</CardTitle>
            {stakeholder.stakeholder_type && (
              <CardDescription className="flex items-center text-sm text-gray-500">
                <Briefcase className="w-4 h-4 mr-1.5" />
                {stakeholder.stakeholder_type}
              </CardDescription>
            )}
          </div>
          {stakeholder.role_in_implementation && (
            <Badge variant="secondary">{stakeholder.role_in_implementation}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          {stakeholder.contact_person && (
            <div className="flex items-center">
              <User className="w-4 h-4 mr-2 text-gray-500" />
              <span>{stakeholder.contact_person}</span>
            </div>
          )}
          {stakeholder.email && (
            <div className="flex items-center">
              <Mail className="w-4 h-4 mr-2 text-gray-500" />
              <a href={`mailto:${stakeholder.email}`} className="text-blue-600 hover:underline">
                {stakeholder.email}
              </a>
            </div>
          )}
          {stakeholder.phone && (
            <div className="flex items-center">
              <Phone className="w-4 h-4 mr-2 text-gray-500" />
              <span>{stakeholder.phone}</span>
            </div>
          )}
        </div>
        <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stakeholder.influence_level && (
            <div className="flex items-center">
              <BarChart className="w-4 h-4 mr-2 text-gray-500" />
              <span>Influence:</span>
              <Badge variant="outline" className={`ml-2 ${levelColors[stakeholder.influence_level]}`}>
                {stakeholder.influence_level}
              </Badge>
            </div>
          )}
          {stakeholder.interest_level && (
            <div className="flex items-center">
              <Heart className="w-4 h-4 mr-2 text-gray-500" />
              <span>Interest:</span>
              <Badge variant="outline" className={`ml-2 ${levelColors[stakeholder.interest_level]}`}>
                {stakeholder.interest_level}
              </Badge>
            </div>
          )}
          {stakeholder.engagement_level && (
            <div className="flex items-center">
              <Handshake className="w-4 h-4 mr-2 text-gray-500" />
              <span>Engagement:</span>
              <Badge variant="outline" className="ml-2">
                {stakeholder.engagement_level}
              </Badge>
            </div>
          )}
        </div>
        {stakeholder.contribution_summary && (
          <div className="mt-3">
            <h4 className="text-xs font-semibold text-gray-600">Contribution</h4>
            <p className="text-sm text-gray-700">{stakeholder.contribution_summary}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2 border-t pt-3 pb-3">
        <Button variant="outline" size="sm" onClick={() => onEdit(stakeholder)}>
          <Edit className="mr-1.5 h-3.5 w-3.5" /> Edit
        </Button>
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the stakeholder "{stakeholder.stakeholder_name}"? This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  )
}
