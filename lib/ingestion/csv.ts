// VASA-EOS(SE) — dependency-free RFC-4180 CSV parser for data ingestion.
//
// Real government data arrives as CSV exports (UDISE+, EMIS, scheme MIS). The project forbids new
// dependencies, so this is a small, correct CSV reader: it honours quoted fields containing commas,
// embedded newlines and escaped quotes (""), tolerates \r\n and \n line endings, and ignores a trailing
// blank line. Pure + client-safe.

/** Parse CSV text into rows of string cells. The first row is typically the header. */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false
  let i = 0
  const n = text.length

  const endField = () => {
    row.push(field)
    field = ""
  }
  const endRow = () => {
    endField()
    rows.push(row)
    row = []
  }

  while (i < n) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      field += ch
      i++
      continue
    }
    if (ch === '"') {
      inQuotes = true
      i++
      continue
    }
    if (ch === ",") {
      endField()
      i++
      continue
    }
    if (ch === "\r") {
      // swallow \r, handle the row on the following \n (or here if lone \r)
      if (text[i + 1] === "\n") {
        endRow()
        i += 2
        continue
      }
      endRow()
      i++
      continue
    }
    if (ch === "\n") {
      endRow()
      i++
      continue
    }
    field += ch
    i++
  }
  // flush the final field/row unless the file ended on a clean row break
  if (field !== "" || row.length > 0) endRow()
  // drop a trailing empty row (file ended with a newline)
  return rows.filter((r) => !(r.length === 1 && r[0] === ""))
}
