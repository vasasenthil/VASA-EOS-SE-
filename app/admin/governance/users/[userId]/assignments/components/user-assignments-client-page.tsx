"use client"

import type { AuthUser, OrganizationalUnit, Role, UserOUAssignment } from "@/app/governance/types"
import { AddAssignmentForm } from "./add-assignment-form"
import { AssignmentListItem } from "./assignment-list-item"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface UserAssignmentsClientPageProps {
  user: AuthUser
  initialAssignments: UserOUAssignment[]
  organizationalUnits: OrganizationalUnit[]
  roles: Role[]
  canManage: boolean
}

export default function UserAssignmentsClientPage({
  user,
  initialAssignments,
  organizationalUnits,
  roles,
  canManage,
}: UserAssignmentsClientPageProps) {
  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Assignments</CardTitle>
            <CardDescription>This user is currently assigned to the following units and roles.</CardDescription>
          </CardHeader>
          <CardContent>
            {initialAssignments.length > 0 ? (
              <div className="flow-root">
                <ul role="list" className="-my-4 divide-y divide-border">
                  {initialAssignments.map((assignment) => (
                    <AssignmentListItem key={assignment.id} assignment={assignment} canManage={canManage} />
                  ))}
                </ul>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p>No assignments found for this user.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {canManage && (
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Add New Assignment</CardTitle>
              <CardDescription>Assign the user to a new unit with a specific role.</CardDescription>
            </CardHeader>
            <CardContent>
              <AddAssignmentForm
                userId={user.id}
                organizationalUnits={organizationalUnits}
                roles={roles}
                // Filter out OUs the user is already in to prevent duplicate assignments
                // Note: A user can have multiple roles in the same OU, so this logic might need adjustment
                // based on business rules. For now, we allow it.
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
