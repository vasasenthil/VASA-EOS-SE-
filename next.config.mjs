/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone server output for containerised / sovereign-cloud deployment
  // (produces .next/standalone with a minimal node server + traced deps).
  output: "standalone",
  eslint: {
    // Optionally, you can also set this to false during debugging
    // ignoreDuringBuilds: false, 
  },
  typescript: {
    ignoreBuildErrors: false, // Changed to false
  },
  // If you had a top-level ignoreBuildErrors, remove it or set to false
  // ignoreBuildErrors: false, 
  images: {
    unoptimized: true,
  },
  // Consolidation (Task 3): the reference-UI routes below are thin duplicates of a durable, backbone-wired module
  // covering the same domain — make the durable route canonical. Only routes with NO unique feature are redirected;
  // pages with unique widgets (/timetable substitution, /postings counselling, /hostel mess-checklist, /procurement
  // inventory, /procurement-approvals sanction, /smc DAO, /grievance redressal) are intentionally NOT redirected to
  // avoid losing features. The redirected page files are preserved in-repo (this is reversible routing only).
  async redirects() {
    return [
      { source: "/fees", destination: "/fee-ledger", permanent: false },
      { source: "/cpd", destination: "/teacher-cpd", permanent: false },
      { source: "/staff-attendance", destination: "/employee-attendance", permanent: false },
      { source: "/lesson-plans", destination: "/lesson-plan", permanent: false },
      { source: "/attendance", destination: "/student-attendance", permanent: false },
      { source: "/hostel-allocation", destination: "/hostel-occupancy", permanent: false },
      // substitution ported into the durable Class Timetable module (#11), so /timetable is now a true duplicate.
      { source: "/timetable", destination: "/class-timetable", permanent: false },
    ]
  },
}

export default nextConfig
