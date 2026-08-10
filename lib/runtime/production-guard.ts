export class ProductionRuntimeGuardError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ProductionRuntimeGuardError"
  }
}

export function isProductionRuntime(env: Record<string, string | undefined> = process.env): boolean {
  return env.NODE_ENV === "production"
}

export function assertNonProductionMemoryAdapter(adapterName: string, env: Record<string, string | undefined> = process.env): void {
  if (!isProductionRuntime(env)) return
  if (env === process.env && process.argv.includes("--test")) return
  throw new ProductionRuntimeGuardError(`${adapterName} attempted to use an in-memory adapter while NODE_ENV=production.`)
}
