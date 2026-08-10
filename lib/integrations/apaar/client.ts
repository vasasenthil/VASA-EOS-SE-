import { SovereignHttpClient } from "../http/client"

export interface ApaarClientConfig { baseUrl: string; hmacSecret: string; apiKey?: string }
export interface ApaarProfile { apaarId: string; name: string; dateOfBirth: string; status: "active" | "transferred" | "duplicate_review" }
export interface ApaarProvisionRequest { studentId: string; name: string; dateOfBirth: string; schoolUdise: string }

export class ApaarClient {
  private readonly http: SovereignHttpClient
  constructor(config: ApaarClientConfig) {
    this.http = new SovereignHttpClient({ baseUrl: config.baseUrl, hmacSecret: config.hmacSecret, bearerToken: config.apiKey, serviceName: "apaar" })
  }
  provision(input: ApaarProvisionRequest, correlationId?: string): Promise<ApaarProfile> {
    return this.http.request({ method: "POST", path: "/students", body: input, correlationId })
  }
  lookup(apaarId: string, correlationId?: string): Promise<ApaarProfile> {
    return this.http.request({ path: `/students/${encodeURIComponent(apaarId)}`, correlationId })
  }
  resolveDuplicate(apaarId: string, duplicateOf: string, correlationId?: string): Promise<{ resolved: boolean }> {
    return this.http.request({ method: "POST", path: `/students/${encodeURIComponent(apaarId)}/duplicate-resolution`, body: { duplicateOf }, correlationId })
  }
  transfer(apaarId: string, toUdise: string, correlationId?: string): Promise<ApaarProfile> {
    return this.http.request({ method: "POST", path: `/students/${encodeURIComponent(apaarId)}/transfer`, body: { toUdise }, correlationId })
  }
}
