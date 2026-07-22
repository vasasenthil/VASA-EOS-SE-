type Env = Record<string, string | undefined>

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"])

function flagEnabled(value: string | undefined): boolean | undefined {
  if (value === undefined) return undefined

  const normalized = value.trim().toLowerCase()
  if (["1", "true", "yes", "active"].includes(normalized)) return true
  if (["0", "false", "no", "inactive", "expired", "cancelled", "canceled"].includes(normalized)) return false

  return undefined
}

export function hasActiveSubscription(env: Env = process.env): boolean {
  const explicitStatus = env.SUBSCRIPTION_STATUS?.trim().toLowerCase()
  if (explicitStatus) return ACTIVE_SUBSCRIPTION_STATUSES.has(explicitStatus)

  const explicitFlag = flagEnabled(env.SUBSCRIPTION_ACTIVE)
  if (explicitFlag !== undefined) return explicitFlag

  return false
}

export const checkSubscription = async (): Promise<boolean> => hasActiveSubscription()
