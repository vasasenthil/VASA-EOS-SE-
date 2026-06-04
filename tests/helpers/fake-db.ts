// Minimal in-memory Supabase-like client for unit-testing the store DB path.
// Supports exactly the chained query surface the stores use:
//   from(t).insert(row)
//   from(t).select("*").eq(c, v).maybeSingle()
//   from(t).select("*").order(c, { ascending }).limit(n)
//   from(t).update(row).eq(c, v)
// Terminal builders are thenable, so `await builder` resolves to { data, error }.

type Row = Record<string, unknown>
interface Result {
  data: unknown
  error: null
}

function cmp(a: unknown, b: unknown): number {
  if (typeof a === "number" && typeof b === "number") return a - b
  return String(a).localeCompare(String(b))
}

class FakeQuery implements PromiseLike<Result> {
  private op: "select" | "insert" | "update" = "select"
  private filters: [string, unknown][] = []
  private orderBy: { col: string; ascending: boolean } | null = null
  private limitN: number | null = null
  private single = false
  private payload: Row | null = null
  private rows: Row[]

  constructor(rows: Row[]) {
    this.rows = rows
  }

  select(_cols?: string): this {
    return this
  }
  insert(payload: Row): this {
    this.op = "insert"
    this.payload = payload
    return this
  }
  update(payload: Row): this {
    this.op = "update"
    this.payload = payload
    return this
  }
  eq(col: string, val: unknown): this {
    this.filters.push([col, val])
    return this
  }
  order(col: string, opts?: { ascending?: boolean }): this {
    this.orderBy = { col, ascending: opts?.ascending !== false }
    return this
  }
  limit(n: number): this {
    this.limitN = n
    return this
  }
  maybeSingle(): this {
    this.single = true
    return this
  }

  private matches(r: Row): boolean {
    return this.filters.every(([c, v]) => r[c] === v)
  }

  private run(): Result {
    if (this.op === "insert") {
      this.rows.push({ ...(this.payload ?? {}) })
      return { data: null, error: null }
    }
    if (this.op === "update") {
      for (const r of this.rows) if (this.matches(r)) Object.assign(r, this.payload)
      return { data: null, error: null }
    }
    let out = this.rows.filter((r) => this.matches(r))
    if (this.orderBy) {
      const { col, ascending } = this.orderBy
      out = [...out].sort((a, b) => cmp(a[col], b[col]) * (ascending ? 1 : -1))
    }
    if (this.limitN != null) out = out.slice(0, this.limitN)
    return { data: this.single ? (out[0] ?? null) : out, error: null }
  }

  then<TResult1 = Result, TResult2 = never>(
    onfulfilled?: ((value: Result) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.run()).then(onfulfilled, onrejected)
  }
}

export interface FakeDb {
  from(name: string): FakeQuery
}

export function makeFakeDb(): FakeDb {
  const tables: Record<string, Row[]> = {}
  return {
    from(name: string): FakeQuery {
      return new FakeQuery((tables[name] ??= []))
    },
  }
}
