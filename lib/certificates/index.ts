// VASA-EOS(SE) — student certificates (Sec 52 / records).
// Transfer (TC), Bonafide and Conduct certificate issuance with reference numbers.
// Pure config + ref-number formatting; the UI issues and lists certificates.

export type CertType = "transfer" | "bonafide" | "conduct"

export interface CertTypeDef {
  type: CertType
  label: string
  prefix: string
  purpose: string
}

export const CERT_TYPES: CertTypeDef[] = [
  { type: "transfer", label: "Transfer Certificate (TC)", prefix: "TC", purpose: "On leaving / changing school" },
  { type: "bonafide", label: "Bonafide Certificate", prefix: "BC", purpose: "Proof of current enrolment" },
  { type: "conduct", label: "Conduct Certificate", prefix: "CC", purpose: "Character & conduct record" },
]

export function certTypeDef(type: CertType): CertTypeDef {
  return CERT_TYPES.find((c) => c.type === type) ?? CERT_TYPES[0]
}

/** Reference number, e.g. TC/2026/000123. */
export function certRef(type: CertType, seq: number, year = 2026): string {
  return `${certTypeDef(type).prefix}/${year}/${String(seq).padStart(6, "0")}`
}

export interface Certificate {
  id: string
  ref: string
  type: CertType
  studentApaar: string
  studentName: string
  issuedOn: string
  remarks?: string
}
