/**
 * AI Studio API helper
 *
 * Calls the Next.js proxy route which forwards to Medusa backend.
 * Auth is handled server-side via _medusa_jwt cookie.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GenerateRequest {
  prompt: string
  style: string
  occasion: string
  flavor: string
  weight?: string
  tiers?: string
  shape?: string
  color?: string
  cakeMessage?: string
  zodiacInfluence?: {
    sign: string
    suggestion: string
  }
  /** Only send when the customer gave a real birthdate (not the seasonal fallback) */
  age?: number
  imageCount?: number
  /** Which provider/model to use for this generation — the customer's own picker choice (itself sourced from
   * ai-cake-studio-config.json's aiImageModels list), validated server-side against provider-factory.ts's allowlist. */
  imageProvider?: string
  imageModel?: string
}

export interface DesignOutput {
  id: string
  imageUrl: string
  title: string
  description: string
  style: string
  /** Exact compiled prompt sent to the image provider — shown via "View AI Prompt" so it can be reused elsewhere */
  compiledPrompt?: string
}

export interface GenerateResponse {
  success: boolean
  generationId?: string
  designs?: DesignOutput[]
  creditsRemaining?: number
  /** Positive, LLM-generated horoscope-style quote — present only when zodiac influence was sent */
  horoscopeQuote?: string
  error?: string
  code?: string
}

// ─── API Call ────────────────────────────────────────────────────────────────

export async function generateCakeDesigns(
  request: GenerateRequest
): Promise<GenerateResponse> {
  try {
    const response = await fetch("/api/ai-studio/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    })

    const data: GenerateResponse = await response.json()
    return data
  } catch (error) {
    console.error("[AI Studio] Generation request failed:", error)
    return {
      success: false,
      error: "Network error. Please check your connection and try again.",
      code: "NETWORK_ERROR",
    }
  }
}
