"use client"

import { useState, useEffect, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle, Edit, Trash2, ChevronDown, ChevronRight, AlertTriangle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import type { OrganizationalUnit, GovernanceTier } from "@/app/governance/types"
import {
  getOrganizationalUnitsAction,
  deleteOrganizationalUnitAction,
  getGovernanceTiersAction,
} from "@/app/governance/organizational-units/actions"
import { OUForm } from "./ou-form"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// We'll pass userId as a prop or fetch on server for initial check.

interface OUClientPageProps {
  initialOUs: OrganizationalUnit[]
  initialTiers: GovernanceTier[]
  userId: string | null // For permission checks
  canManageOUs: boolean // Pre-checked permission for initial render
}

export default function OUClientPage({ initialOUs, initialTiers, userId, canManageOUs }: OUClientPageProps) {
  const [ous, setOUs] = useState<OrganizationalUnit[]>(initialOUs)
  const [tiers, setTiers] = useState<GovernanceTier[]>(initialTiers)
  const [isPending, startTransition] = useTransition()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingOU, setEditingOU] = useState<OrganizationalUnit | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<OrganizationalUnit | null>(null)

  const [expandedTiers, setExpandedTiers] = useState<Record<number, boolean>>({})

  useEffect(() => {
    setOUs(initialOUs)
  }, [initialOUs])

  useEffect(() => {
    setTiers(initialTiers)
  }, [initialTiers])

  const refreshOUs = async () => {
    startTransition(async () => {
      const result = await getOrganizationalUnitsAction({ includeTier: true, includeUserCount: true })
      if (result.success && result.data) {
        setOUs(result.data)
      } else {
        toast({ title: "Error", description: result.error || "Failed to refresh OUs.", variant: "destructive" })
      }
      const tiersResult = await getGovernanceTiersAction()
      if (tiersResult.success && tiersResult.data) {
        setTiers(tiersResult.data)
      }
    })
  }

  const handleFormSubmit = async () => {
    setIsFormOpen(false)
    setEditingOU(null)
    await refreshOUs()
  }

  const openEditForm = (ou: OrganizationalUnit) => {
    setEditingOU(ou)
    setIsFormOpen(true)
  }

  const handleDeleteOU = (ou: OrganizationalUnit) => {
    if (!userId || !canManageOUs) {
      toast({ title: "Permission Denied", description: "You cannot delete OUs.", variant: "destructive" })
      return
    }
    setShowDeleteConfirm(ou)
  }

  const confirmDelete = () => {
    if (!showDeleteConfirm || !userId || !canManageOUs) return

    startTransition(async () => {
      const result = await deleteOrganizationalUnitAction(showDeleteConfirm.id)
      if (result.success) {
        toast({ title: "Success", description: result.message })
        await refreshOUs()
      } else {
        toast({ title: "Error", description: result.error || "Failed to delete OU.", variant: "destructive" })
      }
      setShowDeleteConfirm(null)
    })
  }

  const toggleTierExpansion = (tierId: number) => {
    setExpandedTiers((prev) => ({ ...prev, [tierId]: !prev[tierId] }))
  }

  const groupedOUsByTier = tiers
    .map((tier) => ({
      ...tier,
      ous: ous.filter((ou) => ou.tier_id === tier.id),
    }))
    .filter((group) => group.ous.length > 0)

  if (!canManageOUs && ous.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-yellow-500" /> No Organizational Units
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>There are no Organizational Units configured, or you do not have permission to view them.</p>
          {canManageOUs && (
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button className="mt-4">
                  <PlusCircle className="mr-2 h-4 w-4" /> Create First OU
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>{editingOU ? "Edit" : "Create"} Organizational Unit</DialogTitle>
                  <DialogDescription>
                    {editingOU ? "Modify the details of the existing OU." : "Add a new OU to the governance structure."}
                  </DialogDescription>
                </DialogHeader>
                <OUForm
                  key={editingOU ? editingOU.id : "new"}
                  tiers={tiers}
                  allOUs={ous} // For parent selection
                  initialData={editingOU}
                  onSuccess={handleFormSubmit}
                  onCancel={() => {
                    setIsFormOpen(false)
                    setEditingOU(null)
                  }}
                  userId={userId}
                />
              </DialogContent>
            </Dialog>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Organizational Units</h1>
        {canManageOUs && (
          <Dialog
            open={isFormOpen}
            onOpenChange={(isOpen) => {
              setIsFormOpen(isOpen)
              if (!isOpen) setEditingOU(null)
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Create OU
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{editingOU ? "Edit" : "Create"} Organizational Unit</DialogTitle>
                <DialogDescription>
                  {editingOU ? "Modify the details of the existing OU." : "Add a new OU to the governance structure."}
                </DialogDescription>
              </DialogHeader>
              <OUForm
                key={editingOU ? editingOU.id : "new"}
                tiers={tiers}
                allOUs={ous}
                initialData={editingOU}
                onSuccess={handleFormSubmit}
                onCancel={() => {
                  setIsFormOpen(false)
                  setEditingOU(null)
                }}
                userId={userId}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!canManageOUs && (
        <p className="text-orange-600 flex items-center">
          <AlertTriangle className="mr-2 h-4 w-4" /> You do not have permission to manage Organizational Units. View
          only.
        </p>
      )}

      {groupedOUsByTier.length === 0 && canManageOUs && (
        <p>No Organizational Units found. Click "Create OU" to add the first one.</p>
      )}

      {groupedOUsByTier.map((tierGroup) => (
        <Card key={tierGroup.id}>
          <CardHeader className="cursor-pointer hover:bg-muted/50" onClick={() => toggleTierExpansion(tierGroup.id)}>
            <CardTitle className="flex items-center justify-between text-xl">
              {tierGroup.name} ({tierGroup.ous.length})
              {expandedTiers[tierGroup.id] || tierGroup.ous.length === 0 ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </CardTitle>
          </CardHeader>
          {(expandedTiers[tierGroup.id] || (tierGroup.ous.length === 0 && tierGroup.id === tiers[0]?.id)) &&
            tierGroup.ous.length > 0 && (
              <CardContent className="pt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Parent OU</TableHead>
                      <TableHead>Region Code</TableHead>
                      <TableHead>Users</TableHead>
                      {canManageOUs && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tierGroup.ous.map((ou) => {
                      const parentOU = ous.find((p) => p.id === ou.parent_ou_id)
                      return (
                        <TableRow key={ou.id}>
                          <TableCell className="font-medium">{ou.name}</TableCell>
                          <TableCell>
                            {parentOU ? parentOU.name : <span className="text-muted-foreground">-</span>}
                          </TableCell>
                          <TableCell>{ou.region_code || <span className="text-muted-foreground">-</span>}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{ou.user_count || 0}</Badge>
                          </TableCell>
                          {canManageOUs && (
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => openEditForm(ou)} className="mr-2">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteOU(ou)}
                                className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            )}
          {(expandedTiers[tierGroup.id] || (tierGroup.ous.length === 0 && tierGroup.id === tiers[0]?.id)) &&
            tierGroup.ous.length === 0 &&
            canManageOUs && (
              <CardContent>
                <p className="text-muted-foreground py-4">No OUs in this tier yet.</p>
              </CardContent>
            )}
        </Card>
      ))}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the Organizational Unit: <strong>{showDeleteConfirm.name}</strong>? This
                action cannot be undone. Make sure no users or child OUs are still assigned here.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
                  Cancel
                </Button>
              </DialogClose>
              <Button variant="destructive" onClick={confirmDelete} disabled={isPending}>
                {isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
