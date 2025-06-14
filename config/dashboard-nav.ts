import { Users, FileText, BookOpen, Building, UserCog, Layers, LayoutDashboard } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  label?: string
  disabled?: boolean
  external?: boolean
  items?: NavItem[] // For sub-navigation
}

export const dashboardNavConfig: Record<string, NavItem[]> = {
  ADMIN: [
    { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { title: "User Management", href: "/admin/governance/users", icon: Users }, // Updated path
    { title: "Role Management", href: "/admin/governance/roles", icon: UserCog }, // Updated path
    { title: "OUs Management", href: "/admin/governance/organizational-units", icon: Building }, // Updated path
    { title: "Policies", href: "/policies", icon: FileText }, // Assuming policies are top-level or admin-managed
    { title: "Schemes", href: "/schemes", icon: Layers }, // Assuming schemes are top-level or admin-managed
    // { title: "System Settings", href: "/admin/settings", icon: Settings },
  ],
  TEACHER: [
    { title: "Dashboard", href: "/teacher/dashboard", icon: LayoutDashboard },
    { title: "My Courses", href: "/teacher/courses", icon: BookOpen },
    // { title: "Students", href: "/teacher/students", icon: Users },
    // { title: "Assignments", href: "/teacher/assignments", icon: ClipboardList },
    // { title: "Gradebook", href: "/teacher/gradebook", icon: BarChart3 },
  ],
  STUDENT: [
    { title: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
    // { title: "My Courses", href: "/student/courses", icon: BookOpen },
    // { title: "Assignments", href: "/student/assignments", icon: ClipboardList },
    // { title: "My Grades", href: "/student/grades", icon: Award },
    // { title: "Resources", href: "/student/resources", icon: Folder },
  ],
}
