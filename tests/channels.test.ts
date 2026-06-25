import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import {
  CHANNELS,
  IVR_FLOWS,
  channelById,
  flowById,
  byModality,
  unknownLanguages,
  ivrLanguages,
  channelSummary,
  toCSV,
} from "@/lib/accessibility/channels"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

test("channels are well-formed and include no-literacy voice options for outreach", () => {
  const ids = new Set<string>()
  for (const c of CHANNELS) {
    assert.ok(!ids.has(c.id), `duplicate ${c.id}`)
    ids.add(c.id)
    assert.ok(["visual", "voice", "text"].includes(c.modality))
    assert.ok(c.name && c.audience)
  }
  // The whole point: reach low-literacy guardians without reading.
  assert.ok(byModality("voice").length >= 1)
  assert.ok(CHANNELS.some((c) => !c.literacyRequired))
})

test("every IVR flow language code resolves in the language catalogue (self-verifying)", () => {
  assert.deepEqual(unknownLanguages(), [])
  assert.ok(ivrLanguages().includes("ta")) // Tamil-first
})

test("every IVR flow's backing module exists on disk (self-verifying)", () => {
  for (const f of IVR_FLOWS) {
    assert.ok(existsSync(join(repoRoot, f.backedBy)), `${f.id} → missing backing ${f.backedBy}`)
    assert.ok(f.keypad.length >= 1)
  }
})

test("lookups resolve; grievance IVR is multilingual and backed by the grievance module", () => {
  assert.equal(channelById("ivr")?.modality, "voice")
  const g = flowById("ivr_grievance")
  assert.equal(g?.backedBy, "lib/grievance")
  assert.ok((g?.languages.length ?? 0) >= 3)
  assert.equal(flowById("nope"), undefined)
})

test("summary tallies channels, voice/no-literacy/offline and IVR coverage", () => {
  const s = channelSummary()
  assert.equal(s.channels, CHANNELS.length)
  assert.equal(s.ivrFlows, IVR_FLOWS.length)
  assert.ok(s.voiceChannels >= 1 && s.noLiteracyChannels >= 1)
  assert.equal(s.ivrLanguages, ivrLanguages().length)
})

test("CSV has a header plus one row per channel", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Channel,Modality,Literacy required,Offline-capable,Audience")
  assert.equal(lines.length, CHANNELS.length + 1)
})
