import {
  Users, Handshake, MessageSquare, Calendar, CheckCircle2,
  Building2, Globe, AlertTriangle, TrendingUp, Phone,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Shell } from "@/components/shell"
import { PageHeader } from "@/components/page-header"

const ministryCoordination = [
  { ministry: "MoHFW", fullName: "Ministry of Health & Family Welfare", liaison: "Sh. R. Verma, Joint Secretary", mous: 3, lastMeeting: "2025-11-12", nextAction: "RBSK Review Meeting Dec 15", status: "Active" },
  { ministry: "MoWCD", fullName: "Ministry of Women & Child Development", liaison: "Ms. S. Iyer, Director", mous: 2, lastMeeting: "2025-11-08", nextAction: "ECCE Convergence Workshop", status: "Active" },
  { ministry: "MoTA", fullName: "Ministry of Tribal Affairs", liaison: "Sh. D. Oraon, Deputy Secretary", mous: 1, lastMeeting: "2025-10-28", nextAction: "Tribal Area School Review", status: "Active" },
  { ministry: "MoSJE", fullName: "Ministry of Social Justice & Empowerment", liaison: "Ms. P. Chauhan, Director", mous: 2, lastMeeting: "2025-11-15", nextAction: "Pre-Matric Scholarship Reconciliation", status: "Active" },
  { ministry: "MSDE", fullName: "Ministry of Skill Development & Entrepreneurship", liaison: "Sh. A. Singh, JS", mous: 1, lastMeeting: "2025-10-20", nextAction: "Vocational Education Linkage Plan", status: "Pending" },
  { ministry: "MoRD", fullName: "Ministry of Rural Development", liaison: "Ms. K. Nair, Director", mous: 1, lastMeeting: "2025-09-30", nextAction: "MGNREGS School Infrastructure Review", status: "Active" },
  { ministry: "DoT", fullName: "Department of Telecommunications", liaison: "Sh. N. Kumar, OSD", mous: 1, lastMeeting: "2025-11-02", nextAction: "BharatNet School Connectivity Status", status: "Active" },
  { ministry: "DPIIT", fullName: "Dept. for Promotion of Industry & IT", liaison: "Ms. R. Joshi, Director", mous: 0, lastMeeting: "2025-08-15", nextAction: "EdTech Startup in Schools Pilot", status: "Under Review" },
]

const ngoPartners = [
  { name: "Azim Premji Foundation", focus: "Teacher Quality & Rural Education", coverage: "48 schools", budget: "₹3.2Cr", status: "Active", contact: "Dr. V. Pillai" },
  { name: "Pratham Education Foundation", focus: "Foundational Literacy (ASER, Read India)", coverage: "All 248 schools", budget: "₹1.8Cr", status: "Active", contact: "Ms. A. Singh" },
  { name: "Child Rights & You (CRY)", focus: "OoSC Reintegration & Child Protection", coverage: "32 schools", budget: "₹0.9Cr", status: "Active", contact: "Ms. P. Verma" },
  { name: "Akshaya Patra Foundation", focus: "PM POSHAN — Hot Cooked Meal", coverage: "198 schools", budget: "₹4.6Cr", status: "Active", contact: "Sh. R. Rao" },
  { name: "Teach For India", focus: "Leadership Fellowships in Under-served Schools", coverage: "12 schools", budget: "₹0.6Cr", status: "Active", contact: "Ms. S. Mehta" },
  { name: "Google.org / Google for Education", focus: "Digital Infrastructure, Chromebooks", coverage: "18 schools", budget: "₹1.2Cr", status: "Under Review", contact: "Mr. A. Kumar" },
]

const grievanceStats = [
  { label: "Total Grievances (FY 2025-26)", value: 234, colour: "text-blue-600" },
  { label: "Resolved", value: 198, colour: "text-green-600" },
  { label: "Pending", value: 36, colour: "text-orange-600" },
  { label: "Avg Resolution (days)", value: "4.2", colour: "text-purple-600" },
]

const interactionLog = [
  { date: "2025-11-20", type: "Review Meeting", stakeholder: "MoHFW", topic: "RBSK Annual Health Check Progress", outcome: "Quarterly target met — 94% screening complete", by: "Director" },
  { date: "2025-11-18", type: "Workshop", stakeholder: "Pratham", topic: "NIPUN Bharat Assessment Calibration", outcome: "Revised assessment tools approved for Grade 3-5", by: "Academic Head" },
  { date: "2025-11-15", type: "Consultation", stakeholder: "MoSJE", topic: "Pre-Matric Scholarship Disbursement", outcome: "Pending 847 applications to be cleared by Nov 30", by: "Director" },
  { date: "2025-11-12", type: "Field Visit", stakeholder: "Azim Premji Foundation", topic: "Teacher Mentorship Programme Review", outcome: "15 master trainers nominated for December batch", by: "HR Head" },
  { date: "2025-11-08", type: "Video Conference", stakeholder: "MoWCD", topic: "Anganwadi-School ECCE Transition Protocol", outcome: "SOP finalised — implementation from January 2026", by: "Director" },
  { date: "2025-10-30", type: "Annual Review", stakeholder: "World Bank Education", topic: "STARS Programme M&E Review", outcome: "75% milestone achievement — disbursement approved", by: "Finance Head" },
]

