import { test } from "node:test"
import assert from "node:assert/strict"
import { isDbUnreachable } from "@/lib/supabase/connectivity"

test("isDbUnreachable detects a thrown undici 'fetch failed'", () => {
  // the shape Supabase throws when the project is paused/unreachable.
  const err = new TypeError("fetch failed")
  assert.equal(isDbUnreachable(err), true)
})

test("isDbUnreachable inspects the error .cause code (ECONNREFUSED/ENOTFOUND/...)", () => {
  for (const code of ["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "ECONNRESET", "UND_ERR_CONNECT_TIMEOUT"]) {
    const err: any = new TypeError("fetch failed")
    err.cause = { code }
    assert.equal(isDbUnreachable(err), true, `cause.code=${code} must be treated as unreachable`)
  }
})

test("isDbUnreachable handles a top-level .code and a plain string", () => {
  assert.equal(isDbUnreachable({ code: "ENOTFOUND" }), true)
  assert.equal(isDbUnreachable("getaddrinfo ENOTFOUND db.example.supabase.co"), true)
  assert.equal(isDbUnreachable(new Error("socket hang up")), true)
})

test("isDbUnreachable does NOT match a genuine query error", () => {
  // a real PostgREST error (e.g. bad column, RLS denial) must stay a hard error, not degrade to demo.
  const queryErr = { message: 'column "foo" does not exist', code: "42703" }
  assert.equal(isDbUnreachable(queryErr), false)
  assert.equal(isDbUnreachable({ message: "duplicate key value violates unique constraint", code: "23505" }), false)
  assert.equal(isDbUnreachable(null), false)
  assert.equal(isDbUnreachable(undefined), false)
})
