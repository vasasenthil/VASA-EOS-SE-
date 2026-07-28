import assert from "node:assert/strict"
import test from "node:test"

import { __setTestDb } from "@/lib/db"
import { ProductionDatabaseError, requireDb } from "@/lib/db/require-db"
import { makeFakeDb } from "./helpers/fake-db"

test.afterEach(() => {
  __setTestDb(undefined)
})

test("requireDb fails closed when no durable database is configured", () => {
  __setTestDb(null)
  assert.throws(() => requireDb(), ProductionDatabaseError)
})

test("requireDb returns the injected durable test database", () => {
  const db = makeFakeDb()
  __setTestDb(db as never)
  assert.equal(requireDb(), db)
})
