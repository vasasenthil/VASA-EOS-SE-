// VASA-EOS(SE) — DEV-ONLY Supabase-REST shim: run the platform live against a local Postgres
// (no Docker, no cloud). Serves the subset of the PostgREST protocol that @supabase/supabase-js uses,
// executing against a local PostgreSQL via `psql` (the connecting superuser bypasses RLS, exactly as
// Supabase's service_role does). LOCAL VERIFICATION/DEV ONLY — NOT production. For production use a
// real Supabase/Postgres project (docs/DEPLOYMENT.md "one-shot go-live").
//
// Proven end-to-end: with this shim + a bootstrap-provisioned Postgres, the UNMODIFIED app runs in
// live-DB mode (NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55321, SUPABASE_SERVICE_ROLE_KEY set,
// NEXT_PUBLIC_DEMO_MODE unset) and reads/writes durable data.
//
// Usage: 1) run scripts/bootstrap.sql against a local PG16  2) node scripts/dev-supabase-shim.mjs
//        3) start the app with the env vars above.
//
import http from "node:http"
import { execFileSync } from "node:child_process"

const PORT = 55321
const PG = ["-h", "127.0.0.1", "-p", "55432", "-U", "postgres", "-d", "postgres", "-tAc"]
let reqCount = 0

function sql(q) {
  return execFileSync("psql", [...PG, q], { encoding: "utf8" }).trim()
}
function ident(s) { return '"' + String(s).replace(/"/g, '""') + '"' }
function lit(v) {
  if (v === null || v === undefined) return "NULL"
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NULL"
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE"
  if (typeof v === "object") return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`
  return `'${String(v).replace(/'/g, "''")}'`
}
const OPS = { eq: "=", neq: "<>", gt: ">", gte: ">=", lt: "<", lte: "<=", like: "like", ilike: "ilike" }
function whereFrom(params) {
  const clauses = []
  for (const [k, raw] of params) {
    if (["select", "order", "limit", "offset", "on_conflict"].includes(k)) continue
    const dot = raw.indexOf(".")
    const op = raw.slice(0, dot), val = raw.slice(dot + 1)
    if (op === "is") clauses.push(`${ident(k)} is ${val === "null" ? "null" : val}`)
    else if (op === "in") clauses.push(`${ident(k)} in (${val.replace(/^\(|\)$/g, "").split(",").map((x) => lit(x)).join(",")})`)
    else if (OPS[op]) clauses.push(`${ident(k)} ${OPS[op]} ${lit(val)}`)
  }
  return clauses.length ? " where " + clauses.join(" and ") : ""
}

const server = http.createServer((req, res) => {
  let body = ""
  req.on("data", (c) => (body += c))
  req.on("end", () => {
    const id = ++reqCount
    try {
      const u = new URL(req.url, "http://x")
      const m = u.pathname.match(/^\/rest\/v1\/([a-zA-Z0-9_]+)/)
      if (u.pathname.startsWith("/auth/v1")) { res.writeHead(200, { "content-type": "application/json" }); return res.end("{}") }
      if (!m) { res.writeHead(404); return res.end("[]") }
      const table = m[1]
      const params = [...u.searchParams.entries()]
      const accept = req.headers["accept"] || ""
      const prefer = req.headers["prefer"] || ""
      const single = accept.includes("vnd.pgrst.object")
      const where = whereFrom(params)
      let out

      if (req.method === "GET") {
        const sel = u.searchParams.get("select")
        const cols = !sel || sel === "*" ? "*" : sel.split(",").map((c) => ident(c.trim())).join(",")
        let q = `select ${cols} from public.${ident(table)}${where}`
        const order = u.searchParams.get("order")
        if (order) { const [c, dir] = order.split("."); q += ` order by ${ident(c)} ${dir === "desc" ? "desc" : "asc"}` }
        const limit = u.searchParams.get("limit"); if (limit) q += ` limit ${parseInt(limit, 10) || 0}`
        const rows = JSON.parse(sql(`select coalesce(json_agg(row_to_json(_q)),'[]'::json)::text from (${q}) _q`) || "[]")
        console.log(`#${id} GET ${table} -> ${rows.length} row(s)`)
        out = single ? JSON.stringify(rows[0] ?? null) : JSON.stringify(rows)
      } else if (req.method === "POST") {
        const parsed = body ? JSON.parse(body) : {}
        const rows = Array.isArray(parsed) ? parsed : [parsed]
        const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))]
        const vals = rows.map((r) => `(${cols.map((c) => lit(r[c])).join(",")})`).join(",")
        let q = `insert into public.${ident(table)} (${cols.map(ident).join(",")}) values ${vals}`
        if (prefer.includes("merge-duplicates")) {
          const tgt = u.searchParams.get("on_conflict") || "id"
          const sets = cols.filter((c) => c !== tgt).map((c) => `${ident(c)}=excluded.${ident(c)}`).join(",")
          q += ` on conflict (${tgt.split(",").map(ident).join(",")}) ${sets ? "do update set " + sets : "do nothing"}`
        }
        if (prefer.includes("return=representation")) {
          const r = JSON.parse(sql(`with x as (${q} returning *) select coalesce(json_agg(row_to_json(x)),'[]'::json)::text from x`) || "[]")
          console.log(`#${id} POST ${table} -> inserted ${r.length}`)
          out = single ? JSON.stringify(r[0] ?? null) : JSON.stringify(r)
        } else { sql(q); console.log(`#${id} POST ${table} -> inserted ${rows.length} (minimal)`); res.writeHead(201); return res.end("") }
      } else if (req.method === "PATCH") {
        const changes = JSON.parse(body || "{}")
        const sets = Object.keys(changes).map((c) => `${ident(c)}=${lit(changes[c])}`).join(",")
        sql(`update public.${ident(table)} set ${sets}${where}`)
        console.log(`#${id} PATCH ${table}`); res.writeHead(204); return res.end("")
      } else if (req.method === "DELETE") {
        sql(`delete from public.${ident(table)}${where}`)
        console.log(`#${id} DELETE ${table}`); res.writeHead(204); return res.end("")
      } else { res.writeHead(405); return res.end("") }

      res.writeHead(200, { "content-type": "application/json" })
      res.end(out)
    } catch (e) {
      console.log(`#${id} ERR ${req.method} ${req.url}: ${String(e).split("\n")[0]}`)
      res.writeHead(400, { "content-type": "application/json" }); res.end(JSON.stringify({ message: String(e) }))
    }
  })
})
server.listen(PORT, "127.0.0.1", () => console.log(`supabase-shim listening on http://127.0.0.1:${PORT} (PostgREST-over-psql)`))
