import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ingest } from "@/lib/ingestion"
import { SCHOOL_SCHEMA, SAMPLE_CSV, totalEnrolment, type SchoolRecord } from "@/lib/ingestion/school-registry"

export default function DataIngestionPage() {
  // Run the real pipeline on the sample, then prove idempotency by re-loading.
  const first = ingest<SchoolRecord>(SAMPLE_CSV, SCHOOL_SCHEMA)
  const second = ingest<SchoolRecord>(SAMPLE_CSV, SCHOOL_SCHEMA, first.records)

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Real-data Ingestion (reference template)</PageHeaderHeading>
        <PageHeaderDescription>
          The schema-driven pipeline that makes real government data loadable for every CRUD module: parse CSV → map
          source columns to canonical fields → validate every cell → idempotently upsert by a natural key. Shown here on
          a UDISE+ school export keyed on the 11-digit UDISE code. Invalid rows are reported and skipped, never silently
          written; re-loading the same export inserts nothing new. Replace the sample with a real export to load real
          data — the adapter is unchanged.
        </PageHeaderDescription>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{first.rows}</div><div className="text-sm text-muted-foreground">Rows read</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-green-600 dark:text-green-500">{first.inserted}</div><div className="text-sm text-muted-foreground">Inserted</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{first.updated}</div><div className="text-sm text-muted-foreground">Updated (dedup)</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-red-600 dark:text-red-500">{first.skipped}</div><div className="text-sm text-muted-foreground">Skipped (invalid)</div></CardContent></Card>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            Idempotency check
            <Badge variant={second.inserted === 0 ? "default" : "outline"}>
              re-load inserted {second.inserted} — {second.inserted === 0 ? "stable" : "NOT idempotent"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Loading the same export a second time inserted <strong>{second.inserted}</strong> new records and updated{" "}
            <strong>{second.updated}</strong> in place — the registry holds {second.records.length} schools either way
            ({totalEnrolment(second.records).toLocaleString("en-IN")} students). No duplication.
          </p>
        </CardContent>
      </Card>

      {first.errors.length > 0 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="mb-3 text-sm font-semibold">Validation errors (rows skipped)</div>
            <Table>
              <TableHeader><TableRow><TableHead>Row</TableHead><TableHead>Column</TableHead><TableHead>Message</TableHead></TableRow></TableHeader>
              <TableBody>
                {first.errors.map((e, i) => (
                  <TableRow key={i}>
                    <TableCell>{e.row}</TableCell>
                    <TableCell className="font-mono text-xs">{e.column}</TableCell>
                    <TableCell className="text-sm text-red-600 dark:text-red-500">{e.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="mb-3 text-sm font-semibold">Loaded records</div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>UDISE Code</TableHead>
                <TableHead>School</TableHead>
                <TableHead>District</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Management</TableHead>
                <TableHead className="text-right">Enrolment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {first.records.map((s) => (
                <TableRow key={s.udiseCode}>
                  <TableCell className="font-mono text-xs">{s.udiseCode}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-muted-foreground">{s.district}</TableCell>
                  <TableCell className="text-sm">{s.category}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.management}</TableCell>
                  <TableCell className="text-right">{s.enrolment?.toLocaleString("en-IN") ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  )
}
