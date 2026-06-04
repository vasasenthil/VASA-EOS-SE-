// VASA-EOS(SE) — zero-trust security posture (Sec 4C).
// Never trust, always verify; assume breach; least privilege. Defence-in-depth
// across 7 layers. SECURITY_HEADERS are applied to every response by middleware.ts.

export interface SecurityLayer {
  layer: string
  controls: string[]
}

export const ZERO_TRUST_LAYERS: SecurityLayer[] = [
  { layer: "L7 Data", controls: ["Field-level PII encryption", "Tokenisation", "AES-256 at rest / TLS 1.3", "HSM-backed keys", "DLP on egress", "Right-to-erasure (DPDP)"] },
  { layer: "L6 Application", controls: ["OWASP Top 10 protection", "SAST/DAST/SCA in CI", "Secrets in Vault", "API rate limiting", "Input validation", "WAF"] },
  { layer: "L5 Identity", controls: ["MFA mandatory for officials", "Risk-based auth", "PAM + JIT access", "Session recording", "Continuous (behavioural) auth"] },
  { layer: "L4 Network", controls: ["Micro-segmentation", "mTLS between services", "Private endpoints", "DDoS protection", "Per-tenant VPC isolation"] },
  { layer: "L3 Endpoint", controls: ["EDR on all servers", "MDM", "Device certificate auth", "Jailbreak/root detection", "Remote wipe"] },
  { layer: "L2 Monitoring", controls: ["SIEM + 24x7 SOC", "UEBA", "Threat intelligence", "AI anomaly detection", "Automated incident response"] },
  { layer: "L1 Physical", controls: ["Data-centre access controls", "Biometric entry", "CCTV", "Fire suppression", "DR site geographic separation"] },
]

export const ZERO_TRUST_PRINCIPLES: string[] = [
  "Never trust, always verify",
  "Verify explicitly — authenticate, authorise, validate continuously",
  "Least privilege — just-in-time, just-enough, expire by default",
  "Assume breach — limit blast radius",
  "Micro-segmentation by workload & data sensitivity",
  "Identity-centric (identity is the perimeter)",
  "Data-centric — encryption everywhere",
]

// Applied to every response (middleware.ts). A strict CSP is documented as the
// target but not enforced here to avoid breaking framework inline assets.
export const SECURITY_HEADERS: { name: string; value: string }[] = [
  { name: "X-Frame-Options", value: "DENY" },
  { name: "X-Content-Type-Options", value: "nosniff" },
  { name: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { name: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { name: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { name: "X-DNS-Prefetch-Control", value: "off" },
]

export const INCIDENT_RESPONSE: string[] = [
  "6-hour CERT-In incident reporting",
  "72-hour DPDP breach notification",
  "Playbooks for 30+ incident types",
  "Forensic readiness + chain of custody",
  "Quarterly tabletop exercises · annual red-team",
]
