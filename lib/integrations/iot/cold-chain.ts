import { SovereignHttpClient } from "../http/client"

export interface ColdChainClientConfig { baseUrl: string; hmacSecret: string; apiKey?: string }
export interface ColdChainReading { deviceId: string; siteId: string; temperatureC: number; humidityPct?: number; observedAt: string }
export interface ColdChainAlert { deviceId: string; severity: "warning" | "critical"; message: string }

export class ColdChainClient {
  private readonly http: SovereignHttpClient
  constructor(config: ColdChainClientConfig) {
    this.http = new SovereignHttpClient({ baseUrl: config.baseUrl, hmacSecret: config.hmacSecret, bearerToken: config.apiKey, serviceName: "iot-cold-chain" })
  }
  ingest(reading: ColdChainReading, correlationId?: string): Promise<{ accepted: boolean; alert?: ColdChainAlert }> {
    return this.http.request({ method: "POST", path: "/telemetry/cold-chain", body: reading, correlationId })
  }
  latest(deviceId: string, correlationId?: string): Promise<ColdChainReading> {
    return this.http.request({ path: `/telemetry/cold-chain/${encodeURIComponent(deviceId)}/latest`, correlationId })
  }
}
