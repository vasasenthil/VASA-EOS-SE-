import assert from "node:assert/strict"
import { test, afterEach } from "node:test"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { VasaSession } from "@/lib/auth/session"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import { saveEnrolment, latestEnrolment } from "@/lib/enrolment/store"
import { recordDropoutRisk, listDropoutRisk } from "@/lib/dropout/store"
import { addSyllabusSubject, setSyllabusPct, listSyllabus } from "@/lib/syllabus/store"
afterEach(()=>__setTestDb(undefined))
test("two non-demo schools are isolated for enrolment, dropout and syllabus reads/writes", async()=>{
 const db=makeFakeDb();__setTestDb(db as unknown as SupabaseClient)
 const [a,b]=["11111111111","22222222222"].map(code=>({subject:code,roles:["PRINCIPAL"],metadata:{},tenant:{schoolId:code,stateId:"TN"}} satisfies VasaSession))
 for(const s of [a,b]) await db.from("school_tenant_bindings").insert({school_id:s.subject,udise_code:s.subject,tenant_id:`tenant-${s.subject}`,state_id:"TN"})
 for(const s of [a,b]) {
  await saveEnrolment({asOf:"2026-09-25",total:10,boys:5,girls:5},s)
  await recordDropoutRisk({name:s.subject,cls:"VII",absences:5,attendancePct:80,recentScorePct:70,feeDefault:false,siblingDropout:false},s)
 }
 const row=await addSyllabusSubject({subject:"math",teacher:"teacher",pct:50},a)
 assert.equal((await latestEnrolment(undefined,a))!.tenantId,`tenant-${a.subject}`)
 assert.equal((await listDropoutRisk(undefined,b))[0].name,b.subject)
 assert.equal((await listSyllabus(undefined,b)).length,0)
 assert.equal(await setSyllabusPct(row.id,90,undefined,b),false)
 assert.equal((await listSyllabus(undefined,a))[0].pct,50)
 await assert.rejects(()=>latestEnrolment(b.subject,a),/jurisdiction/)
 await assert.rejects(()=>saveEnrolment({tenantId:`tenant-${b.subject}`,asOf:"2026-09-25",total:1,boys:1,girls:0},a),/override/)
 await assert.rejects(()=>listDropoutRisk(undefined,{...a,tenant:{}}),/Select a school/)
})
