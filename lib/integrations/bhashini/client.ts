import { SovereignHttpClient } from "../http/client"

export interface BhashiniClientConfig { baseUrl: string; apiKey: string }
export interface TranslationRequest { sourceLanguage: string; targetLanguage: string; text: string }
export interface SpeechRequest { language: string; audioBase64?: string; text?: string }

export class BhashiniClient {
  private readonly http: SovereignHttpClient
  constructor(config: BhashiniClientConfig) {
    this.http = new SovereignHttpClient({ baseUrl: config.baseUrl, bearerToken: config.apiKey, serviceName: "bhashini" })
  }
  translate(input: TranslationRequest, correlationId?: string): Promise<{ translatedText: string }> {
    return this.http.request({ method: "POST", path: "/translate", body: input, correlationId })
  }
  textToSpeech(input: SpeechRequest, correlationId?: string): Promise<{ audioBase64: string; mimeType: string }> {
    return this.http.request({ method: "POST", path: "/tts", body: input, correlationId })
  }
  speechToText(input: SpeechRequest, correlationId?: string): Promise<{ transcript: string; confidence: number }> {
    return this.http.request({ method: "POST", path: "/asr", body: input, correlationId })
  }
}
