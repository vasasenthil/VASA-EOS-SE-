import { SovereignHttpClient } from "../http/client"

export interface DigiLockerClientConfig { baseUrl: string; clientId: string; clientSecret: string; token?: string }
export interface TokenResponse { accessToken: string; refreshToken?: string; expiresIn: number }
export interface CredentialPush { recipientId: string; credentialType: string; issuerId: string; payload: Record<string, unknown> }

export class DigiLockerClient {
  private readonly http: SovereignHttpClient
  constructor(private readonly config: DigiLockerClientConfig) {
    this.http = new SovereignHttpClient({ baseUrl: config.baseUrl, bearerToken: config.token, serviceName: "digilocker" })
  }
  tokenFromCode(code: string, redirectUri: string, correlationId?: string): Promise<TokenResponse> {
    return this.http.request({ method: "POST", path: "/oauth/token", body: { grant_type: "authorization_code", code, redirect_uri: redirectUri, client_id: this.config.clientId, client_secret: this.config.clientSecret }, correlationId })
  }
  refreshToken(refreshToken: string, correlationId?: string): Promise<TokenResponse> {
    return this.http.request({ method: "POST", path: "/oauth/token", body: { grant_type: "refresh_token", refresh_token: refreshToken, client_id: this.config.clientId, client_secret: this.config.clientSecret }, correlationId })
  }
  pushCredential(input: CredentialPush, correlationId?: string): Promise<{ credentialId: string; status: "accepted" | "rejected" }> {
    return this.http.request({ method: "POST", path: "/credentials", body: input, correlationId })
  }
  handleCallback(payload: unknown, correlationId?: string): Promise<{ accepted: boolean }> {
    return this.http.request({ method: "POST", path: "/callbacks/ack", body: payload, correlationId })
  }
}
