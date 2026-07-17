import { SovereignHttpClient } from "../http/client"

export interface NdearClientConfig { baseUrl: string; hmacSecret: string; apiKey?: string }
export interface RegistryEntry { id: string; type: "school" | "student" | "teacher" | "scheme"; status: string; attributes: Record<string, unknown> }

export class NdearClient {
  private readonly http: SovereignHttpClient
  constructor(config: NdearClientConfig) {
    this.http = new SovereignHttpClient({ baseUrl: config.baseUrl, hmacSecret: config.hmacSecret, bearerToken: config.apiKey, serviceName: "ndear-udise" })
  }
  registryLookup(type: RegistryEntry["type"], id: string, correlationId?: string): Promise<RegistryEntry> {
    return this.http.request({ path: `/registry/${encodeURIComponent(type)}/${encodeURIComponent(id)}`, correlationId })
  }
  federationStatus(correlationId?: string): Promise<{ ready: boolean; registries: string[] }> {
    return this.http.request({ path: "/federation/status", correlationId })
  }
}
