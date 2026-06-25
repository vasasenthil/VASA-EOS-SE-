import { test } from "node:test"
import assert from "node:assert/strict"
import { parseCSV } from "@/lib/ingestion/csv"

test("parses simple rows", () => {
  const rows = parseCSV("a,b,c\n1,2,3\n4,5,6")
  assert.deepEqual(rows, [["a", "b", "c"], ["1", "2", "3"], ["4", "5", "6"]])
})

test("honours quoted fields with commas and embedded newlines", () => {
  const rows = parseCSV('name,note\n"Smith, John","line1\nline2"\n')
  assert.deepEqual(rows, [["name", "note"], ["Smith, John", "line1\nline2"]])
})

test("handles escaped quotes and \\r\\n line endings", () => {
  const rows = parseCSV('q\r\n"she said ""hi"""\r\n')
  assert.deepEqual(rows, [["q"], ['she said "hi"']])
})

test("drops a trailing blank line but keeps intentional empty cells", () => {
  const rows = parseCSV("a,b\n1,\n")
  assert.deepEqual(rows, [["a", "b"], ["1", ""]])
})

test("empty input yields no rows", () => {
  assert.deepEqual(parseCSV(""), [])
})
