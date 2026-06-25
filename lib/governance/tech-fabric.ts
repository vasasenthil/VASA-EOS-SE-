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
// candid mid-range, never 100%. Edge Compute / offline-first is disclosed as pending by design (a
// deployment/runtime concern, not application code).

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
    delivered: "Deterministic, explainable analytics + a weighted early-warning risk model (forecasting/anomaly signals) under human authority.",
    status: "partial",
    note: "The forecasting/anomaly SURFACE is built and tested as deterministic, explainable logic; trained statistical/ML models on live data are a seam — an ML model may refine, not replace, these signals.",
    repoRefs: ["lib/ai/engines/analytics.ts", "lib/earlywarning/index.ts"],
    pendingAspects: ["Trained ML models fitted on live state data"],
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
    delivered: "Not built in application code — edge inference and an offline-first runtime are a deployment/runtime concern.",
    status: "pending",
    note: "School-level edge inference and an offline-first (service-worker/PWA) runtime are deployment and hosting concerns, not application logic, so they are honestly pending. The adjacent low-bandwidth multi-channel delivery (SMS/IVR) is a separate, built capability — not edge compute.",
    repoRefs: [],
    pendingAspects: ["School-level edge inference", "Offline-first PWA / service-worker runtime"],
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
