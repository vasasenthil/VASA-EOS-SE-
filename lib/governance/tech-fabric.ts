// VASA-EOS(SE) — Advanced Technology Fabric coverage register (Synthesis Brief SYN-TN-001), honest.
//
// Around the Native-AI core the brief promises an "advanced technology fabric": classical Machine
// Learning, Deep Learning, an IoT mesh, a permissioned Blockchain ledger, NFT credentials, Education
// DAOs, Edge Compute, and RAG with MCP. This self-verifying register maps each of those eight
// elements to what is ACTUALLY delivered in-repo, with an unbiased built/partial/pending status and a
// candid note. It consolidates the in-app analogues built for these pillars and is explicit that the
// heavy substrate (trained models, a distributed chain, on-chain mints, edge inference) is not.
//
// Honesty contract (tests/tech-fabric.test.ts): eight elements present once each; a built/partial
// element cites a repoRef that exists on disk; a pending element cites nothing; weighted coverage is a
// candid mid-range, never 100%. Edge Compute remains partial: offline-first read access is now
// implemented in app code, while school-level edge inference is still a deployment/runtime concern.

import { csvField } from "@/lib/csv"
import { type CapabilityStatus } from "@/lib/governance/role-capabilities"

export type FabricStatus = CapabilityStatus // "built" | "partial" | "pending"

export interface FabricElement {
  id: string
  name: string
  /** What the brief promises. */
  briefClaim: string
  /** What the repo actually delivers. */
  delivered: string
  status: FabricStatus
  note: string
  /** In-repo evidence (each exists on disk for built/partial; empty for pending). */
  repoRefs: string[]
  /** Aspects honestly NOT delivered in this repo. */
  pendingAspects: string[]
}

