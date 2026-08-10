import { createHmac } from "node:crypto"
import { CircuitBreaker } from "./circuit-breaker"
import { correlationId, withCorrelation } from "./correlation"
import { fetchWithRetry, jsonOrThrow, type RetryOptions } from "./retry"

export interface SovereignHttpClientOptions {
  baseUrl: string
  serviceName: string
  bearerToken?: string
  hmacSecret?: string
  retry?: RetryOptions
  circuit?: CircuitBreaker
}

export interface IntegrationRequestOptions {
  method?: string
  path: string
  body?: unknown
  headers?: HeadersInit
  correlationId?: string
}

export class SovereignHttpClient {
  private readonly circuit: CircuitBreaker

  constructor(private readonly options: SovereignHttpClientOptions) {
    if (!options.baseUrl) throw new Error(`${options.serviceName} baseUrl is required`)
    this.circuit = options.circuit ?? new CircuitBreaker()
  }

  async request<T>(options: IntegrationRequestOptions): Promise<T> {
    const id = correlationId(options.correlationId)
    const url = new URL(options.path, this.options.baseUrl)
    const body = options.body === undefined ? undefined : JSON.stringify(options.body)
    const headers = withCorrelation(options.headers, id)
    headers.set("accept", "application/json")
    if (body) headers.set("content-type", "application/json")
    if (this.options.bearerToken) headers.set("authorization", `Bearer ${this.options.bearerToken}`)
    if (this.options.hmacSecret) headers.set("x-signature", this.sign(options.method ?? "GET", url.pathname, body ?? ""))

    return this.circuit.execute(async () => {
      console.info(JSON.stringify({ level: "info", message: "integration.request", service: this.options.serviceName, path: url.pathname, correlationId: id }))
      const response = await fetchWithRetry(url, { method: options.method ?? "GET", headers, body }, this.options.retry)
      return jsonOrThrow<T>(response)
    })
  }

  private sign(method: string, path: string, body: string): string {
    return createHmac("sha256", this.options.hmacSecret ?? "").update(`${method.toUpperCase()}\n${path}\n${body}`).digest("hex")
  }
}
