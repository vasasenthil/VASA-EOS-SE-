import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SECURITY_HEADERS } from "@/lib/security"

// Zero-trust: apply hardened security headers to every response (Sec 4C).
export function middleware(_req: NextRequest) {
  const res = NextResponse.next()
  for (const h of SECURITY_HEADERS) {
    res.headers.set(h.name, h.value)
  }
  return res
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
}
