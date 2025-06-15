import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Users,
  UserCog,
  Building,
  Settings,
  ClipboardList,
  BarChart3,
  Award,
  Folder,
  Target,
  ShieldCheck,
  BookMarked,
  GraduationCap,
  Presentation,
  Landmark,
  Network,
  Database,
  FileLock,
  Palette,
  Layers,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  label?: string
  disabled?: boolean
  external?: boolean
  items?: NavItem[]
  isHeader?: boolean
}

export const dashboardNavConfig: Record<string, NavItem[]> = {
  ADMIN: [
    { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { title: "User Management", href: "/admin/users", icon: Users }, // Assuming this path exists or will be created
    { title: "Role & Permissions", href: "/admin/roles", icon: UserCog }, // Assuming this path exists
    { title: "Organizational Units", href: "/admin/ous", icon: Building }, // Assuming this path exists
    { title: "System Configuration", href: "/admin/settings/system", icon: Settings },
    {
      title: "Data Management",
      href: "/admin/data",
      icon: Database,
      items: [
        { title: "Backups", href: "/admin/data/backups", icon: Database },
        { title: "Integrity Checks", href: "/admin/data/integrity", icon: ShieldCheck },
      ],
    },
    {
      title: "Security & Audit",
      href: "/admin/security",
      icon: FileLock,
      items: [
        { title: "Audit Logs", href: "/admin/security/audit-logs", icon: FileText },
        { title: "Access Control", href: "/admin/security/access-control", icon: ShieldCheck },
      ],
    },
    { title: "Platform Customization", href: "/admin/customize", icon: Palette },
    { title: "Policies Management", href: "/policies", icon: FileText },
    { title: "Schemes Management", href: "/schemes", icon: Layers },
  ],
  TEACHER: [
    { title: "Dashboard", href: "/teacher/dashboard", icon: LayoutDashboard },
    {
      title: "My Courses",
      href: "/teacher/courses", // Main link for viewing courses
      icon: BookOpen,
      items: [
        { title: "Create Course", href: "/teacher/courses/create", icon: BookMarked }, // Specific action
        // { title: "View All Courses", href: "/teacher/courses", icon: BookOpen }, // Redundant if parent is the view
      ],
    },
    { title: "Student Management", href: "/teacher/students", icon: Users },
    { title: "Assignments", href: "/teacher/assignments", icon: ClipboardList },
    { title: "Gradebook", href: "/teacher/gradebook", icon: BarChart3 },
    { title: "Resources", href: "/teacher/resources", icon: Folder },
    { title: "Reports", href: "/teacher/reports", icon: BarChart3 },
  ],
  STUDENT: [
    { title: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
    { title: "My Courses", href: "/student/courses", icon: BookOpen }, // This is the page we just built
    { title: "Assignments", href: "/student/assignments", icon: ClipboardList },
    { title: "My Grades", href: "/student/grades", icon: Award },
    { title: "Resources", href: "/student/resources", icon: Folder },
    { title: "Announcements", href: "/student/announcements", icon: Presentation },
  ],
  PRINCIPAL: [
    { title: "Dashboard", href: "/principal/dashboard", icon: LayoutDashboard },
    {
      title: "Staff Management",
      href: "/principal/staff",
      icon: Users,
      items: [
        { title: "View Staff", href: "/principal/staff/view", icon: Users },
        { title: "Assign Roles", href: "/principal/staff/assign-roles", icon: UserCog },
      ],
    },
    {
      title: "Student Management",
      href: "/principal/students",
      icon: GraduationCap,
      items: [
        { title: "View Students", href: "/principal/students/view", icon: Users },
        { title: "Academic Progress", href: "/principal/students/progress", icon: BarChart3 },
      ],
    },
    {
      title: "Academic Oversight",
      href: "/principal/academics",
      icon: BookMarked,
      items: [
        { title: "Course Offerings", href: "/principal/academics/courses", icon: BookOpen },
        { title: "Curriculum Status", href: "/principal/academics/curriculum", icon: FileText },
      ],
    },
    { title: "School Announcements", href: "/principal/announcements", icon: Presentation },
    {
      title: "Reports",
      href: "/principal/reports",
      icon: BarChart3,
      items: [
        { title: "Attendance Reports", href: "/principal/reports/attendance", icon: BarChart3 },
        { title: "Performance Reports", href: "/principal/reports/performance", icon: BarChart3 },
      ],
    },
  ],
  SUBJECT_INCHARGE: [
    // ... (ensure icons are imported and used directly)
    { title: "Dashboard", href: "/subject-incharge/dashboard", icon: LayoutDashboard },
    { title: "Curriculum Management", href: "/subject-incharge/curriculum", icon: BookMarked },
    { title: "Resource Allocation", href: "/subject-incharge/resources", icon: Folder },
    { title: "Teacher Coordination", href: "/subject-incharge/teachers", icon: Users },
    { title: "Student Performance", href: "/subject-incharge/students/performance", icon: BarChart3 },
  ],
  ACADEMIC_HEAD: [
    // ... (ensure icons are imported and used directly)
    { title: "Dashboard", href: "/academic-head/dashboard", icon: LayoutDashboard },
    { title: "Curriculum Development", href: "/academic-head/curriculum", icon: BookMarked },
    { title: "Assessment & Evaluation", href: "/academic-head/assessment", icon: ClipboardList },
    { title: "Teacher PD", href: "/academic-head/teacher-dev", icon: GraduationCap },
    { title: "Academic Planning", href: "/academic-head/planning", icon: Target },
  ],
  INSTITUTION_HEAD: [
    // ... (ensure icons are imported and used directly)
    { title: "Dashboard", href: "/institution-head/dashboard", icon: LayoutDashboard },
    { title: "Strategic Planning", href: "/institution-head/strategy", icon: Target },
    { title: "Policy Management", href: "/institution-head/policies", icon: FileText }, // Assuming this path exists
    { title: "Stakeholder Management", href: "/institution-head/stakeholders", icon: Network },
    { title: "Resource Management", href: "/institution-head/resources", icon: Landmark },
  ],
  // Add other roles if necessary, ensuring all icons are imported from lucide-react
}
