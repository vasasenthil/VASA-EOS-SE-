const required = ["PRODUCTION_BASE_URL", "CUTOVER_SHARED_SECRET"] as const

class DeployVerifyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "DeployVerifyError"
  }
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new DeployVerifyError(`${name} is required for sovereign deployment verification`)
  return value
}

async function expectOk(url: URL, init?: RequestInit): Promise<Response> {
  const response = await fetch(url, init)
  if (!response.ok) throw new DeployVerifyError(`${url.pathname} returned ${response.status}`)
  return response
}

async function main(): Promise<void> {
  for (const name of required) requireEnv(name)
  const base = new URL(requireEnv("PRODUCTION_BASE_URL"))
  const secret = requireEnv("CUTOVER_SHARED_SECRET")

  await expectOk(new URL("/api/production/cutover", base), { headers: { "x-cutover-secret": secret } })
  await expectOk(new URL("/workers/outbox-dispatcher/health", base))
  await expectOk(new URL("/workers/sla-monitor/health", base))
  await expectOk(new URL("/metrics", base))

  const cutover = await (await expectOk(new URL("/api/production/cutover", base), { headers: { "x-cutover-secret": secret } })).json()
  if (!cutover.ready) throw new DeployVerifyError(`production cutover gate is not ready: ${JSON.stringify(cutover.gates ?? [])}`)
  console.log("Sovereign deployment verification passed")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
