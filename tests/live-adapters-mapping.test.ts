import { test, afterEach } from "node:test"
import assert from "node:assert/strict"
import { liveDiksha } from "@/lib/integrations/live/diksha"
import { liveUdise } from "@/lib/integrations/live/udise"
import { liveLanguage } from "@/lib/integrations/live/bhashini"
import { liveDigiLocker } from "@/lib/integrations/live/digilocker"
import { liveDbt } from "@/lib/integrations/live/dbt"
import { liveAadhaar } from "@/lib/integrations/live/aadhaar"
import { liveIdentity } from "@/lib/integrations/live/apaar"

const realFetch = globalThis.fetch

function respondWith(json: unknown) {
  globalThis.fetch = (async () => ({ ok: true, status: 200, json: async () => json })) as unknown as typeof fetch
}

const ENV_KEYS = [
  "UDISE_BASE_URL", "UDISE_API_KEY",
  "BHASHINI_INFERENCE_URL", "BHASHINI_API_KEY", "BHASHINI_TRANSLATION_SERVICE_ID", "BHASHINI_TTS_SERVICE_ID",
  "DIGILOCKER_BASE_URL", "DIGILOCKER_API_KEY",
  "DBT_BASE_URL", "DBT_API_KEY",
  "AADHAAR_BASE_URL", "AADHAAR_API_KEY",
  "APAAR_BASE_URL", "APAAR_API_KEY",
]

afterEach(() => {
  globalThis.fetch = realFetch
  for (const k of ENV_KEYS) delete process.env[k]
})

test("DIKSHA falls back across content field shapes", async () => {
  // subject as array, no name, no identifier, only artifactUrl, no query.
  respondWith({ result: { content: [{ subject: ["Math", "Sci"], medium: ["ta"], artifactUrl: "a://x" }] } })
  const r = await liveDiksha.discover({})
  assert.equal(r.ok, true)
  const item = r.data?.[0]
  assert.equal(item?.subject, "Math")
  assert.equal(item?.title, "Untitled")
  assert.equal(item?.id, "")
  assert.equal(item?.url, "a://x")
})

test("UDISE uses Bearer auth and the Unknown-school fallback", async () => {
  process.env.UDISE_BASE_URL = "https://gw.test"
  process.env.UDISE_API_KEY = "secret"
  respondWith({ management: "Government" }) // no name/school_name -> Unknown school
  const r = await liveUdise.getSchool("33")
  assert.equal(r.ok, true)
  assert.equal(r.data?.name, "Unknown school")
  assert.equal(r.data?.managementType, "Government")
})

test("UDISE search reads the `schools` envelope", async () => {
  process.env.UDISE_BASE_URL = "https://gw.test"
  respondWith({ schools: [{ udise_code: "9", school_name: "B School" }] })
  const r = await liveUdise.search("b")
  assert.equal(r.data?.[0].name, "B School")
})

test("Bhashini sends an explicit translation serviceId when set", async () => {
  process.env.BHASHINI_INFERENCE_URL = "https://b.test"
  process.env.BHASHINI_API_KEY = "k"
  process.env.BHASHINI_TRANSLATION_SERVICE_ID = "svc-nmt"
  let body: unknown
  globalThis.fetch = (async (_u: string, init?: RequestInit) => {
    body = JSON.parse(String(init?.body))
    return { ok: true, status: 200, json: async () => ({ pipelineResponse: [{ output: [{ target: "ok" }] }] }) }
  }) as unknown as typeof fetch
  const r = await liveLanguage.translate({ text: "hi", from: "en", to: "ta" })
  assert.equal(r.ok, true)
  const tasks = (body as { pipelineTasks: { config: { serviceId?: string } }[] }).pipelineTasks
  assert.equal(tasks[0].config.serviceId, "svc-nmt")
})

test("Bhashini TTS rejects a response with no audio", async () => {
  process.env.BHASHINI_INFERENCE_URL = "https://b.test"
  process.env.BHASHINI_API_KEY = "k"
  process.env.BHASHINI_TTS_SERVICE_ID = "svc-tts"
  respondWith({ pipelineResponse: [{ audio: [] }] })
  const r = await liveLanguage.tts({ text: "x", language: "ta" })
  assert.equal(r.ok, false)
})

