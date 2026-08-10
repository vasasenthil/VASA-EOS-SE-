export type CircuitState = "closed" | "open" | "half-open"

export interface CircuitBreakerOptions {
  failureThreshold?: number
  resetAfterMs?: number
  now?: () => number
}

export class CircuitOpenError extends Error {
  constructor(public readonly openedAt: number) {
    super("integration circuit is open")
    this.name = "CircuitOpenError"
  }
}

export class CircuitBreaker {
  private failures = 0
  private openedAt = 0
  private stateValue: CircuitState = "closed"
  private readonly failureThreshold: number
  private readonly resetAfterMs: number
  private readonly now: () => number

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5
    this.resetAfterMs = options.resetAfterMs ?? 60_000
    this.now = options.now ?? Date.now
  }

  state(): CircuitState {
    if (this.stateValue === "open" && this.now() - this.openedAt >= this.resetAfterMs) this.stateValue = "half-open"
    return this.stateValue
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state() === "open") throw new CircuitOpenError(this.openedAt)
    try {
      const result = await operation()
      this.failures = 0
      this.stateValue = "closed"
      return result
    } catch (error) {
      this.failures += 1
      if (this.failures >= this.failureThreshold) {
        this.openedAt = this.now()
        this.stateValue = "open"
      }
      throw error
    }
  }
}