export const FABRIC_ELEMENTS: FabricElement[] = [
  {
    id: "ML",
    name: "Machine Learning",
    briefClaim: "Classical ML for forecasting and anomaly detection.",
    delivered: "Deterministic advisory analytics plus a DB-backed ML lifecycle: feature extraction, logistic training, registry, inference, drift monitoring, outcome feedback and retraining orchestration.",
    status: "partial",
    note: "The classical-ML runtime is now built in-repo and testable without external ML platforms. It remains partial until trained on live state data and governed production telemetry rather than synthetic seed data.",
    repoRefs: ["lib/ai/engines/analytics.ts", "lib/earlywarning/index.ts", "lib/ml/training/logistic.ts", "lib/ml/workers/drift-monitor.worker.ts"],
    pendingAspects: ["Live state-data training corpus and production calibration"],
  },
  {
    id: "DL",
    name: "Deep Learning",
    briefClaim: "DL for Tamil-first language, vision, speech, OCR and handwriting.",
    delivered: "The deterministic half of the vision/document pillar (OMR scoring + document field extraction); language/speech via the Bhashini seam.",
    status: "partial",
    note: "OMR answer-grid scoring and key/value document extraction run on OCR output and are tested; on-device camera capture, handwriting OCR and speech sit behind a model seam (Bhashini for language/ASR/TTS).",
    repoRefs: ["lib/ai/vision.ts", "lib/ai/pillars.ts"],
    pendingAspects: ["On-device handwriting OCR", "Live speech (ASR/TTS) models"],
  },
  {
    id: "IOT",
    name: "IoT Mesh",
    briefClaim: "IoT mesh for biometric attendance, environment, nutrition and infrastructure telemetry.",
    delivered: "Device-reading ingest → threshold classification (Normal/Warning/Critical) → live alerts across all four categories, audit-anchored, DB-migrated.",
    status: "partial",
    note: "The ingest-and-alert register is built, tested and migrated (/telemetry). The physical sensor mesh and the edge gateway that feeds it are a deployment seam — mock samples are ingested here.",
    repoRefs: ["lib/iot/store.ts"],
    pendingAspects: ["Physical sensor mesh + edge gateway transport"],
  },
  {
    id: "CHAIN",
    name: "Permissioned Blockchain",
    briefClaim: "Permissioned blockchain ledger for tamper-evident academic records.",
    delivered: "A hash-chained, append-only tamper-evident audit ledger (any retroactive edit breaks the chain; a health probe verifies it) anchoring the credential register.",
    status: "partial",
    note: "The tamper-evidence SUBSTANCE is built — a verifiable hash chain — and credentials anchor to it. It is an in-app analogue, NOT a distributed permissioned blockchain with multiple validating nodes.",
    repoRefs: ["lib/audit/trail.ts", "lib/credentials/store.ts"],
    pendingAspects: ["Distributed permissioned ledger with independent validating nodes"],
  },
  {
    id: "NFT",
    name: "NFT Credentials",
    briefClaim: "NFT credentials for verifiable, portable marksheets and micro-credentials.",
    delivered: "Soulbound (non-transferable) verifiable credentials — full lifecycle mint → content-hash → audit-anchor → verify → revoke, APAAR-keyed and portable.",
    status: "partial",
    note: "Delivers the substance — verifiable, portable, tamper-evident, offline-recomputable credentials — at /credentials. NOT an on-chain ERC-721 mint or a token transfer; soulbound by construction.",
    repoRefs: ["lib/credentials/store.ts"],
    pendingAspects: ["On-chain ERC-721 mint / wallet custody"],
  },
  {
    id: "DAO",
    name: "Education DAOs",
    briefClaim: "Education DAOs for on-chain accountable parent/teacher councils and SMC governance.",
    delivered: "RTE 75%-parent SMC with attributable one-member-one-vote ballots, distinct-voter quorum, a reproducible decision fingerprint and per-ballot audit-anchoring.",
    status: "partial",
    note: "Delivers accountable collective governance — every vote attributable, the decision reproducible and audit-chained — at /smc. NOT an on-chain token DAO or smart-contract execution.",
    repoRefs: ["lib/smc/store.ts"],
    pendingAspects: ["On-chain token DAO / smart-contract governance"],
  },
  {
    id: "EDGE",
    name: "Edge Compute",
    briefClaim: "Edge compute for school-level inference under low-bandwidth, offline-first conditions.",
    delivered: "Offline-first read access for critical routes is built with a service worker, cache policy and offline fallback page; write sync remains online-only.",
    status: "partial",
    note: "The PWA/offline-read runtime is implemented in app code and registered globally. School-level edge inference and a durable offline write queue are still not claimed.",
    repoRefs: ["public/sw.js", "lib/offline/cache-policy.ts", "app/offline/page.tsx"],
    pendingAspects: ["School-level edge inference", "Durable offline write queue / conflict resolution"],
  },
  {
    id: "RAGMCP",
    name: "RAG + MCP",
    briefClaim: "RAG with MCP for curriculum-grounded, verifiably cited, tool-augmented agents.",
    delivered: "Grounded RAG (answers only from the TN corpus, cites sources, refuses to invent) + an MCP-style typed tool registry (discover → validate → invoke → structured cited result).",
    status: "partial",
    note: "Both halves are built and tested (/ai-retrieval): retrieval-grounded cited answers and a uniform tool-invocation protocol under human authority. Deterministic in-app analogue — NOT a network MCP server/transport or an LLM.",
    repoRefs: ["lib/mcp/index.ts", "lib/ai/engines/conversational.ts"],
    pendingAspects: ["Network MCP transport", "LLM-backed generation"],
  },
]

export function elementById(id: string, items: FabricElement[] = FABRIC_ELEMENTS): FabricElement | undefined {
  return items.find((e) => e.id === id)
}

export function byFabricStatus(status: FabricStatus, items: FabricElement[] = FABRIC_ELEMENTS): FabricElement[] {
  return items.filter((e) => e.status === status)
}

export interface FabricSummary {
  total: number
  built: number
  partial: number
  pending: number
  /** Honest weighted coverage: built = 1, partial = 0.5, pending = 0. */
  coveragePct: number
}

export function fabricSummary(items: FabricElement[] = FABRIC_ELEMENTS): FabricSummary {
  const built = byFabricStatus("built", items).length
  const partial = byFabricStatus("partial", items).length
  const pending = byFabricStatus("pending", items).length
  const total = items.length
  const coveragePct = total === 0 ? 0 : Math.round(((built + partial * 0.5) / total) * 100)
  return { total, built, partial, pending, coveragePct }
}

export function toFabricCSV(items: FabricElement[] = FABRIC_ELEMENTS): string {
  const header = ["Id", "Element", "Brief claim", "Delivered", "Status", "Note", "Evidence", "Pending aspects"]
  const rows = items.map((e) =>
    [e.id, e.name, e.briefClaim, e.delivered, e.status, e.note, e.repoRefs.join("; "), e.pendingAspects.join("; ")]
      .map(csvField)
      .join(","),
  )
  return [header.map(csvField).join(","), ...rows].join("\n")
}
