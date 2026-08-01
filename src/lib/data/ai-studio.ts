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

/** Keep in sync with the backend's upload-validation.ts MAX_UPLOAD_BYTES. */
export const MAX_UPLOAD_MB = 8
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024

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

    // A request this large can be rejected by the webserver/proxy in front of
    // the app before it ever reaches our route handler — that response is an
    // HTML error page, not JSON, so it must be caught before response.json()
    // (which would otherwise throw and surface as a generic "network error").
    if (response.status === 413) {
      return {
        success: false,
        error: `That photo is too large to upload. Please choose one under ${MAX_UPLOAD_MB}MB.`,
        code: "FILE_TOO_LARGE",
      }
    }

    const contentType = response.headers.get("content-type") || ""
    if (!contentType.includes("application/json")) {
      return {
        success: false,
        error: "Upload failed. Please try a smaller photo, or try again in a moment.",
        code: "UPLOAD_FAILED",
      }
    }

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
