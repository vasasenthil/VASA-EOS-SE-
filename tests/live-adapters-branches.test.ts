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
function failFetch() {
  globalThis.fetch = (async () => ({ ok: false, status: 502, json: async () => ({}) })) as unknown as typeof fetch
}

const ENV_KEYS = [
  "UDISE_BASE_URL", "UDISE_API_KEY",
  "AGENTS_API_KEY",
  "BHASHINI_INFERENCE_URL", "BHASHINI_API_KEY",
  "DIGILOCKER_BASE_URL", "DIGILOCKER_API_KEY",
  "DBT_BASE_URL", "DBT_API_KEY",
  "AADHAAR_BASE_URL", "AADHAAR_API_KEY",
  "APAAR_BASE_URL", "APAAR_API_KEY",
]

afterEach(() => {
  globalThis.fetch = realFetch
  for (const k of ENV_KEYS) delete process.env[k]
})

// ── DIKSHA ────────────────────────────────────────────────────────────────────
test("DIKSHA applies subject/language filters and tolerates empty results", async () => {
  respondWith({ result: { content: [] } })
  const r = await liveDiksha.discover({ q: "x", subject: "Math", language: "ta" })
  assert.equal(r.ok, true)
  assert.deepEqual(r.data, [])
})

// ── UDISE ─────────────────────────────────────────────────────────────────────
test("UDISE search maps results and falls back across field names", async () => {
  process.env.UDISE_BASE_URL = "https://gw.test"
  respondWith({ results: [{ udiseCode: "1", name: "A" }] })
  const r = await liveUdise.search("egmore")
  assert.equal(r.ok, true)
  assert.equal(r.data?.length, 1)
})
test("UDISE search is unconfigured without a base URL", async () => {
  const r = await liveUdise.search("x")
  assert.equal(r.ok, false)
})
test("UDISE getSchool fails soft on upstream error", async () => {
  process.env.UDISE_BASE_URL = "https://gw.test"
  failFetch()
  const r = await liveUdise.getSchool("1")
  assert.equal(r.ok, false)
  assert.equal(r.mode, "live")
})

// ── Agents ────────────────────────────────────────────────────────────────────
test("Agents fail soft on upstream error", async () => {
  process.env.AGENTS_API_KEY = "k"
  failFetch()
  const r = await liveAgents.invoke({ agent: "analytics", input: "x" })
  assert.equal(r.ok, false)
})
test("Agents reject an empty completion", async () => {
  process.env.AGENTS_API_KEY = "k"
  respondWith({ choices: [] })
  const r = await liveAgents.invoke({ agent: "analytics", input: "x" })
  assert.equal(r.ok, false)
})
test("Agents include context when provided", async () => {
  process.env.AGENTS_API_KEY = "k"
  respondWith({ choices: [{ message: { content: "ok" } }] })
  const r = await liveAgents.invoke({ agent: "welfare", input: "calc", context: { amount: 100 } })
  assert.equal(r.ok, true)
})

// ── Bhashini ──────────────────────────────────────────────────────────────────
test("Bhashini translate is unconfigured without endpoint/key", async () => {
  const r = await liveLanguage.translate({ text: "hi", from: "en", to: "ta" })
  assert.equal(r.ok, false)
})
test("Bhashini translate rejects a missing target", async () => {
  process.env.BHASHINI_INFERENCE_URL = "https://b.test"
  process.env.BHASHINI_API_KEY = "k"
  respondWith({ pipelineResponse: [{ output: [] }] })
  const r = await liveLanguage.translate({ text: "hi", from: "en", to: "ta" })
  assert.equal(r.ok, false)
})
test("Bhashini TTS returns a base64 data URI", async () => {
  process.env.BHASHINI_INFERENCE_URL = "https://b.test"
  process.env.BHASHINI_API_KEY = "k"
  respondWith({ pipelineResponse: [{ audio: [{ audioContent: "QUJD" }] }] })
  const r = await liveLanguage.tts({ text: "வணக்கம்", language: "ta" })
  assert.equal(r.ok, true)
  assert.match(r.data?.audioRef ?? "", /^data:audio\/wav;base64,/)
})
test("Bhashini TTS is unconfigured without endpoint/key", async () => {
  const r = await liveLanguage.tts({ text: "x", language: "ta" })
  assert.equal(r.ok, false)
})

