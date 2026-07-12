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
  color?: string
  cakeMessage?: string
  zodiacInfluence?: {
    sign: string
    suggestion: string
  }
  imageCount?: number
}

export interface DesignOutput {
  id: string
  imageUrl: string
  title: string
  description: string
  style: string
}

export interface GenerateResponse {
  success: boolean
  generationId?: string
  designs?: DesignOutput[]
  creditsRemaining?: number
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
