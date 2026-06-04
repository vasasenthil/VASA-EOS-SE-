import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CATALOGUE, librarySummary, LIBRARY_FEATURES } from "@/lib/library"

export default function LibraryPage() {
  const s = librarySummary()
  const kpis = [
    { label: "Titles", value: String(s.titles) },
    { label: "Copies", value: String(s.copies) },
    { label: "Issued", value: String(s.issued) },
    { label: "Tamil share", value: `${s.tamilShare}%` },
  ]
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Library Management</PageHeaderHeading>
        <PageHeaderDescription>
          School + digital library with Anna Centenary Library federation, Tamil-first collection, reading tracking and
          NIPUN reading challenges — accessible to all learners.
        </PageHeaderDescription>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{k.label}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{k.value}</div></CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader><CardTitle>Catalogue</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead className="text-right">Available</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {CATALOGUE.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.title}</TableCell>
                    <TableCell className="text-muted-foreground">{b.author}</TableCell>
                    <TableCell><Badge variant={b.language === "Tamil" ? "default" : "outline"}>{b.language}</Badge></TableCell>
                    <TableCell className="text-right">{b.available}/{b.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Capabilities</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm list-disc list-inside text-muted-foreground">
              {LIBRARY_FEATURES.map((f) => (<li key={f}>{f}</li>))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}
