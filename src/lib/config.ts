import Medusa from "@medusajs/medusa-js"

// Runtime-only: reads MEDUSA_BACKEND_URL from .env (never baked at build time)
const MEDUSA_BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL || "http://localhost:9001"

export const medusaClient = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  maxRetries: 3,
})
