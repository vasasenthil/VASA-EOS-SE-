import { test, afterEach } from "node:test"
import assert from "node:assert/strict"
import { liveDiksha } from "@/lib/integrations/live/diksha"
import { liveUdise } from "@/lib/integrations/live/udise"
import { liveAgents } from "@/lib/integrations/live/agents"
import { liveLanguage } from "@/lib/integrations/live/bhashini"
import { liveDigiLocker } from "@/lib/integrations/live/digilocker"
import { liveDbt } from "@/lib/integrations/live/dbt"
import { liveAadhaar } from "@/lib/integrations/live/aadhaar"
import { liveIdentity } from "@/lib/integrations/live/apaar"

const realFetch = globalThis.fetch

function respondWith(json: unknown, ok = true, status = 200) {
  globalThis.fetch = (async () => ({ ok, status, json: async () => json })) as unknown as typeof fetch
}

const ENV_KEYS = [
  "UDISE_BASE_URL",
  "AGENTS_API_KEY",
  "BHASHINI_INFERENCE_URL",
  "BHASHINI_API_KEY",
  "DIGILOCKER_BASE_URL",
  "DIGILOCKER_API_KEY",
  "DBT_BASE_URL",
  "DBT_API_KEY",
  "AADHAAR_BASE_URL",
  "AADHAAR_API_KEY",
  "APAAR_BASE_URL",
  "APAAR_API_KEY",
]

afterEach(() => {
  globalThis.fetch = realFetch
  for (const k of ENV_KEYS) delete process.env[k]
})

test("DIKSHA maps composite-search content and tags mode live", async () => {
  respondWith({ result: { content: [{ identifier: "do_1", name: "Fractions", subject: "Math", medium: "ta", previewUrl: "u" }] } })
  const r = await liveDiksha.discover({ q: "fractions" })
  assert.equal(r.ok, true)
  assert.equal(r.mode, "live")
  assert.equal(r.data?.[0].id, "do_1")
  assert.equal(r.data?.[0].subject, "Math")
})

test("DIKSHA fails soft on upstream error", async () => {
  respondWith({}, false, 500)
  const r = await liveDiksha.discover({ q: "x" })
  assert.equal(r.ok, false)
  assert.equal(r.mode, "live")
})

test("UDISE maps snake_case fields when configured", async () => {
  process.env.UDISE_BASE_URL = "https://gw.test"
  respondWith({ udise_code: "33010100101", school_name: "GHSS Egmore", district: "Chennai" })
  const r = await liveUdise.getSchool("33010100101")
  assert.equal(r.ok, true)
  assert.equal(r.data?.udiseCode, "33010100101")
  assert.equal(r.data?.name, "GHSS Egmore")
})

test("UDISE reports unconfigured without a base URL", async () => {
  const r = await liveUdise.getSchool("x")
  assert.equal(r.ok, false)
  assert.match(r.error ?? "", /not configured/)
})

test("Agents return the chat completion content with confidence", async () => {
  process.env.AGENTS_API_KEY = "k"
  respondWith({ choices: [{ message: { content: "Here is a lesson plan." } }], model: "test-model" })
  const r = await liveAgents.invoke({ agent: "curriculum", input: "plan a lesson" })
  assert.equal(r.ok, true)
  assert.equal(r.data?.output, "Here is a lesson plan.")
  assert.ok((r.data?.confidence ?? 0) > 0)
})

test("Agents require a key", async () => {
  const r = await liveAgents.invoke({ agent: "curriculum", input: "x" })
  assert.equal(r.ok, false)
  assert.match(r.error ?? "", /AGENTS_API_KEY/)
})

test("Bhashini extracts the translation target", async () => {
  process.env.BHASHINI_INFERENCE_URL = "https://b.test"
  process.env.BHASHINI_API_KEY = "k"
  respondWith({ pipelineResponse: [{ taskType: "translation", output: [{ target: "வணக்கம்" }] }] })
  const r = await liveLanguage.translate({ text: "hello", from: "en", to: "ta" })
  assert.equal(r.ok, true)
  assert.equal(r.data?.text, "வணக்கம்")
})

test("Bhashini ASR is a typed not-wired result", async () => {
  process.env.BHASHINI_INFERENCE_URL = "https://b.test"
  process.env.BHASHINI_API_KEY = "k"
  const r = await liveLanguage.asr({ audioRef: "ref", language: "ta" })
  assert.equal(r.ok, false)
  assert.equal(r.mode, "live")
})

test("DigiLocker maps a pushed credential", async () => {
  process.env.DIGILOCKER_BASE_URL = "https://dl.test"
  process.env.DIGILOCKER_API_KEY = "k"
  respondWith({ uri: "digilocker://x", docType: "Class10", issuedBy: "DGE-TN" })
  const r = await liveDigiLocker.pushCredential({ apaarId: "AP1", type: "Class10", payloadUrl: "u" })
  assert.equal(r.ok, true)
  assert.equal(r.data?.uri, "digilocker://x")
  assert.equal(r.data?.type, "Class10")
})

test("DBT normalises a settled status", async () => {
  process.env.DBT_BASE_URL = "https://dbt.test"
  process.env.DBT_API_KEY = "k"
  respondWith({ status: "SUCCESS", apbsReference: "APBS-1" })
  const r = await liveDbt.disburse({ beneficiaryApaar: "AP1", schemeCode: "S1", amountInPaise: 100, reference: "r1" })
  assert.equal(r.ok, true)
  assert.equal(r.data?.status, "settled")
  assert.equal(r.data?.apbsReference, "APBS-1")
})

test("Aadhaar two-step OTP maps txn and verification", async () => {
  process.env.AADHAAR_BASE_URL = "https://aa.test"
  process.env.AADHAAR_API_KEY = "k"
  respondWith({ txnId: "t1" })
  const sent = await liveAadhaar.sendOtp("1234")
  assert.equal(sent.ok, true)
  assert.equal(sent.data?.txnId, "t1")
  respondWith({ verified: true })
  const verified = await liveAadhaar.verifyOtp({ txnId: "t1", otp: "000000" })
  assert.equal(verified.data?.verified, true)
})

test("APAAR maps a provisioned record", async () => {
  process.env.APAAR_BASE_URL = "https://ap.test"
  process.env.APAAR_API_KEY = "k"
  respondWith({ apaar_id: "APAAR-9", name: "New Learner", journeyStatus: "enrolled" })
  const r = await liveIdentity.provisionApaar({ name: "New Learner" })
  assert.equal(r.ok, true)
  assert.equal(r.data?.apaarId, "APAAR-9")
  assert.equal(r.data?.journeyStatus, "enrolled")
})
