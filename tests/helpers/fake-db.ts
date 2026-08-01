// Minimal in-memory Supabase-like client for unit-testing the store DB path.
// Supports exactly the chained query surface the stores use:
//   from(t).insert(row)
//   from(t).select("*").eq(c, v).maybeSingle()
//   from(t).select("*").order(c, { ascending }).limit(n)
//   from(t).update(row).eq(c, v)
//   from(t).upsert(row)
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
  private op: "select" | "insert" | "upsert" | "update" | "delete" = "select"
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
  upsert(payload: Row, _opts?: unknown): this {
    this.op = "upsert"
    this.payload = payload
    return this
  }
  update(payload: Row): this {
    this.op = "update"
    this.payload = payload
    return this
  }
  delete(): this {
    this.op = "delete"
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
    if (this.op === "upsert") {
      const payload = this.payload ?? {}
      const existing = this.rows.find((r) =>
        (payload.id !== undefined && r.id === payload.id) ||
        (payload.scheme_id !== undefined && payload.fiscal_year !== undefined && r.scheme_id === payload.scheme_id && r.fiscal_year === payload.fiscal_year)
      )
      if (existing) Object.assign(existing, payload)
      else this.rows.push({ ...payload })
      return { data: null, error: null }
    }
    if (this.op === "update") {
      for (const r of this.rows) if (this.matches(r)) Object.assign(r, this.payload)
      return { data: null, error: null }
    }
    if (this.op === "delete") {
      for (let i = this.rows.length - 1; i >= 0; i--) if (this.matches(this.rows[i])) this.rows.splice(i, 1)
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
  rpc(name: string, args?: Record<string, unknown>): Promise<Result>
}

function outboxRow(event: Row): Row {
  const now = String(event.occurredAt ?? new Date().toISOString())
  return {
    id: event.id,
    aggregate_type: event.aggregateType,
    aggregate_id: event.aggregateId,
    event_type: event.eventType,
    payload: event.payload,
    status: "pending",
    created_at: now,
    processed_at: null,
    retry_count: 0,
    idempotency_key: event.idempotencyKey,
    locked_at: null,
    locked_by: null,
    last_error: null,
  }
}

export function makeFakeDb(): FakeDb {
  const tables: Record<string, Row[]> = {}
  return {
    from(name: string): FakeQuery {
      return new FakeQuery((tables[name] ??= []))
    },
    async rpc(name: string, args: Record<string, unknown> = {}): Promise<Result> {
      const outbox = (tables.platform_outbox ??= [])
      if (name === "platform_commit_outbox_events") {
        for (const event of (args.events as Row[] | undefined) ?? []) {
          if (!outbox.some((row) => row.idempotency_key === event.idempotencyKey)) outbox.push(outboxRow(event))
        }
        return { data: null, error: null }
      }
      if (name === "platform_claim_outbox_batch") {
        const workerId = args.worker_id
        const batchSize = Number(args.batch_size ?? 10)
        const claimed = outbox.filter((row) => row.status === "pending" && !row.locked_by).slice(0, batchSize)
        for (const row of claimed) {
          row.locked_by = workerId
          row.locked_at = new Date().toISOString()
        }
        return { data: claimed, error: null }
      }
      if (name === "platform_mark_outbox_processed") {
        const row = outbox.find((item) => item.id === args.event_id)
        if (row) {
          row.status = "processed"
          row.processed_at = new Date().toISOString()
          row.locked_by = null
          row.locked_at = null
        }
        return { data: null, error: null }
      }
      if (name === "platform_mark_outbox_failed") {
        const row = outbox.find((item) => item.id === args.event_id)
        if (row) {
          row.status = "failed"
          row.last_error = args.error_message
          row.locked_by = null
          row.locked_at = null
        }
        return { data: null, error: null }
      }
      return { data: null, error: null }
    },
  }
}
