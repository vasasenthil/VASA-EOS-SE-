// app/(dashboards)/parent/layout.tsx
// Parent portal layout — uses the shared DashboardsLayout which injects Sidebar for PARENT role
export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
