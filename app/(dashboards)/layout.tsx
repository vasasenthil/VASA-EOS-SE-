// app/(dashboards)/layout.tsx
export const dynamic = 'force-dynamic'; // Add this line

// ... rest of your layout code
export default async function DashboardsLayout({ children }: { children: React.ReactNode }) {
  // ...
  return (
    <div>
      {children}
    </div>
  );
}
