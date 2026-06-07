import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SECURITY_HEADERS } from "@/lib/security"

// Zero-trust: apply hardened security headers to every response (Sec 4C), and
// propagate a request id for tracing/correlation across logs and responses.
export function middleware(req: NextRequest) {
  const res = NextResponse.next()
  for (const h of SECURITY_HEADERS) {
    res.headers.set(h.name, h.value)
  }
  const reqId = req.headers.get("x-request-id") ?? crypto.randomUUID()
  res.headers.set("x-request-id", reqId)
  return res
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
}
