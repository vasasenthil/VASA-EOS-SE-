import { test } from "node:test"
import assert from "node:assert/strict"
import { SECURITY_HEADERS } from "@/lib/security"

function header(name: string): string | undefined {
  return SECURITY_HEADERS.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value
}

test("header names are unique and non-empty", () => {
  const names = SECURITY_HEADERS.map((h) => h.name.toLowerCase())
  assert.equal(new Set(names).size, names.length, "duplicate security header")
  for (const h of SECURITY_HEADERS) assert.ok(h.name && h.value, `empty header ${h.name}`)
})

test("the core hardening headers are present and strict", () => {
  assert.equal(header("X-Frame-Options"), "DENY")
  assert.equal(header("X-Content-Type-Options"), "nosniff")
  assert.match(header("Strict-Transport-Security") ?? "", /max-age=\d+/)
  assert.match(header("Strict-Transport-Security") ?? "", /includeSubDomains/)
  assert.equal(header("Cross-Origin-Opener-Policy"), "same-origin")
  assert.match(header("Referrer-Policy") ?? "", /strict-origin/)
})

test("a Content-Security-Policy is enforced with the high-value directives", () => {
  const csp = header("Content-Security-Policy")
  assert.ok(csp, "CSP header must be present")
  // The four zero-breakage, high-value OWASP protections must be enforced.
  assert.match(csp!, /frame-ancestors 'none'/) // clickjacking (stronger than X-Frame-Options)
  assert.match(csp!, /base-uri 'self'/) // base-tag injection
  assert.match(csp!, /object-src 'none'/) // plugin XSS
  assert.match(csp!, /form-action 'self'/) // form hijacking / exfiltration
})
