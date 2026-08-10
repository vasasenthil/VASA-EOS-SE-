export interface RetryOptions {
  attempts?: number
  baseDelayMs?: number
  maxDelayMs?: number
  jitterRatio?: number
  retryStatuses?: number[]
}

export class IntegrationHttpError extends Error {
  constructor(message: string, public readonly status?: number, public readonly body?: string) {
    super(message)
    this.name = "IntegrationHttpError"
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function backoff(attempt: number, options: Required<Omit<RetryOptions, "retryStatuses">>): number {
  const raw = Math.min(options.maxDelayMs, options.baseDelayMs * 2 ** attempt)
  const jitter = raw * options.jitterRatio * Math.random()
  return Math.round(raw + jitter)
}

export async function fetchWithRetry(input: RequestInfo | URL, init: RequestInit = {}, options: RetryOptions = {}): Promise<Response> {
  const retryStatuses = new Set(options.retryStatuses ?? [408, 425, 429, 500, 502, 503, 504])
  const resolved = {
    attempts: options.attempts ?? 3,
    baseDelayMs: options.baseDelayMs ?? 250,
    maxDelayMs: options.maxDelayMs ?? 5_000,
    jitterRatio: options.jitterRatio ?? 0.2,
  }

  let lastError: unknown
  for (let attempt = 0; attempt < resolved.attempts; attempt++) {
    try {
      const response = await fetch(input, init)
      if (!retryStatuses.has(response.status) || attempt === resolved.attempts - 1) return response
      lastError = new IntegrationHttpError(`retryable status ${response.status}`, response.status, await response.text())
    } catch (error) {
      lastError = error
      if (attempt === resolved.attempts - 1) break
    }
    await delay(backoff(attempt, resolved))
  }
  throw lastError instanceof Error ? lastError : new IntegrationHttpError("integration request failed")
}

export async function jsonOrThrow<T>(response: Response): Promise<T> {
  const body = await response.text()
  if (!response.ok) throw new IntegrationHttpError(`integration returned ${response.status}`, response.status, body)
  return body ? (JSON.parse(body) as T) : ({} as T)
}
