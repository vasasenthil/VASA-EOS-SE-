import { after } from "node:test"

// Mock the remote Auth service, not the production session/role implementation.
// Only explicitly issued fixture tokens are accepted; arbitrary payloads fail.
export function installAuthFixture() {
  const priorUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const priorKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const priorFetch = globalThis.fetch
  const users = new Map<string, Record<string, unknown>>()
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://auth-fixture.invalid"
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "fixture-anon-key"
  globalThis.fetch = async (input, init) => {
    const request = new Request(input, init)
    if (request.url === "https://auth-fixture.invalid/auth/v1/user") {
      const token = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? ""
      const user = users.get(token)
      return Response.json(user ?? { message: "Invalid token" }, { status: user ? 200 : 401 })
    }
    return priorFetch(input, init)
  }
  after(() => {
    globalThis.fetch = priorFetch
    if (priorUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL
    else process.env.NEXT_PUBLIC_SUPABASE_URL = priorUrl
    if (priorKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = priorKey
  })
  return (claims: Record<string, unknown>) => {
    const token = `fixture-${crypto.randomUUID()}`
    users.set(token, { id: claims.sub ?? "fixture-user", aud: "authenticated", role: "authenticated", created_at: new Date().toISOString(), ...claims })
    return token
  }
}