// ── DigiLocker ────────────────────────────────────────────────────────────────
test("DigiLocker push is unconfigured without gateway", async () => {
  const r = await liveDigiLocker.pushCredential({ apaarId: "A1", type: "Class10", payloadUrl: "u" })
  assert.equal(r.ok, false)
})
test("DigiLocker list maps documents when configured", async () => {
  process.env.DIGILOCKER_BASE_URL = "https://dl.test"
  process.env.DIGILOCKER_API_KEY = "k"
  respondWith({ documents: [{ uri: "d://1", docType: "Class10" }] })
  const r = await liveDigiLocker.listCredentials("A1")
  assert.equal(r.ok, true)
  assert.equal(r.data?.length, 1)
})
test("DigiLocker list is unconfigured without gateway", async () => {
  const r = await liveDigiLocker.listCredentials("A1")
  assert.equal(r.ok, false)
})

// ── DBT ───────────────────────────────────────────────────────────────────────
test("DBT disburse is unconfigured without gateway", async () => {
  const r = await liveDbt.disburse({ beneficiaryApaar: "A1", schemeCode: "S", amountInPaise: 1, reference: "r" })
  assert.equal(r.ok, false)
})
test("DBT status normalises failed and queued", async () => {
  process.env.DBT_BASE_URL = "https://dbt.test"
  process.env.DBT_API_KEY = "k"
  respondWith({ status: "failure", apbsReference: "A" })
  assert.equal((await liveDbt.status("A")).data?.status, "failed")
  respondWith({ status: "pending", apbsReference: "A" })
  assert.equal((await liveDbt.status("A")).data?.status, "queued")
})
test("DBT status is unconfigured without gateway", async () => {
  const r = await liveDbt.status("A")
  assert.equal(r.ok, false)
})

// ── Aadhaar ───────────────────────────────────────────────────────────────────
test("Aadhaar sendOtp is unconfigured without gateway", async () => {
  const r = await liveAadhaar.sendOtp("1234")
  assert.equal(r.ok, false)
})
test("Aadhaar sendOtp rejects a missing txn id", async () => {
  process.env.AADHAAR_BASE_URL = "https://aa.test"
  process.env.AADHAAR_API_KEY = "k"
  respondWith({})
  const r = await liveAadhaar.sendOtp("1234")
  assert.equal(r.ok, false)
})
test("Aadhaar verifyOtp falls back to status=success", async () => {
  process.env.AADHAAR_BASE_URL = "https://aa.test"
  process.env.AADHAAR_API_KEY = "k"
  respondWith({ status: "success" })
  const r = await liveAadhaar.verifyOtp({ txnId: "t", otp: "000000" })
  assert.equal(r.data?.verified, true)
})
test("Aadhaar verifyOtp is unconfigured without gateway", async () => {
  const r = await liveAadhaar.verifyOtp({ txnId: "t", otp: "0" })
  assert.equal(r.ok, false)
})

// ── APAAR ─────────────────────────────────────────────────────────────────────
test("APAAR provision is unconfigured without gateway", async () => {
  const r = await liveIdentity.provisionApaar({ name: "X" })
  assert.equal(r.ok, false)
})
test("APAAR getApaar maps a record", async () => {
  process.env.APAAR_BASE_URL = "https://ap.test"
  process.env.APAAR_API_KEY = "k"
  respondWith({ apaarId: "A1", name: "Learner" })
  const r = await liveIdentity.getApaar("A1")
  assert.equal(r.ok, true)
  assert.equal(r.data?.apaarId, "A1")
})
test("APAAR findDuplicate maps matches and results", async () => {
  process.env.APAAR_BASE_URL = "https://ap.test"
  process.env.APAAR_API_KEY = "k"
  respondWith({ matches: [{ apaarId: "A1", score: 0.9 }] })
  assert.equal((await liveIdentity.findDuplicate({ name: "X" })).data?.length, 1)
  respondWith({ results: [{ apaarId: "A2", score: 0.7 }] })
  assert.equal((await liveIdentity.findDuplicate({ name: "X" })).data?.[0].apaarId, "A2")
})
test("APAAR transfer maps an id and rejects a missing one", async () => {
  process.env.APAAR_BASE_URL = "https://ap.test"
  process.env.APAAR_API_KEY = "k"
  respondWith({ transferId: "tr1" })
  assert.equal((await liveIdentity.transfer({ apaarId: "A1", fromUdise: "1", toUdise: "2" })).data?.transferId, "tr1")
  respondWith({})
  assert.equal((await liveIdentity.transfer({ apaarId: "A1", fromUdise: "1", toUdise: "2" })).ok, false)
})
test("APAAR getApaar fails soft on upstream error", async () => {
  process.env.APAAR_BASE_URL = "https://ap.test"
  process.env.APAAR_API_KEY = "k"
  failFetch()
  assert.equal((await liveIdentity.getApaar("A1")).ok, false)
})