const upcomingEngagements = [
  { date: "2025-12-05", event: "Inter-Ministerial Coordination Meeting (NEP)", venue: "NIC Delhi", participants: "8 Ministries", priority: "High" },
  { date: "2025-12-10", event: "SMC Capacity Building Workshop", venue: "SCERT Auditorium", participants: "248 SMC Chairpersons", priority: "High" },
  { date: "2025-12-15", event: "RBSK Quarterly Review Meeting (MoHFW)", venue: "NHM Delhi Office", participants: "Medical + Education Team", priority: "Medium" },
  { date: "2025-12-20", event: "CSR Partnership Review — NGO Conclave", venue: "State Education HQ", participants: "6 NGO Partners", priority: "Medium" },
  { date: "2026-01-08", event: "Annual Parent Association Convention", venue: "Talkatora Stadium", participants: "5,000 Parents", priority: "High" },
]

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: "bg-green-100 text-green-700 border-green-300",
    Pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
    "Under Review": "bg-blue-100 text-blue-700 border-blue-300",
  }
  return <Badge className={`${map[status] ?? "bg-gray-100 text-gray-700"} border text-xs`}>{status}</Badge>
}

function PriorityBadge({ p }: { p: string }) {
  const map: Record<string, string> = {
    High: "bg-red-100 text-red-700 border-red-300",
    Medium: "bg-yellow-100 text-yellow-700 border-yellow-300",
    Low: "bg-gray-100 text-gray-600 border-gray-300",
  }
  return <Badge className={`${map[p] ?? ""} border text-xs`}>{p}</Badge>
}

export default function InstitutionHeadStakeholdersPage() {
  return (
    <Shell>
      <PageHeader
        title="Stakeholder Management"
        description="Inter-ministerial coordination, NGO partnerships, grievance redressal — Module 70.2c"
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {grievanceStats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6 text-center">
              <p className={`text-3xl font-bold ${s.colour}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ministry Coordination */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-4 w-4 text-blue-600" />Inter-Ministerial Coordination</CardTitle>
          <CardDescription>Active MoUs, liaison officers and next actions across 8 ministries</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ministry</TableHead>
                <TableHead>Liaison Officer</TableHead>
                <TableHead className="text-center">Active MoUs</TableHead>
                <TableHead>Last Meeting</TableHead>
                <TableHead>Next Action</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ministryCoordination.map((m) => (
                <TableRow key={m.ministry}>
                  <TableCell>
                    <p className="font-medium text-sm">{m.ministry}</p>
                    <p className="text-xs text-gray-500">{m.fullName}</p>
                  </TableCell>
                  <TableCell className="text-sm">{m.liaison}</TableCell>
                  <TableCell className="text-center font-medium">{m.mous}</TableCell>
                  <TableCell className="text-sm text-gray-600">{m.lastMeeting}</TableCell>
                  <TableCell className="text-sm">{m.nextAction}</TableCell>
                  <TableCell><StatusBadge status={m.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* NGO & CSR Partners */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Handshake className="h-4 w-4 text-green-600" />NGO & CSR Partnerships</CardTitle>
          <CardDescription>Civil society organisations and corporate partners supporting school education</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organisation</TableHead>
                <TableHead>Focus Area</TableHead>
                <TableHead>Coverage</TableHead>
                <TableHead>Annual Budget</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ngoPartners.map((n) => (
                <TableRow key={n.name}>
                  <TableCell className="font-medium text-sm">{n.name}</TableCell>
                  <TableCell className="text-sm text-gray-700">{n.focus}</TableCell>
                  <TableCell className="text-sm">{n.coverage}</TableCell>
                  <TableCell className="text-sm font-medium text-green-700">{n.budget}</TableCell>
                  <TableCell className="text-sm text-gray-600">{n.contact}</TableCell>
                  <TableCell><StatusBadge status={n.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Interaction Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><MessageSquare className="h-4 w-4 text-purple-600" />Recent Interactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {interactionLog.map((i, idx) => (
                <div key={idx} className="border rounded-md p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{i.type}</span>
                    <span className="text-xs text-gray-400">{i.date}</span>
                  </div>
                  <p className="text-sm font-medium">{i.stakeholder} — {i.topic}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{i.outcome}</p>
                  <p className="text-xs text-gray-400 mt-0.5">By: {i.by}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Engagements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Calendar className="h-4 w-4 text-orange-600" />Upcoming Engagements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingEngagements.map((e, idx) => (
                <div key={idx} className="flex items-start gap-3 border rounded-md p-3">
                  <div className="bg-orange-100 text-orange-700 text-xs font-bold rounded px-2 py-1 text-center min-w-[48px]">
                    {e.date.split("-")[2]}<br />{new Date(e.date).toLocaleString("default", { month: "short" })}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{e.event}</p>
                    <p className="text-xs text-gray-500">{e.venue} · {e.participants}</p>
                  </div>
                  <PriorityBadge p={e.priority} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-4">
          <Globe className="h-5 w-5 mb-2" />
          <p className="font-semibold text-sm">SDG 4 Partnership Goal</p>
          <p className="text-xs opacity-90 mt-1">Multi-stakeholder partnerships aligned with SDG 17 to strengthen quality education delivery</p>
        </div>
        <div className="bg-gradient-to-r from-green-600 to-green-800 text-white rounded-lg p-4">
          <CheckCircle2 className="h-5 w-5 mb-2" />
          <p className="font-semibold text-sm">NEP 2020 — Convergence</p>
          <p className="text-xs opacity-90 mt-1">Inter-sectoral convergence between Health, Nutrition, and Education for holistic development</p>
        </div>
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg p-4">
          <TrendingUp className="h-5 w-5 mb-2" />
          <p className="font-semibold text-sm">Samagra Shiksha Synergy</p>
          <p className="text-xs opacity-90 mt-1">All NGO and ministry partnerships mapped to Samagra Shiksha AWP for unified planning</p>
        </div>
      </div>
    </Shell>
  )
}
