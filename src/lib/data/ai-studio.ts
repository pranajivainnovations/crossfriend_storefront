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
  /** id returned by uploadReferenceImage() — ownership is verified server-side against the logged-in customer.
   * Purpose isn't repeated here — it's already fixed on the upload itself, set at upload time. */
  referenceUploadId?: string
}

export type ReferencePurpose = "theme_reference" | "recreate_cake" | "photo_cake"

export interface UploadResponse {
  success: boolean
  uploadId?: string
  error?: string
  code?: string
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

/**
 * Uploads a personal reference image (theme inspiration / recreate-this-cake
 * / photo-cake source). Stored privately, scoped to the logged-in customer —
 * nothing is analyzed at upload time, only when a generation actually uses it.
 */
export async function uploadReferenceImage(
  file: File,
  purpose: ReferencePurpose
): Promise<UploadResponse> {
  try {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("purpose", purpose)

    const response = await fetch("/api/ai-studio/uploads", {
      method: "POST",
      body: formData,
    })

    const data: UploadResponse = await response.json()
    return data
  } catch (error) {
    console.error("[AI Studio] Upload failed:", error)
    return {
      success: false,
      error: "Network error. Please check your connection and try again.",
      code: "NETWORK_ERROR",
    }
  }
}
