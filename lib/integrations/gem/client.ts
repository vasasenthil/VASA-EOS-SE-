import { SovereignHttpClient } from "../http/client"

export interface GemClientConfig { baseUrl: string; hmacSecret: string; apiKey?: string }
export interface GemBid { tenderId: string; bidId: string; vendorId: string; amountPaise: number; technicalQualified: boolean }
export interface GemOrder { orderId: string; tenderId: string; vendorId: string; amountPaise: number; status: "placed" | "accepted" | "fulfilled" | "cancelled" }

export class GemClient {
  private readonly http: SovereignHttpClient
  constructor(config: GemClientConfig) {
    this.http = new SovereignHttpClient({ baseUrl: config.baseUrl, hmacSecret: config.hmacSecret, bearerToken: config.apiKey, serviceName: "gem" })
  }
  listBids(tenderId: string, correlationId?: string): Promise<{ bids: GemBid[] }> {
    return this.http.request({ path: `/tenders/${encodeURIComponent(tenderId)}/bids`, correlationId })
  }
  placeOrder(tenderId: string, bidId: string, correlationId?: string): Promise<GemOrder> {
    return this.http.request({ method: "POST", path: `/tenders/${encodeURIComponent(tenderId)}/orders`, body: { bidId }, correlationId })
  }
  orderStatus(orderId: string, correlationId?: string): Promise<GemOrder> {
    return this.http.request({ path: `/orders/${encodeURIComponent(orderId)}`, correlationId })
  }
}
