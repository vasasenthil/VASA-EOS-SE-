import { SovereignHttpClient } from "../http/client"

export interface DbtClientConfig { baseUrl: string; hmacSecret: string; apiKey?: string }
export interface DisbursementRequest { beneficiaryId: string; accountToken: string; amountPaise: number; purpose: string }
export interface DisbursementStatus { disbursementId: string; status: "queued" | "credited" | "returned" | "failed"; reason?: string }

export class DbtClient {
  private readonly http: SovereignHttpClient
  constructor(config: DbtClientConfig) {
    this.http = new SovereignHttpClient({ baseUrl: config.baseUrl, hmacSecret: config.hmacSecret, bearerToken: config.apiKey, serviceName: "dbt-apbs" })
  }
  initiateDisbursement(input: DisbursementRequest, correlationId?: string): Promise<DisbursementStatus> {
    return this.http.request({ method: "POST", path: "/apbs/disbursements", body: input, correlationId })
  }
  disbursementStatus(disbursementId: string, correlationId?: string): Promise<DisbursementStatus> {
    return this.http.request({ path: `/apbs/disbursements/${encodeURIComponent(disbursementId)}`, correlationId })
  }
  acknowledgeSettlement(callbackPayload: unknown, correlationId?: string): Promise<{ accepted: boolean }> {
    return this.http.request({ method: "POST", path: "/apbs/settlement-callbacks", body: callbackPayload, correlationId })
  }
}
