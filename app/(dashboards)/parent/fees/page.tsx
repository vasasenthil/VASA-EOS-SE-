import {
  IndianRupee,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  PageHeader,
  PageHeaderHeading,
  PageHeaderDescription,
} from "@/components/page-header"
import { DonutChart } from "@/components/charts/donut-chart"
import { CHART_COLORS } from "@/components/charts/chart-colors"

const FEE_SCHEDULE = [
  {
    term: "Term 1 (Apr–Jun)",
    component: "Tuition Fee",
    dueDate: "5 April 2025",
    amount: 3000,
    paid: 3000,
    status: "Paid",
    receiptNo: "RCP-2025-001",
    paidOn: "2 Apr 2025",
  },
  {
    term: "Term 2 (Jul–Sep)",
    component: "Tuition Fee",
    dueDate: "5 July 2025",
    amount: 3000,
    paid: 3000,
    status: "Paid",
    receiptNo: "RCP-2025-078",
    paidOn: "4 Jul 2025",
  },
  {
    term: "Term 3 (Oct–Dec)",
    component: "Tuition Fee",
    dueDate: "5 October 2025",
    amount: 3000,
    paid: 3000,
    status: "Paid",
    receiptNo: "RCP-2025-201",
    paidOn: "5 Oct 2025",
  },
  {
    term: "Term 4 (Jan–Mar)",
    component: "Tuition Fee",
    dueDate: "15 April 2026",
    amount: 3000,
    paid: 0,
    status: "Due",
    receiptNo: "—",
    paidOn: "—",
  },
]

const ADDITIONAL_FEES = [
  { component: "Library Fee", amount: 500, paid: 500, status: "Paid" },
  { component: "Sports Fee", amount: 300, paid: 300, status: "Paid" },
  { component: "Lab Fee", amount: 400, paid: 400, status: "Paid" },
  { component: "Exam Fee", amount: 800, paid: 0, status: "Due" },
]

const totalPaid = FEE_SCHEDULE.reduce((s, f) => s + f.paid, 0) +
  ADDITIONAL_FEES.reduce((s, f) => s + f.paid, 0)
const totalDue = FEE_SCHEDULE.reduce((s, f) => s + (f.amount - f.paid), 0) +
  ADDITIONAL_FEES.reduce((s, f) => s + (f.amount - f.paid), 0)
const totalAnnual = FEE_SCHEDULE.reduce((s, f) => s + f.amount, 0) +
  ADDITIONAL_FEES.reduce((s, f) => s + f.amount, 0)

const donutData = [
  { name: "Paid", value: totalPaid, color: CHART_COLORS.green },
  { name: "Due", value: totalDue, color: CHART_COLORS.red },
]

function statusIcon(status: string) {
  if (status === "Paid") return <CheckCircle2 className="h-4 w-4 text-green-500 inline mr-1" />
  if (status === "Due") return <Clock className="h-4 w-4 text-amber-500 inline mr-1" />
  return <AlertCircle className="h-4 w-4 text-red-500 inline mr-1" />
}

export default function ParentFeesPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader>
        <div>
          <PageHeaderHeading>Fee Management</PageHeaderHeading>
          <PageHeaderDescription>
            Annual fee schedule and payment status — Aryan Sharma · Class 9-A
          </PageHeaderDescription>
        </div>
      </PageHeader>

      {/* Summary + Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-blue-600" />
              Fee Summary
            </CardTitle>
            <CardDescription>Annual fee breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart
              data={donutData}
              height={240}
              innerRadius={55}
              outerRadius={90}
              centerLabel="Total"
              centerValue={`₹${totalAnnual.toLocaleString()}`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-center">
                <p className="text-xs text-green-700">Total Paid</p>
                <p className="text-2xl font-bold text-green-700">₹{totalPaid.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-center">
                <p className="text-xs text-red-700">Total Due</p>
                <p className="text-2xl font-bold text-red-700">₹{totalDue.toLocaleString()}</p>
              </div>
            </div>
            <div className="p-4 rounded-lg border bg-amber-50">
              <p className="font-medium text-sm">Next Payment Due</p>
              <p className="text-muted-foreground text-sm">Term 4 Tuition + Exam Fee</p>
              <p className="font-bold text-amber-700 mt-1">₹3,800 by 15 April 2026</p>
            </div>
            <Button className="w-full">Pay Outstanding Fees</Button>
          </CardContent>
        </Card>
      </div>

      {/* Fee Schedule Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tuition Fee Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Term</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Paid On</TableHead>
                <TableHead>Receipt</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {FEE_SCHEDULE.map((f) => (
                <TableRow key={f.term}>
                  <TableCell className="font-medium">{f.term}</TableCell>
                  <TableCell className="text-right">₹{f.amount.toLocaleString()}</TableCell>
                  <TableCell>{f.dueDate}</TableCell>
                  <TableCell>
                    <span className={f.status === "Paid" ? "text-green-600" : "text-amber-600"}>
                      {statusIcon(f.status)}{f.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{f.paidOn}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{f.receiptNo}</TableCell>
                  <TableCell>
                    {f.status === "Paid" ? (
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button size="sm">Pay</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Additional Fees */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Fees</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fee Component</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ADDITIONAL_FEES.map((f) => (
                <TableRow key={f.component}>
                  <TableCell className="font-medium">{f.component}</TableCell>
                  <TableCell className="text-right">₹{f.amount}</TableCell>
                  <TableCell className="text-right">₹{f.paid}</TableCell>
                  <TableCell>
                    <Badge variant={f.status === "Paid" ? "default" : "outline"}>
                      {f.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {f.status !== "Paid" && <Button size="sm">Pay</Button>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
