import assert from "node:assert/strict"
import { test, afterEach } from "node:test"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb, getDb } from "@/lib/persistence"
import { commitWithEvents } from "@/lib/events/outbox-publisher"
import { persistDomainMutation } from "@/lib/persistence/domain-mutation"
import { createEventEnvelope } from "@/lib/events/schemas"
import { makeFakeDb } from "./helpers/fake-db"
import { createScheme, getScheme, updateScheme } from "@/lib/stores/scheme-store"
import { proposeScheme, approveSchemeStep } from "@/lib/stores/scheme-approval-store"
import { getWorkflowInstance } from "@/lib/workflow-runtime/store"
import { runSchemeSystemSteps } from "@/lib/workflow-runtime/scheme-system-steps"
import { listOutboxEvents } from "@/lib/events/outbox-publisher"
import type { VasaSession } from "@/lib/auth/session"
afterEach(() => __setTestDb(undefined))
const actor = (subject: string, role: string, stateId="TN"): VasaSession => ({ subject, roles:[role], metadata:{}, tenant:{stateId} })
const proposal = {name:"School labs", description:"Science laboratories for rural schools", category:"infrastructure" as const, eligibility:"Government schools",budget:1000,fiscalYear:"2026-27",timeline:{milestones:[]},proposedBy:"author",justification:"Expand access to laboratory teaching",expectedOutcomes:["Better access"]}

test("business writes are staged and a failed RPC cannot leak independent writes", async () => {
 let rpcCalls=0, independentWrites=0
 __setTestDb({ from(){independentWrites++; throw new Error("independent write")}, async rpc(name: string,args: any){rpcCalls++; assert.equal(name,"platform_apply_domain_commands");assert.equal(args.commands.length,1);return {data:null,error:new Error("outbox unavailable")}} } as unknown as SupabaseClient)
 await assert.rejects(() => commitWithEvents(async () => { await persistDomainMutation("workflow_instances","insert",{id:crypto.randomUUID()}) },[]), /outbox unavailable/)
 assert.equal(independentWrites,0);assert.equal(rpcCalls,1)
})
test("future raw writes inside transaction callbacks are rejected before execution", async () => {
 const db=makeFakeDb();__setTestDb(db as unknown as SupabaseClient)
 await assert.rejects(() => commitWithEvents(async () => {await getDb()!.from("schemes").delete()},[]), /persistDomainMutation/)
})
test("scheme decisions reject skips, wrong roles, self-approval, wrong jurisdiction and replay", async () => {
 __setTestDb(makeFakeDb() as unknown as SupabaseClient)
 const scheme=await createScheme(proposal,"TN")
 await assert.rejects(()=>updateScheme(scheme.id,{status:"approved"}),/server-managed/)
 await proposeScheme(scheme.id,actor("author","SECRETARY"))
 const workflowId=(await getScheme(scheme.id))!.workflowId!
 await assert.rejects(()=>approveSchemeStep(workflowId,4,actor("s","SECRETARY"),"skip"),/state changed/)
 await assert.rejects(()=>approveSchemeStep(workflowId,0,actor("m","MINISTER"),"wrong"),/role required/)
 await assert.rejects(()=>approveSchemeStep(workflowId,0,actor("author","SECRETARY"),"self"),/own proposal/)
 await assert.rejects(()=>approveSchemeStep(workflowId,0,actor("s","SECRETARY","KA"),"cross"),/jurisdiction/)
 await approveSchemeStep(workflowId,0,actor("s","SECRETARY"),"clear")
 await assert.rejects(()=>approveSchemeStep(workflowId,0,actor("s2","SECRETARY"),"replay"),/state changed/)
 assert.equal((await getWorkflowInstance(workflowId))!.currentStepIndex,1)
 await approveSchemeStep(workflowId,1,actor("m","MINISTER"),"clear")
 assert.equal((await getWorkflowInstance(workflowId))!.currentStepIndex,3) // Cabinet skipped below threshold.
 assert.equal((await getScheme(scheme.id))!.status,"approved")
 const event=(await listOutboxEvents()).findLast(row=>row.event.eventType==="SchemeStepApproved")!.event
 await runSchemeSystemSteps(event)
 await runSchemeSystemSteps(event)
 assert.equal((await getScheme(scheme.id))!.status,"active")
 assert.equal((await getWorkflowInstance(workflowId))!.status,"completed")
})
test("competing approval requests cannot both advance the same step", async () => {
 __setTestDb(makeFakeDb() as unknown as SupabaseClient)
 const scheme=await createScheme(proposal,"TN");await proposeScheme(scheme.id,actor("author","SECRETARY"))
 const workflowId=(await getScheme(scheme.id))!.workflowId!
 const results=await Promise.allSettled([approveSchemeStep(workflowId,0,actor("s1","SECRETARY"),"clear"),approveSchemeStep(workflowId,0,actor("s2","SECRETARY"),"clear")])
 assert.equal(results.filter(result=>result.status==="fulfilled").length,1)
 assert.equal((await getWorkflowInstance(workflowId))!.currentStepIndex,1)
 assert.equal((await getScheme(scheme.id))!.approvedBy.length,1)
})
