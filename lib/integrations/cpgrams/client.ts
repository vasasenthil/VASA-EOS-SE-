import { SovereignHttpClient } from "../http/client"

export interface CpgramsClientConfig { baseUrl: string; hmacSecret: string; apiKey?: string }
export interface CpgramsCase { grievanceId: string; citizenRef: string; status: "forwarded" | "under_process" | "disposed"; dueDate: string }

export class CpgramsClient {
  private readonly http: SovereignHttpClient
  constructor(config: CpgramsClientConfig) {
    this.http = new SovereignHttpClient({ baseUrl: config.baseUrl, hmacSecret: config.hmacSecret, bearerToken: config.apiKey, serviceName: "cpgrams" })
  }
  forwardCase(input: Omit<CpgramsCase, "status">, correlationId?: string): Promise<CpgramsCase> {
    return this.http.request({ method: "POST", path: "/grievances", body: input, correlationId })
  }
  caseStatus(grievanceId: string, correlationId?: string): Promise<CpgramsCase> {
    return this.http.request({ path: `/grievances/${encodeURIComponent(grievanceId)}`, correlationId })
  }
  dispose(grievanceId: string, note: string, correlationId?: string): Promise<{ disposed: boolean }> {
    return this.http.request({ method: "POST", path: `/grievances/${encodeURIComponent(grievanceId)}/dispose`, body: { note }, correlationId })
  }
}
