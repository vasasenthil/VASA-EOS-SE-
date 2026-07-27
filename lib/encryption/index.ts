// VASA-EOS(SE) — application-layer envelope encryption helper.
//
// Infrastructure encryption remains a deployment concern, but application code
// now has a concrete AES-256-GCM envelope for sensitive payloads and deterministic
// hashing for integrity checks. Keys are supplied by the caller/secret manager.

import { createCipheriv, createDecipheriv, createHash, createSecretKey, randomBytes, scryptSync, timingSafeEqual } from "node:crypto"

export interface EncryptedEnvelope {
  alg: "AES-256-GCM"
  iv: string
  tag: string
  ciphertext: string
}

export function deriveEncryptionKey(secret: string, salt = "vasa-eos-se") {
  if (!secret.trim()) throw new Error("Encryption secret is required")
  return createSecretKey(scryptSync(secret, salt, 32) as unknown as Uint8Array)
}

export function encryptJson(value: unknown, secret: string, iv: Buffer = randomBytes(12)): EncryptedEnvelope {
  const cipher = createCipheriv("aes-256-gcm", deriveEncryptionKey(secret), iv as unknown as Uint8Array)
  const ciphertext = cipher.update(JSON.stringify(value), "utf8", "base64") + cipher.final("base64")
  return {
    alg: "AES-256-GCM",
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    ciphertext,
  }
}

export function decryptJson<T = unknown>(envelope: EncryptedEnvelope, secret: string): T {
  if (envelope.alg !== "AES-256-GCM") throw new Error("Unsupported encryption algorithm")
  const decipher = createDecipheriv("aes-256-gcm", deriveEncryptionKey(secret), Buffer.from(envelope.iv, "base64") as unknown as Uint8Array)
  decipher.setAuthTag(Buffer.from(envelope.tag, "base64") as unknown as Uint8Array)
  const plaintext = decipher.update(envelope.ciphertext, "base64", "utf8") + decipher.final("utf8")
  return JSON.parse(plaintext) as T
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex")
}

export function safeDigestEqual(left: string, right: string): boolean {
  const a = Buffer.from(left, "hex")
  const b = Buffer.from(right, "hex")
  return a.length === b.length && timingSafeEqual(a as unknown as Uint8Array, b as unknown as Uint8Array)
}