test("DigiLocker maps documentUri and default issuer/date", async () => {
  process.env.DIGILOCKER_BASE_URL = "https://dl.test"
  process.env.DIGILOCKER_API_KEY = "k"
  respondWith({ documentUri: "d://y", docType: "Class12" }) // no uri/issuer/issuedAt
  const r = await liveDigiLocker.pushCredential({ apaarId: "A1", type: "Class12", payloadUrl: "u" })
  assert.equal(r.data?.uri, "d://y")
  assert.equal(r.data?.issuer, "DigiLocker")
  assert.ok(r.data?.issuedAt)
})

test("DigiLocker list reads the `items` envelope", async () => {
  process.env.DIGILOCKER_BASE_URL = "https://dl.test"
  process.env.DIGILOCKER_API_KEY = "k"
  respondWith({ items: [{ uri: "d://1", type: "Class10" }] })
  const r = await liveDigiLocker.listCredentials("A1")
  assert.equal(r.data?.length, 1)
})

test("DBT maps a settled literal and apbs_reference field", async () => {
  process.env.DBT_BASE_URL = "https://dbt.test"
  process.env.DBT_API_KEY = "k"
  respondWith({ status: "settled", apbs_reference: "REF-1" })
  const r = await liveDbt.disburse({ beneficiaryApaar: "A1", schemeCode: "S", amountInPaise: 1, reference: "r" })
  assert.equal(r.data?.status, "settled")
  assert.equal(r.data?.apbsReference, "REF-1")
})

test("DBT status defaults to queued and reads the `reference` field", async () => {
  process.env.DBT_BASE_URL = "https://dbt.test"
  process.env.DBT_API_KEY = "k"
  respondWith({ reference: "REF-2" }) // no status -> queued
  const r = await liveDbt.status("REF-2")
  assert.equal(r.data?.status, "queued")
  assert.equal(r.data?.apbsReference, "REF-2")
})

test("DigiLocker tolerates a document missing uri and type", async () => {
  process.env.DIGILOCKER_BASE_URL = "https://dl.test"
  process.env.DIGILOCKER_API_KEY = "k"
  respondWith({ items: [{ issuedBy: "Issuer" }] })
  const r = await liveDigiLocker.listCredentials("A1")
  assert.equal(r.data?.[0].uri, "")
  assert.equal(r.data?.[0].type, "")
})

test("APAAR getApaar tolerates an empty record", async () => {
  process.env.APAAR_BASE_URL = "https://ap.test"
  process.env.APAAR_API_KEY = "k"
  respondWith({})
  const r = await liveIdentity.getApaar("A1")
  assert.equal(r.ok, true)
  assert.equal(r.data?.apaarId, "")
  assert.equal(r.data?.name, "")
})

test("Aadhaar sendOtp reads the `txn` field", async () => {
  process.env.AADHAAR_BASE_URL = "https://aa.test"
  process.env.AADHAAR_API_KEY = "k"
  respondWith({ txn: "tx-9" })
  const r = await liveAadhaar.sendOtp("1234")
  assert.equal(r.data?.txnId, "tx-9")
})

test("APAAR maps apaar_id + dob and a transfer `id`", async () => {
  process.env.APAAR_BASE_URL = "https://ap.test"
  process.env.APAAR_API_KEY = "k"
  respondWith({ apaar_id: "AP-1", name: "L", dob: "2015-05-01" })
  const got = await liveIdentity.getApaar("AP-1")
  assert.equal(got.data?.apaarId, "AP-1")
  assert.equal(got.data?.dateOfBirth, "2015-05-01")
  respondWith({ id: "tr-7" })
  const tr = await liveIdentity.transfer({ apaarId: "AP-1", fromUdise: "1", toUdise: "2" })
  assert.equal(tr.data?.transferId, "tr-7")
})
