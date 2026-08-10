import { SovereignHttpClient } from "../http/client"

export interface PfmsClientConfig { baseUrl: string; hmacSecret: string; apiKey?: string }
export interface PaymentInitiation { sanctionId: string; beneficiaryId: string; amountPaise: number; schemeCode: string }
export interface PaymentStatus { referenceId: string; status: "accepted" | "processing" | "settled" | "failed"; settlementId?: string }
export interface SanctionCheck { sanctionId: string; availablePaise: number; valid: boolean }

export class PfmsClient {
  private readonly http: SovereignHttpClient
  constructor(config: PfmsClientConfig) {
    this.http = new SovereignHttpClient({ baseUrl: config.baseUrl, hmacSecret: config.hmacSecret, bearerToken: config.apiKey, serviceName: "pfms" })
  }
  checkSanction(sanctionId: string, correlationId?: string): Promise<SanctionCheck> {
    return this.http.request({ path: `/sanctions/${encodeURIComponent(sanctionId)}`, correlationId })
  }
  initiatePayment(input: PaymentInitiation, correlationId?: string): Promise<PaymentStatus> {
    return this.http.request({ method: "POST", path: "/payments", body: input, correlationId })
  }
  paymentStatus(referenceId: string, correlationId?: string): Promise<PaymentStatus> {
    return this.http.request({ path: `/payments/${encodeURIComponent(referenceId)}`, correlationId })
  }
  reconciliationFile(date: string, correlationId?: string): Promise<{ date: string; rows: PaymentStatus[] }> {
    return this.http.request({ path: `/reconciliation/${encodeURIComponent(date)}`, correlationId })
  }
}
