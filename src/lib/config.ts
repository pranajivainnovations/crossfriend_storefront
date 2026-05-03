import Medusa from "@medusajs/medusa-js"

// Defaults to standard port for Medusa server
// MEDUSA_BACKEND_URL (server-only) takes precedence over NEXT_PUBLIC_MEDUSA_BACKEND_URL
let MEDUSA_BACKEND_URL = "http://localhost:9001"

if (process.env.MEDUSA_BACKEND_URL) {
  MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL
} else if (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL) {
  MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
}

export const medusaClient = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  maxRetries: 3,
})
