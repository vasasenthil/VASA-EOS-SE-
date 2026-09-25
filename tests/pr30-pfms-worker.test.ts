import assert from "node:assert/strict"
import { test, afterEach } from "node:test"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { reconcilePfmsDate, reconciliationSchema } from "@/lib/workers/pfms-reconciliation.worker"
afterEach(()=>__setTestDb(undefined))
test("PFMS rejects malformed settlements and duplicate references",()=>{
 assert.equal(reconciliationSchema.safeParse({date:"2026-09-25",rows:[{referenceId:"p",status:"settled"}]}).success,false)
 assert.equal(reconciliationSchema.safeParse({date:"2026-09-25",rows:[{referenceId:"p",status:"processing"},{referenceId:"p",status:"failed"}]}).success,false)
})
test("PFMS commits a validated report once and propagates gateway/database failures",async()=>{
 let calls=0
 __setTestDb({async rpc(name:string){assert.equal(name,"platform_reconcile_pfms");calls++;return {error:null}}} as unknown as SupabaseClient)
 const client={async reconciliationFile(date:string){return {date,rows:[{referenceId:"p",status:"processing" as const}]}}}
 assert.equal(await reconcilePfmsDate("2026-09-25","test",client),1)
 await assert.rejects(()=>reconcilePfmsDate("2026-09-25","test",{async reconciliationFile(){throw new Error("gateway unavailable")}}),/gateway unavailable/)
 await assert.rejects(()=>reconcilePfmsDate("2026-09-25","test",{async reconciliationFile(){return {date:"2026-09-24",rows:[]}}}),/date mismatch/)
 assert.equal(calls,1)
})
